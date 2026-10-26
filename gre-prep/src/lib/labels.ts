/* Human labels for the taxonomy stored in the database.
 *
 * Kept in one place so the practice picker, the progress page and anything
 * later all name a category the same way. Category names that are terms of
 * art on the exam (Text Completion, Quantitative Comparison) stay in
 * English; the surrounding interface is French.
 */

export const TYPE_LABEL: Record<string, string> = {
  TC: 'Text Completion',
  SE: 'Sentence Equivalence',
  RC: 'Reading Comprehension',
  QC: 'Quantitative Comparison',
  PS: 'Problem Solving',
  NE: 'Numeric Entry',
  DI: 'Data Interpretation',
};

export const SECTION_LABEL: Record<string, string> = {
  verbal: 'Verbal',
  quant: 'Quant',
};

export const TOPIC_LABEL: Record<string, string> = {
  arithmetic: 'Arithmetic',
  algebra: 'Algebra',
  geometry: 'Geometry',
  'data-analysis': 'Data analysis',
  'text-completion': 'Text Completion',
  'sentence-equivalence': 'Sentence Equivalence',
  'reading-comprehension': 'Reading Comprehension',
};

export const SUBTOPIC_LABEL: Record<string, string> = {
  // Verbal — short verbal
  'tc-1-blank': '1 blanc',
  'tc-2-blank': '2 blancs',
  'tc-3-blank': '3 blancs',
  'sentence-equivalence': 'Paires de synonymes',
  // Verbal — reading comprehension
  reasoning: 'Reasoning',
  inference: 'Inference',
  detail: 'Detail',
  global: 'Global',
  'contextual-function': 'Contextual Function',
  other: 'Other',
  // Quant
  percent: 'Pourcentages',
  interest: 'Interest',
  ratio: 'Ratios',
  rate: 'Vitesses et taux',
  mixture: 'Mixtures',
  'integer-properties': 'Integer properties',
  'linear-equations': 'Linear equations',
  'quadratic-equations': 'Quadratic equations',
  exponents: 'Exposants',
  inequalities: 'Inequalities',
  'coordinate-geometry': 'Coordinate geometry',
  functions: 'Fonctions',
  triangles: 'Triangles',
  circles: 'Cercles',
  polygons: 'Polygones',
  solids: 'Solides',
  statistics: 'Statistiques',
  probability: 'Probability',
  counting: 'Counting',
  'data-interpretation': 'Lecture de graphiques',
};

export const label = (map: Record<string, string>, key: string | null): string =>
  (key && map[key]) || key || '—';
