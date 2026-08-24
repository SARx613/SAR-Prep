/* Reading Comprehension.
 *
 * Original passages in the registers the GRE actually uses — natural
 * science, social science, and humanities criticism — each with questions
 * covering the skills ETS names: main idea, inference, authorial purpose,
 * and select-in-passage. Passages are deliberately argumentative rather
 * than merely informative, since almost every RC question turns on the
 * structure of a claim rather than on recall of a detail.
 */

import type { RCContent, ChoiceAnswer, InPassageAnswer } from '@/types/questions';
import { LETTERS } from './format';
import type { Rng } from './rng';
import type { GeneratedQuestion } from './types';

export interface PassageSpec {
  title: string;
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  body: string;
  questions: RCQuestionSpec[];
}

interface RCQuestionSpec {
  stem: string;
  /** Key first; the rest are distractors. Order is randomized on build. */
  choices?: string[];
  /** For select_all: the credited subset, given by text. */
  correctTexts?: string[];
  /** For select_in_passage. */
  sentence?: string;
  paragraphIndex?: number;
  format: 'select_one' | 'select_all' | 'select_in_passage';
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export const PASSAGES: PassageSpec[] = [
  {
    title: 'Mycorrhizal networks',
    topic: 'natural science',
    difficulty: 4,
    body: `For most of the twentieth century, forest ecologists treated trees as competitors locked in a contest for light, water, and soil nutrients. The discovery that most forest trees are joined below ground by mycorrhizal fungi — filaments that link root systems across species — complicated that picture considerably. Isotope-tracing experiments have shown that carbon moves through these networks from tree to tree, and that the direction of movement often runs from larger, better-lit individuals toward smaller, shaded ones.

Some researchers have read this transfer as evidence of cooperation, arguing that forests behave as integrated systems in which mature trees subsidize their neighbors. The inference is tempting but premature. The fungi themselves are not passive conduits; they are organisms with interests of their own, and carbon that moves between trees passes through fungal tissue that may retain a substantial share of it. What appears from the trees' vantage as altruism may be better described as fungal commerce, with the network moving resources in whatever direction best serves the fungi.

Distinguishing these accounts is difficult, because both predict the same flows of carbon. The more instructive question may not be whether trees cooperate, but why a framework of pure competition survived so long despite evidence that never fitted it comfortably.`,
    questions: [
      {
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'question an interpretation of a documented phenomenon while noting the difficulty of testing the alternative',
          'establish that forest trees cooperate more often than they compete',
          'describe the experimental techniques by which carbon transfer was first detected',
          'argue that mycorrhizal fungi are the dominant organisms in forest ecosystems',
          'trace the history of competition-based models in twentieth-century ecology',
        ],
        explanation:
          'The passage accepts that carbon moves between trees but challenges the cooperative reading of that movement, offering the fungal-commerce alternative and then conceding that both accounts predict identical flows. That is a challenge to an interpretation coupled with an acknowledgment of the testing problem. The second choice states the position the author calls "premature"; the third and fifth name material the passage mentions only in passing; the fourth overstates a point raised to complicate the cooperative reading, not to crown the fungi.',
        difficulty: 4,
        tags: ['main-idea', 'authorial-purpose'],
      },
      {
        format: 'select_one',
        stem: 'The author mentions that carbon "passes through fungal tissue" primarily in order to',
        choices: [
          'suggest that the fungi may be beneficiaries of the transfer rather than mere intermediaries',
          'explain why isotope tracing cannot detect the direction of carbon movement',
          'demonstrate that trees derive no benefit from mycorrhizal association',
          'establish that fungal tissue is chemically similar to root tissue',
          'account for the delay between carbon uptake and its appearance in neighboring trees',
        ],
        explanation:
          'The detail appears in the argument that the fungi "are not passive conduits" and may "retain a substantial share" — its function is to cast the fungi as interested parties, supporting the commerce reading. The passage says isotope tracing did reveal direction, so the second choice contradicts it; the third is stronger than anything claimed; the fourth and fifth introduce points the passage never makes.',
        difficulty: 4,
        tags: ['function', 'inference'],
      },
      {
        format: 'select_all',
        stem: 'The passage suggests which of the following about the competition-based model of forest ecology? Select all that apply.',
        choices: [
          'It remained influential despite evidence that sat awkwardly with it.',
          'It treated trees as rivals for a common pool of resources.',
          'It was formulated specifically to account for below-ground interactions.',
        ],
        correctTexts: [
          'It remained influential despite evidence that sat awkwardly with it.',
          'It treated trees as rivals for a common pool of resources.',
        ],
        explanation:
          'The first statement restates the closing question about why the framework "survived so long despite evidence that never fitted it comfortably". The second restates the opening description of trees as "competitors locked in a contest for light, water, and soil nutrients". The third is contradicted: below-ground linkage is presented as the discovery that complicated the model, not as what it was built to explain.',
        difficulty: 4,
        tags: ['select-all', 'inference'],
      },
      {
        format: 'select_in_passage',
        stem: 'Select the sentence in the second paragraph in which the author offers an alternative explanation for a pattern that others have attributed to cooperation.',
        sentence:
          "What appears from the trees' vantage as altruism may be better described as fungal commerce, with the network moving resources in whatever direction best serves the fungi.",
        paragraphIndex: 1,
        explanation:
          'This sentence names the competing account directly, reframing apparent altruism as fungal commerce. The surrounding sentences set up the alternative — noting that the fungi have interests and retain carbon — but only this one states the rival explanation itself.',
        difficulty: 5,
        tags: ['select-in-passage', 'function'],
      },
    ],
  },
  {
    title: 'The archive and the ledger',
    topic: 'social science',
    difficulty: 4,
    body: `Historians of early modern commerce have long relied on merchant correspondence, a body of material that is abundant, vivid, and profoundly unrepresentative. Letters survive because someone thought them worth keeping, and the merchants whose papers descended intact to modern archives were disproportionately those whose firms endured. Failure, which was the ordinary outcome of commercial life in the period, left far fewer traces.

Recent work has turned instead to account books, which were kept by obligation rather than sentiment and therefore survive in patterns less tied to success. The ledgers are duller than the letters and far harder to read, but they record transactions that correspondence passes over in silence — small extensions of credit, routine defaults, the slow accumulation of obligations among people who never wrote to one another about it.

The resulting picture is not simply a fuller version of the older one. Where the letters describe a world of long-distance ventures and dramatic risk, the ledgers show commerce resting on dense local networks of small, unspectacular credit. Neither source is wrong. But a historiography built on letters alone was bound to mistake the exceptional for the typical, and to write the history of a system from the papers of its winners.`,
    questions: [
      {
        format: 'select_one',
        stem: 'The passage is primarily concerned with',
        choices: [
          'explaining how the choice of source material has shaped conclusions about a historical period',
          'arguing that merchant correspondence should no longer be used by historians',
          'comparing the commercial practices of successful and unsuccessful early modern firms',
          'describing the technical difficulties of reading early modern account books',
          'establishing that long-distance trade was less profitable than local credit',
        ],
        explanation:
          'The passage traces how reliance on letters produced a skewed account and how ledgers yield a different one, closing on the methodological moral about mistaking the exceptional for the typical. The second choice overstates: the author says "neither source is wrong". The third, fourth, and fifth pick up details that serve the argument rather than constituting it.',
        difficulty: 4,
        tags: ['main-idea'],
      },
      {
        format: 'select_one',
        stem: 'According to the passage, account books survive in patterns less tied to commercial success because they',
        choices: [
          'were produced as a matter of obligation rather than kept out of sentiment',
          'were stored in institutional archives rather than in private households',
          'were more durable physically than letters written on lighter paper',
          'recorded transactions that were of little interest to a firm\'s heirs',
          'were copied routinely and therefore existed in multiple versions',
        ],
        explanation:
          'The passage states directly that ledgers "were kept by obligation rather than sentiment and therefore survive in patterns less tied to success". The remaining choices offer plausible-sounding reasons for differential survival that the passage never advances — a standard trap on detail questions, where the credited answer must be traceable to the text rather than merely reasonable.',
        difficulty: 3,
        tags: ['detail', 'causation'],
      },
      {
        format: 'select_one',
        stem: 'The author would most likely agree that a historian who used only account books would',
        choices: [
          'still produce an incomplete account, though one skewed differently than the letter-based version',
          'arrive at essentially the same conclusions as a historian using only letters',
          'be unable to say anything meaningful about early modern commerce',
          'overstate the importance of long-distance ventures and dramatic risk',
          'find that the two bodies of evidence agree once the ledgers are properly read',
        ],
        explanation:
          'The passage insists that "neither source is wrong" while showing that each captures a different slice of commercial life — letters the spectacular, ledgers the routine. That symmetry implies a ledger-only history would be incomplete in its own way. The fourth choice assigns to the ledgers the bias the passage attributes to the letters; the fifth contradicts the claim that the resulting picture is "not simply a fuller version of the older one".',
        difficulty: 5,
        tags: ['inference', 'application'],
      },
    ],
  },
  {
    title: 'Restoration and intent',
    topic: 'humanities',
    difficulty: 3,
    body: `The cleaning of old paintings raises a question that conservation science cannot settle on its own: which state of the object is the one worth preserving? Removing centuries of darkened varnish reveals colors closer to those the painter applied, and on that ground cleaning is often defended as a return to original intent. But the varnish was frequently applied by the painter as well, and it was understood to yellow. A work meant to be seen through an amber film is not obviously better served by stripping the film away.

The difficulty is that "original intent" names two different things — the appearance of the work when it left the studio, and the appearance its maker anticipated it would acquire. These coincide only if the painter expected the materials to remain stable, which few did. Conservators must therefore choose, and the choice is aesthetic and historical rather than technical, however much the language of restoration reports suggests otherwise.`,
    questions: [
      {
        format: 'select_one',
        stem: 'The author\'s primary point about "original intent" is that the phrase',
        choices: [
          'conceals an ambiguity that makes it an unreliable guide to conservation decisions',
          'should be replaced by criteria drawn from conservation science',
          'applies only to works whose materials were expected to remain stable',
          'is used by conservators to justify decisions they know to be arbitrary',
          'has no meaningful application to paintings covered in varnish',
        ],
        explanation:
          'The second paragraph states that the phrase "names two different things" that coincide only under an assumption few painters made, leaving conservators to choose. That is an ambiguity undermining the phrase as a decision rule. The second choice reverses the argument, since the passage says science cannot settle the question; the fourth attributes bad faith the passage does not allege.',
        difficulty: 3,
        tags: ['main-idea', 'authorial-purpose'],
      },
      {
        format: 'select_one',
        stem: 'The observation that varnish "was frequently applied by the painter as well" functions in the passage to',
        choices: [
          'undercut the argument that removing varnish restores a work to its intended appearance',
          'establish that varnish was a standard material in the period',
          'explain why darkened varnish is difficult to remove without damage',
          'suggest that painters were indifferent to how their works would age',
          'introduce a technical objection that the rest of the passage refutes',
        ],
        explanation:
          'The detail appears immediately after the defense of cleaning as a return to original intent, and it weakens that defense: if the painter applied the varnish knowing it would yellow, the varnish is part of the intended work. The fourth choice inverts the point, which is that painters anticipated the change; the fifth misdescribes the structure, since the objection is developed rather than refuted.',
        difficulty: 4,
        tags: ['function', 'argument-structure'],
      },
    ],
  },
];

export function buildRC(rng: Rng, spec: PassageSpec) {
  const questions: GeneratedQuestion[] = spec.questions.map((q) => {
    if (q.format === 'select_in_passage') {
      const content: RCContent = {
        format: 'select_in_passage',
        paragraphIndex: q.paragraphIndex,
      };
      const answer: InPassageAnswer = { sentence: q.sentence! };
      return {
        type: 'RC' as const,
        section: 'verbal' as const,
        topic: 'reading-comprehension',
        subtopic: 'select-in-passage',
        difficulty: q.difficulty,
        stem: q.stem,
        content,
        answer,
        explanation: q.explanation,
        tags: ['reading-comprehension', ...q.tags],
        template: 'verbal.rc',
      };
    }

    const texts = rng.shuffle(q.choices!);
    const choices = texts.map((text, i) => ({ id: LETTERS[i], text }));

    // Key is the first entry of `choices` for select_one, or the listed
    // subset for select_all.
    const keyTexts = q.correctTexts ?? [q.choices![0]];
    const ids = keyTexts.map((t) => {
      const c = choices.find((ch) => ch.text === t);
      if (!c) throw new Error(`RC key missing: ${t.slice(0, 40)}`);
      return c.id;
    });

    const content: RCContent = { format: q.format, choices };
    const answer: ChoiceAnswer = { choices: ids };

    return {
      type: 'RC' as const,
      section: 'verbal' as const,
      topic: 'reading-comprehension',
      subtopic: q.format === 'select_all' ? 'select-all' : 'select-one',
      difficulty: q.difficulty,
      stem: q.stem,
      content,
      answer,
      explanation: q.explanation,
      tags: ['reading-comprehension', ...q.tags],
      template: 'verbal.rc',
    };
  });

  return { passage: spec, questions };
}
