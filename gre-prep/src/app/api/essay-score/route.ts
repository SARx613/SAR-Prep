import { auth } from '@/auth';

/* Optional AI essay estimate. Off unless ANTHROPIC_API_KEY is set; the app
 * never depends on it. Signed-in users only, and capped per day so it cannot
 * run away (in-memory per server instance: a best-effort guard, not billing). */

const DAILY_LIMIT = 8;
const used = new Map<string, { day: string; n: number }>();

const RUBRIC = `You are an experienced rater for the GRE "Analyze an Issue" task. Score the essay from 0 to 6 in half-point steps using these levels:
6 Outstanding: clear, insightful position; fully developed with compelling reasons/examples; well focused and organised; fluent, precise language; superior command of standard written English (minor errors allowed).
5 Strong: clear, well-considered position; logically sound reasons/well-chosen examples; generally well organised; clear language; facility with conventions.
4 Adequate: clear position; relevant reasons/examples; adequately focused and organised; acceptable clarity; generally controlled conventions.
3 Limited: vague or limited treatment of the task; weak or unsupported reasons; limited focus/organisation; language problems that reduce clarity.
2 Seriously flawed: largely disregards the task directions; few if any relevant reasons; poorly organised; serious language problems that obscure meaning.
1 Fundamentally deficient: little or no understanding of the issue or ability to organise; pervasive errors.
0: off topic, copies the prompt, or unreadable.
Raters do not look for a "right" position. Judge how well the essay follows the specific task instructions given. Be honest and calibrated; a 30-minute draft is rarely a 6.
Reply with ONLY a JSON object: {"score": number, "summary": "2 sentences", "strengths": ["..",".."], "improvements": ["..","..",".."]}. The three improvements must be concrete actions the writer can take next time.`;

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: 'AI scoring is not enabled on this server.' }, { status: 501 });

  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return Response.json({ error: 'Sign in to use AI scoring.' }, { status: 401 });

  const day = new Date().toISOString().slice(0, 10);
  const rec = used.get(uid);
  const n = rec && rec.day === day ? rec.n : 0;
  if (n >= DAILY_LIMIT) return Response.json({ error: `Daily limit of ${DAILY_LIMIT} reached.` }, { status: 429 });

  let body: { claim?: string; instruction?: string; text?: string };
  try { body = await req.json(); } catch { return Response.json({ error: 'Bad request.' }, { status: 400 }); }
  const text = (body.text ?? '').slice(0, 12_000);
  if (text.trim().split(/\s+/).length < 40) return Response.json({ error: 'Write at least 40 words first.' }, { status: 400 });
  used.set(uid, { day, n: n + 1 });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5',
      max_tokens: 900,
      system: RUBRIC,
      messages: [{ role: 'user', content: `ISSUE: ${body.claim ?? ''}\n\nINSTRUCTIONS: ${body.instruction ?? ''}\n\nESSAY:\n${text}` }],
    }),
  });
  if (!res.ok) return Response.json({ error: 'The scoring service is unavailable right now.' }, { status: 502 });

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const raw = data.content?.find((c) => c.type === 'text')?.text ?? '';
  try {
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) as { score: number; summary: string; strengths?: string[]; improvements: string[] };
    const score = Math.min(6, Math.max(0, Math.round(Number(j.score) * 2) / 2));
    return Response.json({ score, summary: String(j.summary), strengths: j.strengths ?? [], improvements: (j.improvements ?? []).slice(0, 3).map(String) });
  } catch {
    return Response.json({ error: 'Could not read the scoring result. Try again.' }, { status: 502 });
  }
}
