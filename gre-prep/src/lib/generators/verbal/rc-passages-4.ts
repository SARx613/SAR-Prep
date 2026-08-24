/* Reading Comprehension, batch 4: mixed length and register. */

import type { PassageSpec } from './rc-types';

export const PASSAGES_4: PassageSpec[] = [
  {
    title: 'Birdsong and dialect',
    topic: 'natural science',
    difficulty: 4,
    body: `Male songbirds of many species learn their songs from adults during a limited period after fledging, and populations separated by even modest distances often develop recognizably different versions of the same species' song. These local variants are commonly called dialects, a term borrowed from human language.

The analogy has been productive, but it invites a confusion worth naming. Human dialects encode social identity in a way that is largely independent of the content communicated: a speaker can convey the same proposition in either of two dialects. Birdsong dialects have no comparable separation, because the song is not a vehicle for propositions at all. What varies between populations is the signal itself, not the manner in which some further content is expressed.

This matters for how population differences are interpreted. Where a human dialect boundary marks a social division that speakers themselves recognize and often police, a birdsong boundary may mark nothing more than the accumulated drift of a copying process across space. Some researchers have found evidence that females discriminate against non-local song, which would give the boundary a social function; others have found no such effect. The question remains open, and the borrowed vocabulary has occasionally made it seem settled.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'caution against an implication that a borrowed term carries into a field where it may not hold',
          'demonstrate that birdsong dialects serve no social function',
          'compare the mechanisms by which birds and humans acquire communication',
          'argue that the term "dialect" should be abandoned in ornithology',
          'summarize research on female preference for local song variants',
        ],
        explanation:
          'The passage calls the analogy "productive" but warns it "invites a confusion", then shows the question of social function is unsettled while the borrowed vocabulary makes it seem settled. The second choice takes a side the passage explicitly leaves open; the fourth is stronger than the caution offered.',
        difficulty: 4,
      },
      {
        category: 'detail',
        format: 'select_one',
        stem: 'According to the passage, human dialects differ from birdsong dialects in that human dialects',
        choices: [
          'permit the same content to be expressed in more than one variant',
          'are acquired over a longer period of development',
          'vary more sharply across short geographic distances',
          'are policed more consistently by the speakers who use them',
          'change more rapidly than birdsong variants do',
        ],
        explanation:
          'The second paragraph states that a human speaker "can convey the same proposition in either of two dialects", a separation birdsong lacks. The fourth choice draws on the passage\'s mention of policing but makes it the point of difference, whereas the stated difference is the independence of content from variant.',
        difficulty: 3,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The passage suggests that if females were shown consistently to reject non-local song, this would',
        choices: [
          'give birdsong boundaries a social function comparable in one respect to human dialect boundaries',
          'establish that birdsong conveys propositional content',
          'prove that birdsong dialects arise from copying error rather than drift',
          'show that the analogy with human language is exact',
          'indicate that song learning continues throughout adult life',
        ],
        explanation:
          'The passage says such discrimination "would give the boundary a social function", which is the respect in which human boundaries mark recognized divisions. The second and fourth overreach: the passage insists song is not a vehicle for propositions, and one shared feature would not make the analogy exact.',
        difficulty: 5,
      },
      {
        category: 'contextual-function',
        format: 'select_one',
        stem: 'The author mentions that "others have found no such effect" primarily in order to',
        choices: [
          'establish that the evidence does not currently settle the question',
          'discredit the researchers who reported female discrimination',
          'suggest that female preference varies between species',
          'explain why the term "dialect" was adopted in the first place',
          'introduce a methodological criticism of the earlier studies',
        ],
        explanation:
          'The clause completes a balanced pair — some found the effect, others did not — leading directly to "the question remains open". The second and fifth read a critique into a statement that simply reports conflicting results.',
        difficulty: 4,
      },
    ],
  },

  {
    title: 'The unread classic',
    topic: 'humanities',
    difficulty: 4,
    body: `Every literary culture maintains a body of works that are honored more than they are read. The phenomenon is usually treated as a failure — of education, of attention, of the works themselves. It might be better understood as a function these works perform.

A canonical text that everyone had actually read would be a poor instrument for the work canons do. Its value lies partly in being available as a shared reference whose content can be gestured at without being examined, and a text known chiefly by reputation serves that purpose more efficiently than one whose particulars are common knowledge. The unread classic is not a canon failing to operate; it is a canon operating cheaply.

None of this means the works are not worth reading, and the argument carries no verdict on their merit. It means only that the gap between reverence and readership is not evidence that something has gone wrong. If anything, a canon whose members were all widely read would be doing less work per text than one whose members are mostly invoked.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'reinterpret a phenomenon usually regarded as a failure as instead a feature of how canons work',
          'argue that canonical works do not deserve the reverence they receive',
          'criticize educational systems for failing to assign canonical texts',
          'demonstrate that reputation is a more reliable guide to merit than readership',
          'trace the historical process by which particular works entered the canon',
        ],
        explanation:
          'The passage names the usual verdict ("a failure"), proposes instead that the gap is "a canon operating cheaply", and disclaims any judgment of merit. The second and fourth both assign the passage a verdict on merit it explicitly refuses.',
        difficulty: 4,
      },
      {
        category: 'contextual-function',
        format: 'select_one',
        stem: 'The third paragraph functions primarily to',
        choices: [
          'limit the scope of the argument so it is not mistaken for a claim about literary value',
          'introduce evidence supporting the claim made in the second paragraph',
          'concede that the argument fails for certain kinds of canonical text',
          'restate the conventional view the passage set out to challenge',
          'propose a method for determining which works belong in a canon',
        ],
        explanation:
          'The paragraph opens by disclaiming — "none of this means the works are not worth reading" — and specifies what the argument does and does not establish. That is scope-limiting, guarding against a misreading rather than adding support.',
        difficulty: 5,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The author would most likely agree with which of the following?',
        choices: [
          'A work can function effectively within a canon even if few people have read it closely',
          'Works that are widely read cannot serve as shared cultural references',
          'The reverence accorded canonical works is generally undeserved',
          'Canons would function better if their contents were revised more frequently',
          'Reading a canonical text closely diminishes its value as a reference',
        ],
        explanation:
          'This is the passage\'s central claim, stated as the unread classic being "a canon operating cheaply". The second overstates into an impossibility the passage does not assert, and the fifth confuses efficiency of reference with harm from reading, which the author denies by refusing any verdict on merit.',
        difficulty: 4,
      },
    ],
  },

  {
    title: 'Antibiotic cycling',
    topic: 'natural science',
    difficulty: 5,
    body: `Hospitals facing resistant bacterial infections have experimented with cycling: rotating the antibiotic used as first-line treatment on a fixed schedule, on the theory that a drug withdrawn from use will regain its effectiveness as resistance to it declines in the bacterial population. Early modeling supported the approach, and several institutions adopted it.

Longer-running trials have been disappointing, and the reason appears to be an assumption built into the early models. They treated resistance to each drug as a separate trait carried at a cost, so that a lineage resistant to a withdrawn drug would be outcompeted once the selection pressure was removed. In practice, resistance genes are frequently carried together on mobile elements that move between bacteria as a unit. Selecting for resistance to the drug currently in use can therefore maintain resistance to the drug that was withdrawn, and the population never loses the trait that cycling was designed to erode.

The finding does not show that cycling can never work. It shows that its success depends on a property of the local bacterial population — whether the relevant resistance genes travel together — that hospitals adopting the strategy were not measuring.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'explain why a strategy underperformed and identify the condition on which its success depends',
          'argue that antibiotic cycling should be abandoned in hospital settings',
          'describe the mechanisms by which bacteria acquire resistance genes',
          'criticize hospitals for adopting a strategy before trials were complete',
          'compare the effectiveness of several approaches to resistant infection',
        ],
        explanation:
          'The passage reports disappointing trials, locates the faulty assumption, and closes by naming the property that determines whether cycling works. The second is explicitly denied — "does not show that cycling can never work" — and the fourth is a criticism the passage does not make.',
        difficulty: 4,
      },
      {
        category: 'detail',
        format: 'select_one',
        stem: 'According to the passage, the early models assumed that resistance to each drug',
        choices: [
          'was a separate trait carried at a cost to the bacterium',
          'would spread more slowly than it actually did',
          'could be eliminated entirely within a single cycling period',
          'arose independently in each hospital population',
          'was carried on mobile elements shared between species',
        ],
        explanation:
          'The second paragraph states the assumption directly. The fifth names what actually happens in practice — the very fact that defeats the models — and is the trap for readers who confuse the assumption with its correction.',
        difficulty: 3,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following, if true, would most support the view that cycling could succeed in a particular hospital?',
        choices: [
          'In that hospital, the resistance genes for the drugs being cycled are carried on separate mobile elements that rarely travel together',
          'That hospital has a lower rate of resistant infection than comparable institutions',
          'The bacterial population in that hospital reproduces more slowly than in others',
          'That hospital cycles among four antibiotics rather than two',
          'Resistance to one of the cycled drugs first appeared in that hospital only recently',
        ],
        explanation:
          'The passage identifies gene linkage as the decisive property, so genes that do not travel together restore the mechanism cycling depends on. The fourth adds drugs without addressing linkage, and the fifth concerns timing rather than whether withdrawal erodes resistance.',
        difficulty: 5,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The passage implies that hospitals adopting cycling',
        choices: [
          'lacked information about their own bacterial populations that the strategy\'s success required',
          'ignored evidence from longer-running trials that was available at the time',
          'used antibiotics for which resistance had not yet been documented',
          'rotated their antibiotics on schedules that were too short to be effective',
          'were the first institutions to identify the role of mobile genetic elements',
        ],
        explanation:
          'The closing sentence says success depends on a property "that hospitals adopting the strategy were not measuring". The second reverses the chronology — the longer trials came after adoption — and the fourth proposes a diagnosis the passage never offers.',
        difficulty: 4,
      },
      {
        category: 'other',
        format: 'select_in_passage',
        stem: 'Select the sentence in the second paragraph that states the mechanism by which resistance to a withdrawn drug can persist.',
        sentence:
          'Selecting for resistance to the drug currently in use can therefore maintain resistance to the drug that was withdrawn, and the population never loses the trait that cycling was designed to erode.',
        paragraphIndex: 1,
        explanation:
          'This sentence gives the mechanism itself: selection on the current drug sustains resistance to the withdrawn one. The preceding sentence supplies the fact about mobile elements that makes the mechanism possible, but the mechanism is stated here.',
        difficulty: 5,
      },
    ],
  },

  {
    title: 'Wage transparency',
    topic: 'business',
    difficulty: 4,
    body: `When a jurisdiction requires employers to publish salary ranges in job advertisements, two effects are commonly predicted. The first is that pay gaps between demographic groups will narrow, since applicants who previously negotiated from ignorance will know what the role pays. The second is that overall wage levels will rise, since the least-informed applicants had been the worst compensated.

Evidence from jurisdictions that have adopted such rules supports the first prediction more clearly than the second. Gaps have narrowed. But average wages have in several cases risen only slightly, and in a few have fallen. The likely reason is that transparency constrains employers as well as informing applicants: a published range becomes a commitment, and an employer who must honor the top of a range for every hire has reason to set the range lower than the figure it might have offered a strong candidate privately.

The lesson is not that transparency fails. It is that a policy can achieve the distributional goal its advocates emphasize while working against the level effect they also expect, and that the two should be argued for separately.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'distinguish between two predicted effects of a policy, only one of which the evidence supports',
          'argue that wage transparency rules should be repealed',
          'demonstrate that pay gaps between demographic groups have been eliminated',
          'explain how employers set salary ranges for advertised positions',
          'compare transparency rules across several jurisdictions',
        ],
        explanation:
          'The passage sets out two predictions, reports that evidence supports the first more than the second, explains why, and concludes that the two should be argued separately. The second choice is disclaimed by "the lesson is not that transparency fails".',
        difficulty: 4,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'The explanation offered in the second paragraph depends on which of the following?',
        choices: [
          'Employers treat a published range as binding in a way that a private offer is not',
          'Applicants rarely negotiate once a range has been published',
          'The strongest candidates apply only to positions with published ranges',
          'Published ranges are usually narrower than the range of offers made privately',
          'Employers are legally prohibited from paying above a published range',
        ],
        explanation:
          'The account turns on the range becoming "a commitment" the employer must honor, which is what gives it downward pressure. The fifth is stronger than the passage requires — a practical commitment suffices without a legal prohibition — and the second is not needed for the mechanism to work.',
        difficulty: 5,
      },
      {
        category: 'inference',
        format: 'select_all',
        stem: 'The passage suggests which of the following about the two predicted effects? Select all that apply.',
        choices: [
          'They can come apart, with the policy advancing one while impeding the other.',
          'Advocates of transparency have tended to expect both.',
          'The distributional effect depends on wage levels rising.',
        ],
        correctTexts: [
          'They can come apart, with the policy advancing one while impeding the other.',
          'Advocates of transparency have tended to expect both.',
        ],
        explanation:
          'The closing paragraph states both: the policy can achieve the distributional goal "while working against the level effect they also expect". The third reverses the passage, which shows gaps narrowed even where average wages did not rise.',
        difficulty: 5,
      },
    ],
  },
];
