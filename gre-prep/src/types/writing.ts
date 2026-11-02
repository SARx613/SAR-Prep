/* Coaching content for the Issue task (content/writing-models/*.json). */

export interface ThesisOption { stance: 'agree' | 'qualified' | 'disagree'; thesis: string }
export interface Idea { angle: string; example: string; use: string }
export interface Annotation { quote: string; note: string }
export interface SampleEssay {
  score: 6 | 4 | 2;
  essay: string[];
  annotations: Annotation[];
  whyThisScore: string;
  toReachNext: string[];
}
export interface WritingModel {
  promptId: string;
  thesisOptions: ThesisOption[];
  ideaBank: Idea[];
  counter: { objection: string; response: string };
  outline: string[];
  pitfalls: string[];
  samples?: SampleEssay[];
}
