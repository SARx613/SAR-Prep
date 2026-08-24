/* Seeds the question bank into Neon.
 *
 * Idempotent by design: every generated item carries a deterministic
 * `source` tag derived from its seed, and the script clears previously
 * generated rows before inserting. Hand-authored rows (any row whose
 * source is not the generator tag) are left untouched, so this can be
 * re-run safely as templates are added.
 *
 *   npx tsx scripts/seed-questions.ts [--per N] [--seed N] [--dry]
 */

// Env comes from `tsx --env-file=.env.local`; the db module reads
// DATABASE_URL at import time, so it cannot be loaded from inside this
// file (ESM hoists imports above any statement here).
import { eq, inArray } from 'drizzle-orm';
import { db, figures, passages, questions } from '../src/db';
import { generateBank } from '../src/lib/generators';

const SOURCE = 'generated:sar-prep-v1';

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}

async function main() {
  const per = arg('per', 4);
  const seed = arg('seed', 20260824);
  const dry = process.argv.includes('--dry');

  console.log(`Generating bank (per-cell=${per}, seed=${seed})…`);
  const bank = generateBank({ perTemplateDifficulty: per, seed });

  console.log(`  ${bank.stats.generated} valid items`);
  console.log(`  ${bank.stats.rejected} rejected, ${bank.stats.duplicates} duplicates dropped`);
  console.log(`  by section: ${JSON.stringify(bank.stats.bySection)}`);
  console.log(`  by type:    ${JSON.stringify(bank.stats.byType)}`);

  if (dry) {
    console.log('\n--dry given, nothing written.');
    return;
  }

  // Clear previously generated rows. Questions cascade from passages and
  // figures, but standalone generated questions must go explicitly.
  console.log('\nClearing previously generated rows…');
  const oldQ = await db
    .delete(questions)
    .where(eq(questions.source, SOURCE))
    .returning({ id: questions.id });
  const oldP = await db
    .delete(passages)
    .where(eq(passages.source, SOURCE))
    .returning({ id: passages.id });
  console.log(`  removed ${oldQ.length} questions, ${oldP.length} passages`);

  // Figures have no source column, so drop the ones no question references.
  const orphanFigures = await db.select({ id: figures.id }).from(figures);
  if (orphanFigures.length) {
    const referenced = await db
      .select({ figureId: questions.figureId })
      .from(questions);
    const live = new Set(referenced.map((r) => r.figureId).filter(Boolean));
    const dead = orphanFigures.filter((f) => !live.has(f.id)).map((f) => f.id);
    if (dead.length) {
      await db.delete(figures).where(inArray(figures.id, dead));
      console.log(`  removed ${dead.length} orphaned figures`);
    }
  }

  // Standalone questions, inserting figures first so the FK resolves.
  console.log('\nInserting questions…');
  let inserted = 0;

  for (const q of bank.questions) {
    let figureId: string | null = null;
    if (q.figure) {
      const [row] = await db
        .insert(figures)
        .values({
          kind: q.figure.kind,
          title: q.figure.title ?? null,
          data: q.figure.data,
          notes: q.figure.notes ?? null,
        })
        .returning({ id: figures.id });
      figureId = row.id;
    }

    await db.insert(questions).values({
      type: q.type,
      section: q.section,
      topic: q.topic,
      subtopic: q.subtopic ?? null,
      difficulty: q.difficulty,
      figureId,
      stem: q.stem,
      content: q.content,
      answer: q.answer,
      explanation: q.explanation,
      source: SOURCE,
      tags: [...q.tags, `template:${q.template}`],
    });
    inserted++;
  }

  // Passages with their attached questions.
  console.log('Inserting passages…');
  for (const { spec, questions: qs } of bank.passages) {
    const [p] = await db
      .insert(passages)
      .values({
        title: spec.title,
        body: spec.body,
        wordCount: spec.body.split(/\s+/).length,
        topic: spec.topic,
        difficulty: spec.difficulty,
        source: SOURCE,
      })
      .returning({ id: passages.id });

    for (const q of qs) {
      await db.insert(questions).values({
        type: q.type,
        section: q.section,
        topic: q.topic,
        subtopic: q.subtopic ?? null,
        difficulty: q.difficulty,
        passageId: p.id,
        stem: q.stem,
        content: q.content,
        answer: q.answer,
        explanation: q.explanation,
        source: SOURCE,
        tags: [...q.tags, `template:${q.template}`],
      });
      inserted++;
    }
  }

  console.log(`\nDone: ${inserted} questions, ${bank.passages.length} passages.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
