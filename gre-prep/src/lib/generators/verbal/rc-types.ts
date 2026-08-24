/* Reading Comprehension passage and question specs.
 *
 * Questions carry a `category` from the standard RC taxonomy, so a session
 * can drill one skill — inference, say, or contextual function — rather
 * than whatever the passage happens to offer.
 *
 *   reasoning            what would strengthen/weaken/parallel the argument
 *   inference            what must be true though not stated
 *   detail               what the passage explicitly says
 *   global               main idea, primary purpose, structure
 *   contextual-function  why a particular sentence or detail is there
 *   other                vocabulary-in-context, select-in-passage
 */

import type { Difficulty, RCCategory } from './taxonomy';

export interface RCQuestionSpec {
  category: RCCategory;
  format: 'select_one' | 'select_all' | 'select_in_passage';
  stem: string;
  /** Key first; order is randomized at build time. */
  choices?: string[];
  /** For select_all: the credited subset, given by text. */
  correctTexts?: string[];
  /** For select_in_passage. */
  sentence?: string;
  paragraphIndex?: number;
  explanation: string;
  difficulty: Difficulty;
  tags?: string[];
}

export interface PassageSpec {
  title: string;
  /** natural science | social science | humanities | business */
  topic: string;
  difficulty: Difficulty;
  /** Paragraphs separated by a blank line. */
  body: string;
  questions: RCQuestionSpec[];
}
