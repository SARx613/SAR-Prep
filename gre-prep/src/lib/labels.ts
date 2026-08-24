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
  quant: 'Quantitatif',
};

export const TOPIC_LABEL: Record<string, string> = {
  arithmetic: 'Arithmétique',
  algebra: 'Algèbre',
  geometry: 'Géométrie',
  'data-analysis': 'Analyse de données',
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
  interest: 'Intérêts',
  ratio: 'Ratios',
  rate: 'Vitesses et taux',
  mixture: 'Mélanges',
  'integer-properties': 'Propriétés des entiers',
  'linear-equations': 'Équations linéaires',
  'quadratic-equations': 'Équations du second degré',
  exponents: 'Exposants',
  inequalities: 'Inégalités',
  'coordinate-geometry': 'Géométrie analytique',
  functions: 'Fonctions',
  triangles: 'Triangles',
  circles: 'Cercles',
  polygons: 'Polygones',
  solids: 'Solides',
  statistics: 'Statistiques',
  probability: 'Probabilités',
  counting: 'Dénombrement',
  'data-interpretation': 'Lecture de graphiques',
};

export const label = (map: Record<string, string>, key: string | null): string =>
  (key && map[key]) || key || '—';
