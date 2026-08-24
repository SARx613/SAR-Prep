/* Reading Comprehension, batch 3: short argument passages.
 *
 * These are the one-paragraph items the exam uses for reasoning questions,
 * where the whole passage is a single argument and the task is to find the
 * assumption it rests on, the evidence that would settle it, or the flaw
 * in how it moves from premise to conclusion.
 */

import type { PassageSpec } from './rc-types';

export const PASSAGES_3: PassageSpec[] = [
  {
    title: 'Nocturnal foraging',
    topic: 'natural science',
    difficulty: 4,
    body: `In a valley where a large predator was reintroduced eight years ago, deer now forage almost exclusively at night, whereas before the reintroduction they fed throughout the day. Researchers have concluded that the shift is a response to predation risk, since the predator hunts primarily during daylight hours.`,
    questions: [
      {
        category: 'reasoning',
        format: 'select_one',
        stem: "The researchers' conclusion depends on which of the following assumptions?",
        choices: [
          'No other change in the valley over the same period would independently account for the shift to nocturnal foraging',
          'Deer in valleys without the predator never forage at night',
          'The predator is more successful at hunting deer during daylight than at night',
          'The deer population has declined since the predator was reintroduced',
          'Nocturnal foraging provides deer with the same nutritional intake as daytime foraging',
        ],
        explanation:
          'The argument infers causation from a change that followed reintroduction, which requires that no other concurrent change explains it. The second choice is far stronger than the argument needs — the conclusion survives even if some unthreatened deer also feed at night. The fifth concerns whether the shift is costly, not whether the predator caused it.',
        difficulty: 5,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following, if true, would most weaken the conclusion?',
        choices: [
          'Summer daytime temperatures in the valley rose sharply beginning nine years ago, and deer elsewhere respond to such heat by feeding at night',
          'The predator occasionally hunts at night when moonlight is bright',
          'Deer in the valley were already foraging at dawn and dusk before the reintroduction',
          'The reintroduced predator also preys on smaller mammals',
          'Researchers observed the deer using cameras rather than direct observation',
        ],
        explanation:
          'The first supplies a rival cause that began before the reintroduction and is known to produce the same behavior, which is exactly what the argument must exclude. The second is a minor qualification that leaves daylight the riskier period; the third describes a partial precedent without offering an alternative explanation for the near-total shift.',
        difficulty: 5,
      },
    ],
  },

  {
    title: 'The training program',
    topic: 'business',
    difficulty: 4,
    body: `A manufacturing company introduced a voluntary safety training program two years ago. Employees who completed the program have since had 40 percent fewer workplace accidents than those who did not. The company's safety director has concluded that the program is effective and has recommended making it mandatory for all employees.`,
    questions: [
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following, if true, most seriously weakens the safety director\'s conclusion?',
        choices: [
          'Employees who volunteered for the program were already among the most safety-conscious in the company',
          'The program costs less per employee than the company had originally budgeted',
          'Some employees who completed the program have since transferred to other departments',
          'Workplace accidents at comparable firms declined by 10 percent over the same period',
          'The program takes eight hours to complete and is offered only on weekends',
        ],
        explanation:
          'Self-selection is the classic threat to a voluntary-program comparison: if volunteers were already safer, their lower accident rate reflects who they are rather than what the program did — and making it mandatory would extend it to people for whom it may do much less. The fourth choice suggests a modest general trend but leaves most of the 40 percent gap unexplained.',
        difficulty: 4,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following would be most useful to determine in evaluating the recommendation?',
        choices: [
          'Whether employees who declined the program had accident rates comparable to program participants before the program began',
          'Whether the program is taught by outside instructors or by company staff',
          'Whether other firms in the industry offer similar programs',
          'How many employees completed the program in its first year',
          'Whether the program covers equipment that all employees use',
        ],
        explanation:
          'Baseline rates before the program would show whether the two groups were alike to begin with, distinguishing a program effect from a selection effect — the single question on which the recommendation turns. The others bear on cost, comparison, or scale without addressing whether the program caused the difference.',
        difficulty: 5,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The safety director\'s recommendation assumes that the effect observed among volunteers would',
        choices: [
          'extend to employees who would not have chosen to participate',
          'increase further if the program were lengthened',
          'be visible within the first year of mandatory participation',
          'reduce accidents to zero across the whole workforce',
          'justify the program regardless of its cost',
        ],
        explanation:
          'Making a voluntary program mandatory only makes sense if it works for the non-volunteers too, which is a transfer of the result from one population to another. The fourth and fifth are far stronger than the recommendation requires; the second concerns program length, which the recommendation does not touch.',
        difficulty: 4,
      },
    ],
  },

  {
    title: 'Manuscript dating',
    topic: 'humanities',
    difficulty: 5,
    body: `A manuscript long assigned to the twelfth century has been redated to the fourteenth on the basis of its script, which shows letterforms not otherwise attested before 1300. Some scholars object that the manuscript's text preserves readings found in no surviving copy later than the twelfth century, and conclude that the earlier date must be correct.`,
    questions: [
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'The objection described in the passage is most vulnerable to which of the following criticisms?',
        choices: [
          'It overlooks the possibility that a later scribe copied from an early exemplar that has not survived',
          'It assumes that letterforms can be dated more precisely than texts',
          'It relies on evidence from manuscripts in a different language',
          'It fails to specify how many readings the manuscript preserves',
          'It treats the twelfth century as a single undifferentiated period',
        ],
        explanation:
          'Early readings establish the age of the text, not the age of the copy — a fourteenth-century scribe working from a lost twelfth-century exemplar would produce exactly what is described. The objection conflates the date of composition with the date of the artifact. The second choice inverts the objectors\' position, since they are the ones discounting the script evidence.',
        difficulty: 5,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following, if true, would most support the redating to the fourteenth century?',
        choices: [
          'The parchment of the manuscript has been shown by physical analysis to date from after 1310',
          'The manuscript contains marginal notes in a fifteenth-century hand',
          'Several twelfth-century manuscripts preserve the same textual readings',
          'The letterforms in question appear in documents from a neighboring region',
          'The manuscript was held in a monastic library founded in the eleventh century',
        ],
        explanation:
          'Physical dating of the parchment fixes the artifact itself after 1310, which is independent of both script and text and settles the question the objection muddies. The second only shows the manuscript existed by the fifteenth century, which the twelfth-century dating also allows; the third supports the objectors.',
        difficulty: 5,
      },
    ],
  },

  {
    title: 'Reading speed and comprehension',
    topic: 'social science',
    difficulty: 4,
    body: `A study asked participants to read passages either on paper or on a screen and then tested their comprehension. Screen readers scored lower on average, and the finding has been widely reported as showing that screens impair reading comprehension. The study also recorded reading time, however, and screen readers spent on average 20 percent less time on each passage than paper readers did.`,
    questions: [
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'The final sentence of the passage functions primarily to',
        choices: [
          'introduce a variable that offers a competing explanation of the comprehension gap',
          'call into question the accuracy of the comprehension test',
          'suggest that screen reading is more efficient than paper reading',
          'establish that the two groups were drawn from different populations',
          'concede a limitation that does not affect the study\'s conclusion',
        ],
        explanation:
          'Less time spent reading could itself produce lower scores, so the medium may not be doing the work the popular reporting assumes. The sentence supplies a confound, not a doubt about the test itself. The fifth choice inverts the sentence\'s force: the detail bears directly on the conclusion.',
        difficulty: 4,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The passage suggests that the widely reported interpretation of the study',
        choices: [
          'may attribute to the medium an effect that stems from how long participants read',
          'was based on a misreading of the comprehension scores',
          'has been contradicted by subsequent research on screen reading',
          'applies only to participants unaccustomed to reading on screens',
          'ignored the fact that the passages differed in difficulty',
        ],
        explanation:
          'The passage juxtaposes the reported conclusion with the time difference, implying the gap may be a reading-time effect rather than a medium effect. The second choice misplaces the error, which lies in the causal inference rather than in reading the numbers; the third and fifth introduce facts the passage does not supply.',
        difficulty: 4,
      },
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following, if true, would most strengthen the claim that the medium itself impairs comprehension?',
        choices: [
          'When reading time was held constant across the two groups, screen readers still scored lower',
          'Participants reported finding the screen passages less enjoyable than the paper ones',
          'Screen readers reread individual sentences more often than paper readers did',
          'The screens used in the study had lower resolution than most commercial devices',
          'Paper readers were more likely to take notes while reading',
        ],
        explanation:
          'Equalizing reading time removes the confound the passage raises, so a persisting gap must be attributed to something else about the medium. The fourth choice would explain a screen deficit but as an artifact of the equipment rather than of screens generally, and the fifth introduces a further confound rather than removing one.',
        difficulty: 5,
      },
    ],
  },

  {
    title: 'The vanishing middle',
    topic: 'social science',
    difficulty: 5,
    body: `Economists studying occupational change in wealthy countries have documented a consistent pattern: employment has grown at the top of the wage distribution and at the bottom, while shrinking in the middle. The standard explanation attributes this to automation. Routine tasks — those that can be specified as a sequence of rules — are concentrated in middle-wage clerical and production work, and are therefore the easiest to mechanize. Jobs at the top require judgment that resists specification; jobs at the bottom require physical dexterity and situational response that, until recently, machines handled poorly.

The account is elegant and has considerable evidence behind it. It is worth noting, though, what it does not explain. Polarization has proceeded at markedly different rates in countries with similar technology, which suggests that institutions — bargaining arrangements, employment protection, the structure of vocational training — mediate the effect substantially. A theory that treats automation as an exogenous force acting uniformly on every labor market will predict the direction of change correctly and its magnitude badly.`,
    questions: [
      {
        category: 'global',
        format: 'select_one',
        stem: 'The primary purpose of the passage is to',
        choices: [
          'endorse an explanation while identifying an important limitation in its scope',
          'reject the automation account in favor of an institutional one',
          'demonstrate that occupational polarization has been overstated',
          'compare labor-market institutions across wealthy countries',
          'predict the future course of employment in middle-wage occupations',
        ],
        explanation:
          'The passage calls the account "elegant" with "considerable evidence behind it", then notes what it fails to explain and specifies the consequence — right direction, wrong magnitude. That is qualified endorsement. The second overstates: institutions are said to mediate the effect, not to replace it as the cause.',
        difficulty: 4,
      },
      {
        category: 'detail',
        format: 'select_one',
        stem: 'According to the passage, jobs at the bottom of the wage distribution have resisted automation because they',
        choices: [
          'require physical dexterity and situational response that machines have handled poorly',
          'are protected by employment regulation in most wealthy countries',
          'involve tasks that cannot be specified as a sequence of rules at any cost',
          'have grown too quickly for automation to keep pace',
          'depend on judgment of the kind found in high-wage occupations',
        ],
        explanation:
          'The first paragraph states this directly, with the qualifier "until recently". The third drops that qualifier and overstates into impossibility; the fifth assigns to low-wage work the judgment the passage attributes to high-wage work.',
        difficulty: 3,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'It can be inferred that the author regards cross-country differences in the pace of polarization as',
        choices: [
          'evidence that the effect of automation is conditioned by national institutions',
          'a reason to doubt that automation displaces routine work at all',
          'the result of differences in the technologies available in each country',
          'too small to bear on the adequacy of the standard explanation',
          'a temporary divergence that will disappear as technology spreads',
        ],
        explanation:
          'The passage says differing rates "suggest that institutions … mediate the effect substantially", in countries with similar technology. The third choice is ruled out by "similar technology"; the second and fourth understate a point the author treats as consequential enough to distort magnitude predictions.',
        difficulty: 5,
      },
      {
        category: 'contextual-function',
        format: 'select_one',
        stem: 'The author\'s remark that the theory "will predict the direction of change correctly and its magnitude badly" serves to',
        choices: [
          'specify precisely how far the standard explanation can be trusted',
          'suggest that the standard explanation should be abandoned',
          'question whether polarization has occurred in every wealthy country',
          'introduce an alternative theory that the author goes on to develop',
          'concede that magnitude is difficult to measure in any labor market',
        ],
        explanation:
          'The remark divides the theory into a part that works and a part that does not, which is a statement of scope rather than a rejection. The second choice contradicts the endorsement in the preceding sentence; no alternative theory is developed, so the fourth misdescribes the passage.',
        difficulty: 5,
      },
      {
        category: 'other',
        format: 'select_in_passage',
        stem: 'Select the sentence in the second paragraph that identifies the evidence the standard explanation fails to accommodate.',
        sentence:
          'Polarization has proceeded at markedly different rates in countries with similar technology, which suggests that institutions — bargaining arrangements, employment protection, the structure of vocational training — mediate the effect substantially.',
        paragraphIndex: 1,
        explanation:
          'This sentence supplies the anomalous evidence: similar technology, different rates. The preceding sentence announces that something is unexplained, and the following one draws the consequence, but only this sentence states the evidence itself.',
        difficulty: 5,
      },
    ],
  },

  {
    title: 'Museum attendance',
    topic: 'business',
    difficulty: 3,
    body: `After a city museum eliminated its admission fee, attendance rose by 60 percent in the following year. The museum's director cited the figure as proof that price had been the main barrier to attendance and proposed that other museums in the region follow suit.`,
    questions: [
      {
        category: 'reasoning',
        format: 'select_one',
        stem: 'Which of the following, if true, would most weaken the director\'s conclusion?',
        choices: [
          'The museum opened a widely publicized new wing in the same month the fee was eliminated',
          'Attendance at the museum had been declining slowly for several years before the change',
          'The museum\'s operating costs rose slightly during the year in question',
          'Other museums in the region charge higher admission fees than the museum formerly did',
          'Visitors who attended after the change stayed for shorter periods on average',
        ],
        explanation:
          'A publicized new wing opening simultaneously offers a rival cause for the attendance rise, which is what the director\'s causal claim must exclude. The second choice actually makes the reversal more striking; the fifth concerns what visitors did once inside, not why they came.',
        difficulty: 3,
      },
      {
        category: 'inference',
        format: 'select_one',
        stem: 'The director\'s proposal that other museums eliminate their fees assumes that',
        choices: [
          'the barrier that price posed at this museum operates similarly at the others',
          'the other museums have larger collections than this museum',
          'attendance is the only measure by which a museum should be judged',
          'the increase in attendance will continue indefinitely',
          'visitors are unwilling to pay any admission fee at all',
        ],
        explanation:
          'Extending the policy to other institutions assumes the same mechanism operates there. The third and fourth are stronger than the proposal requires — a director can value attendance highly without treating it as the only measure — and the fifth overstates, since a 60 percent rise leaves many prior visitors who did pay.',
        difficulty: 3,
      },
    ],
  },
];
