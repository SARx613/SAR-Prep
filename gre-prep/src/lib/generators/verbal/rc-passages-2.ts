/* Reading Comprehension, batch 2: humanities and shorter argument passages.
 *
 * The short passages here carry two or three questions each, matching the
 * one-paragraph arguments the exam uses for reasoning questions, where the
 * task is to find the assumption, the flaw, or what would settle the case.
 */

import type { PassageSpec } from './rc-types';

export const PASSAGES_2: PassageSpec[] = [
  {
    title: 'Restoration and intent',
    topic: 'humanities',
    difficulty: 4,
    body: `The cleaning of old paintings raises a question that conservation science cannot settle on its own: which state of the object is the one worth preserving? Removing centuries of darkened varnish reveals colors closer to those the painter applied, and on that ground cleaning is often defended as a return to original intent. But the varnish was frequently applied by the painter as well, and it was understood to yellow. A work meant to be seen through an amber film is not obviously better served by stripping the film away.

The difficulty is that "original intent" names two different things — the appearance of the work when it left the studio, and the appearance its maker anticipated it would acquire. These coincide only if the painter expected the materials to remain stable, which few did. Conservators must therefore choose, and the choice is aesthetic and historical rather than technical, however much the language of restoration reports suggests otherwise.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: "The author's primary point about \"original intent\" is that the phrase",
        choices: [
          'conceals an ambiguity that makes it an unreliable guide to conservation decisions',
          'should be replaced by criteria drawn from conservation science',
          'applies only to works whose materials were expected to remain stable',
          'is used by conservators to justify decisions they know to be arbitrary',
          'has no meaningful application to paintings covered in varnish',
        ],
        explanation:
          'The second paragraph states that the phrase "names two different things" that coincide only under an assumption few painters made, leaving conservators to choose. That is an ambiguity undermining the phrase as a decision rule. The second choice reverses the argument, since science is said to be unable to settle the question; the fourth alleges bad faith the passage does not.',
        difficulty: 4,
      },
      {
        category: 'contextual-function',
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
          'The detail comes immediately after the defense of cleaning as a return to original intent, and it weakens that defense: if the painter applied varnish knowing it would yellow, the varnish belongs to the intended work. The fourth choice inverts the point, which is that painters anticipated the change.',
        difficulty: 4,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The passage implies that a conservator who cleaned a painting to reveal the colors as first applied would',
        choices: [
          'have made a defensible choice that nonetheless rests on aesthetic rather than scientific grounds',
          'have violated the painter\'s intentions in every case',
          'have relied on evidence unavailable to earlier restorers',
          'be unable to justify the decision in a restoration report',
          'have preserved the only state of the work that can be called authentic',
        ],
        explanation:
          'The passage says conservators "must therefore choose" and that the choice is "aesthetic and historical rather than technical" — so the decision is legitimate but not scientifically compelled. The second and fifth choices both pick one horn of the dilemma the author is at pains to leave open.',
        difficulty: 5,
      },
    ],
  },

  {
    title: 'The commonplace book',
    topic: 'humanities',
    difficulty: 4,
    body: `Before the notebook became a place for original composition, it was a place for copying. Early modern readers kept commonplace books — volumes in which passages from their reading were transcribed under topical headings, so that a phrase on friendship or on fortune could be retrieved when wanted. Modern readers, trained to value originality, tend to see the practice as passive, even parasitic.

The judgment misreads the purpose. Copying was not a substitute for thinking but a technique of it: the labor of selecting a passage, deciding which heading it belonged under, and placing it beside earlier extracts was an act of interpretation performed with the pen. Many commonplace books show headings invented by their keepers, and passages filed under categories no source would have suggested. What looks like transcription was frequently argument conducted by arrangement.

It is worth noting that the practice declined not because readers became more original but because printed reference works began to do the retrieving. The commonplace book was a memory technology, and it was displaced by better ones.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'defend a historical practice against a modern misunderstanding of its function',
          'trace the influence of commonplace books on later forms of note-taking',
          'argue that early modern readers were more original than is usually supposed',
          'explain why printed reference works proved superior to manuscript compilations',
          'describe the topical headings under which early modern readers filed their reading',
        ],
        explanation:
          'The passage names the modern judgment ("passive, even parasitic"), says it "misreads the purpose", and then explains what copying actually did. That is a defense against a misreading. The third choice overstates: the author denies that decline came from increased originality but does not claim these readers were especially original.',
        difficulty: 4,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following, if true, would most strengthen the author\'s claim that commonplacing was "argument conducted by arrangement"?',
        choices: [
          'Keepers frequently filed the same passage under two headings that stood in tension with each other',
          'Commonplace books were often bequeathed to children along with the family library',
          'The most common headings were drawn from a small number of printed guides',
          'Some keepers transcribed passages verbatim, preserving even the source\'s punctuation',
          'Commonplace books were typically kept for a period of several decades',
        ],
        explanation:
          'Filing one passage under headings in tension shows the keeper using placement to stage a conflict — interpretation performed through arrangement rather than through words. The third choice cuts against the author, since standardized headings would reduce the interpretive work; the fourth supports the "passive transcription" reading the author rejects.',
        difficulty: 5,
      },
      {
        category: 'contextual-function',
        format: 'select_one',
        stem: 'The final paragraph serves primarily to',
        choices: [
          'forestall the conclusion that the practice died out because readers outgrew it',
          'concede that printed reference works were more accurate than handwritten ones',
          'suggest that the commonplace book may yet be revived in another form',
          'establish when the practice reached the height of its popularity',
          'qualify the claim that commonplacing involved genuine interpretation',
        ],
        explanation:
          'The paragraph explicitly denies that decline followed from readers becoming "more original" and attributes it to better retrieval technology instead — heading off the flattering story a modern reader might otherwise supply. The fifth choice contradicts the paragraph, which does not retract the interpretive claim.',
        difficulty: 4,
      },
      {
        category: 'other',
        format: 'select_one',
        stem: 'In the context of the passage, the word "labor" most nearly means',
        choices: [
          'effortful work',
          'a workforce',
          'childbirth',
          'a political movement',
          'physical exertion',
        ],
        explanation:
          'The word introduces "of selecting a passage, deciding which heading it belonged under, and placing it" — mental operations described as demanding. "Physical exertion" is tempting but wrong here: the effort described is interpretive, not bodily, and the passage is arguing precisely that the work was intellectual.',
        difficulty: 3,
      },
    ],
  },

  {
    title: 'Reintroduction and the baseline',
    topic: 'natural science',
    difficulty: 4,
    body: `Conservation programs that reintroduce a species to territory it once occupied are usually evaluated against a historical baseline: the composition of the ecosystem before the species was extirpated. The logic is intuitive, and in some cases the results have been striking. But the baseline assumption deserves more scrutiny than it generally receives.

An ecosystem is not a machine from which a part has been removed and can be replaced. In the interval since extirpation, other species will have expanded into the vacated role, soil chemistry and vegetation structure will have shifted, and the returning population itself will differ genetically from the one that left. Restoring the species does not restore the prior state; it produces a new one, which may or may not resemble the target.

None of this argues against reintroduction, which has clear successes to its name. It argues against measuring success by resemblance to a vanished configuration. A criterion framed in terms of function — whether the system now regulates itself in ways it previously did — would survive the objection, and would have the further merit of being testable in the present rather than against a past that is known only imperfectly.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The passage is primarily concerned with',
        choices: [
          'criticizing a standard of evaluation and proposing an alternative',
          'arguing that species reintroduction programs should be discontinued',
          'describing the ecological changes that follow the loss of a species',
          'comparing the genetic composition of extirpated and reintroduced populations',
          'documenting the successes of recent conservation programs',
        ],
        explanation:
          'The passage questions the historical baseline, explains why it fails, and then proposes a functional criterion in its place. The second choice is explicitly disclaimed — "none of this argues against reintroduction". The third describes evidence marshaled for the argument rather than its purpose.',
        difficulty: 4,
      },
      {
        category: 'inference',
        format: 'select_all',
        stem: 'The passage suggests which of the following about the functional criterion the author proposes? Select all that apply.',
        choices: [
          'It can be assessed without relying on incomplete knowledge of past conditions.',
          'It would remain usable even though a restored ecosystem differs from the prior one.',
          'It would classify most existing reintroduction programs as failures.',
        ],
        correctTexts: [
          'It can be assessed without relying on incomplete knowledge of past conditions.',
          'It would remain usable even though a restored ecosystem differs from the prior one.',
        ],
        explanation:
          'The final sentence gives the first — testable "in the present rather than against a past that is known only imperfectly" — and the second follows from the criterion surviving "the objection" that the new state differs from the old. The third is unsupported: the author says reintroduction "has clear successes to its name".',
        difficulty: 5,
      },
      {
        category: 'detail',
        format: 'select_one',
        stem: 'According to the passage, which of the following changes may occur between a species\' extirpation and its reintroduction?',
        choices: [
          'Other species expand into the ecological role the absent species had filled',
          'The historical baseline is revised to reflect the new species composition',
          'Soil chemistry stabilizes at the condition that preceded extirpation',
          'The extirpated population becomes genetically identical to its ancestors',
          'Vegetation structure returns to its pre-extirpation configuration',
        ],
        explanation:
          'The second paragraph lists exactly this: "other species will have expanded into the vacated role". The third, fourth, and fifth all reverse changes the passage describes — the passage says soil and vegetation shift and that the returning population differs genetically.',
        difficulty: 3,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'The author\'s argument depends on which of the following assumptions?',
        choices: [
          'How a restoration program is judged successful can be separated from whether it is worth undertaking',
          'Historical records of pre-extirpation ecosystems are deliberately falsified',
          'Functional self-regulation is easier to measure than species composition',
          'Reintroduced populations always fail to establish themselves permanently',
          'Ecosystems tend to return to their prior states if left undisturbed',
        ],
        explanation:
          'The passage attacks the criterion while endorsing the practice — that move only works if the two questions come apart. The third choice is not required: the author claims the functional criterion is testable in the present, not that it is easier. The fifth contradicts the passage\'s central claim that the prior state does not return.',
        difficulty: 5,
      },
    ],
  },

  {
    title: 'The productivity paradox',
    topic: 'business',
    difficulty: 4,
    body: `Firms that adopt a new information technology often record no measurable gain in productivity for several years, and sometimes record a decline. This pattern has been offered as evidence that the technologies are oversold. A more careful reading suggests something else.

The gains from such a technology are rarely available to a firm that installs it and changes nothing else. Realizing them typically requires reorganizing work around what the system makes possible — redrawing reporting lines, retraining staff, abandoning procedures that existed to compensate for the constraint the technology has removed. These changes are costly, and they take years. During the interval, a firm bears the expense of the system and of the reorganization while still operating, in part, on the old logic.

The measured dip, on this account, is not evidence that the technology fails. It is evidence that the accounting captures the costs of transition before it captures the benefits. The prediction that follows is specific: firms that reorganize aggressively should show a deeper initial decline and a larger eventual gain than firms that install the same system and leave their processes alone.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'offer an alternative explanation for an observed pattern and derive a testable prediction from it',
          'demonstrate that information technologies are generally oversold to firms',
          'recommend that firms delay adopting new information systems',
          'compare the productivity of firms in different industries',
          'explain why accounting practices should be revised',
        ],
        explanation:
          'The passage reports the pattern, rejects the "oversold" reading, supplies the transition-cost account, and closes with a specific prediction distinguishing the two. The second choice is the interpretation the passage argues against; the fifth mistakes an observation about what accounting captures for a recommendation.',
        difficulty: 4,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following findings would most undermine the explanation offered in the passage?',
        choices: [
          'Firms that reorganized aggressively showed the same initial decline as firms that did not, and no larger eventual gain',
          'Some firms recorded productivity gains immediately after installing the technology',
          'The cost of installing the systems fell substantially over the period studied',
          'Firms in service industries reorganized more slowly than firms in manufacturing',
          'A minority of firms abandoned the technology before completing the transition',
        ],
        explanation:
          'The passage stakes itself on a specific prediction, and the first choice falsifies exactly that prediction: if aggressive reorganization changes neither the dip nor the eventual gain, the transition-cost account loses its distinguishing evidence. The second is compatible with the account, since firms differ in how much reorganization they need.',
        difficulty: 5,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The passage suggests that some existing procedures within a firm',
        choices: [
          'exist to work around a limitation that the new technology eliminates',
          'are retained because staff resist retraining',
          'become more efficient once reporting lines are redrawn',
          'were designed in anticipation of future technological change',
          'account for most of the measured decline in productivity',
        ],
        explanation:
          'The passage refers to "abandoning procedures that existed to compensate for the constraint the technology has removed" — such procedures were built around a limitation now gone. The second choice supplies a motive the passage never mentions; the fifth assigns a share of the decline the passage does not quantify.',
        difficulty: 4,
      },
      {
        category: 'contextual-function',
        format: 'select_one',
        stem: 'The author states that the changes "are costly, and they take years" primarily in order to',
        choices: [
          'explain why the benefits of the technology appear only after a delay',
          'argue that most firms lack the resources to complete the transition',
          'question whether the reorganization is worth undertaking at all',
          'establish that the technology itself is more expensive than reported',
          'contrast the experience of large firms with that of small ones',
        ],
        explanation:
          'The clause sets up the next sentence, in which the firm bears costs "during the interval" while still partly on the old logic — the delay is what produces the measured dip. The third choice contradicts the passage, which treats the reorganization as the route to the eventual gain.',
        difficulty: 4,
      },
    ],
  },
];
