# Learning ~1,000 GRE words: research notes

Audience: French-speaking first-year student, web app (flashcards, quizzes, sentence completion). Confidence is flagged where I only saw abstracts or secondary summaries.

## What the evidence says

1. **Spacing beats massing, and learners don't believe it.** Cepeda et al. (2006) meta-analysis: spaced study beats massed in nearly all verbal-recall comparisons. Kornell (2009), using GRE-type word pairs: spacing won for 90% of participants, yet 72% believed massing worked better.
2. **Optimal gap scales with the deadline.** Cepeda et al. (2008): best gap is about 20-40% of the time-to-test for a 1-week test, about 5-10% for a 1-year test. For a test weeks or months away, the first reviews should be roughly 1 day, then a few days, then 1-2 weeks. Expanding and equal schedules perform about the same (Kang et al. 2014; Latimier et al. 2021, g about 0.03, secondary citation), so the exact algorithm matters less than reviewing at all. No primary source gives a canonical Leitner ladder; SM-2 starts at 1 then 6 days; Anki's FSRS docs suggest 90% desired retention (community-level evidence).
3. **Retrieval beats re-reading.** Karpicke & Roediger (2008, Science, foreign vocabulary): repeated testing drove delayed recall, while extra restudy after a correct recall added almost nothing. Pyc & Rawson (2010): testing also prompts better keyword mediators.
4. **Recall formats beat recognition.** Nakata (IRAL, flashcard study): typed recall gave better spelling/form knowledge than recognition; recognition was slightly better for form-meaning links, while recall slows in-session performance. Multiple choice suits first exposure.
5. **Context helps, but is not a substitute for definitions.** Webb, Yanagisawa & Uchihara (2020 meta-analysis of flashcards, word lists, writing, fill-in-the-blank): average gains of about 60% immediately but only 39% (meaning recall) and 25% (form recall) after a delay, so delayed retention needs repeated retrieval. I found no clean evidence that cloze beats flashcards for first learning; use it for consolidation, since the GRE tests words in sentences.
6. **Grouping similar words interferes.** Tinkham (1993), Waring (1997): semantically related sets (same superordinate) were learned more slowly; thematic sets did not hurt. Later work is mixed: Nakata & Suzuki (2019) found no accuracy gap, but related items caused more interference errors. Implication: introduce words in mixed or thematic batches; contrast near-synonyms later. Interleaving aids discrimination (Kornell & Bjork 2008; not word-specific).
7. **Roots, cognates, mnemonics.** French speakers know Greek/Latin-origin English words much better than other words (Coventry comparative study), so many GRE words are "free" recognition for them (e.g. *ephemeral* / *éphémère*, *pernicious* / *pernicieux*). Risk: false friends and shifted senses. Morphological awareness correlates moderately with vocabulary (r about .43; Cheng et al. 2025). Keyword mnemonics suit opaque words (Pyc & Rawson).

## What GRE prep resources do

- **Magoosh:** warns that more than 5-10 genuinely new words a day is "almost definitely too much"; pairs flashcards with 30-60 min/day of reading; deck of about 1,500 words with examples.
- **Manhattan Prep:** 500 Essential + 500 Advanced words; cards carry definition, usage notes, related words and etymology; advises sorting words into groups and using context clues; users report words "blend together" in large lists.
- **Manhattan Review:** free tiered decks of 50 words.
- **Anki GRE decks:** use SM-2/FSRS; community guidance is 10-25 new cards/day (not official).
- **ETS:** I found no official vocabulary-method advice; its guidance centres on practising with official verbal questions (words tested in context).

## Recommended design for our app

1. **Tiered frequency deck in batches of about 10, with a daily new-word cap of 8-12.** 1,000 words in about 100 days at 10/day; Magoosh's 5-10 warning means a hard cap at about 15.
2. **Leitner/SM-2-style scheduler with a learning phase and a cap on reviews.** Same-day steps (10 min, then end of session), then 1 d, 3 d, 7 d, 14 d, 30 d; a miss drops back two boxes. Reviews before new cards. Rationale: spacing scaled to a test weeks to months out.
3. **Retrieval-first card flow.** Always attempt before showing the answer; first exposure may be multiple choice, then move to typed recall (English definition/synonym, accept close spelling, show the root) from box 3 onward. Rationale: retrieval and recall formats outperform restudy and recognition.
4. **Cloze sentence-completion as consolidation.** Once a word reaches box 2-3, test it in 2-3 different sentences (rotate, never repeat the same sentence), with GRE-style two-blank items weekly. Rationale: transfer to the test format.
5. **Mixed batches first, contrast sets later.** New batches mix themes (sentiment, argument, time, size), not 10 synonyms at once. Once each word is stable (box 3+), add "choose the best word among confusable near-synonyms" drills and synonym/antonym cluster quizzes. Rationale: avoid early interference, then build discrimination.
6. **French-aware cards.** Show etymology/root family, flag the French cognate ("transparent" in green) and tag false friends or shifted senses ("trap" in red); allow a user mnemonic note. Rationale: speeds encoding of Latinate words and guards against false friends.
7. **Short daily sessions and honest metrics.** 15-25 min/day, split in two if possible; show a retention rate per box and a "leech" list (4+ lapses triggers a mnemonic prompt and re-teaching). Rationale: learners misjudge what works, so show data; leeches need a new encoding.

## Sources

- Cepeda et al. 2006 (spacing meta-analysis): https://www.evullab.org/pdf/CepedaPashlerVulWixtedRohrer-PB-2006.pdf
- Cepeda et al. 2008 (optimal gap): https://pubmed.ncbi.nlm.nih.gov/19076480/
- Kang, Lindsey, Mozer & Pashler 2014 (expanding vs equal): https://home.cs.colorado.edu/~mozer/Research/Selected%20Publications/reprints/KangLindseyMozerPashler2014.pdf
- Kornell 2009 (flashcard spacing): https://cir.nii.ac.jp/crid/1361699994055985152
- Karpicke & Roediger 2008: https://pubmed.ncbi.nlm.nih.gov/18276894/
- Pyc & Rawson 2010 (summary): https://www.kent.edu/psychology/news/researchers-kent-state-say-practice-tests-improve-memory
- Nakata (flashcard formats, IRAL): https://www.degruyterbrill.com/document/doi/10.1515/iral-2015-0022/html?lang=en
- Webb, Yanagisawa & Uchihara 2020 (summary): https://www.x-mol.com/paper/1341861690617110528
- Nakata & Suzuki 2019 (massing/spacing, related words): https://www.cambridge.org/core/product/F58BA8D70385603B9C42E408BFCB8A10
- Tinkham/Waring (semantic clustering, summary): https://resolve.cambridge.org/core/journals/studies-in-second-language-acquisition/article/effects-of-massing-and-spacing-on-the-learning-of-semantically-related-and-unrelated-words/F58BA8D70385603B9C42E408BFCB8A10
- Kornell & Bjork 2008 (interleaving, summary): https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.770885/pdf
- French speakers and Graeco-Latin words: https://pureportal.coventry.ac.uk/en/publications/8dd18396-4ce4-4055-a4d6-58e8a62618ef
- Morphological awareness meta-analysis: https://pure.ecnu.edu.cn/en/publications/morphological-awareness-and-vocabulary-knowledge-in-monolingual-a/
- Magoosh flashcards guidance (via search snippet): https://magoosh.zendesk.com/hc/en-us/articles/217412146-How-to-use-Flashcards-and-Reading-to-Improve-Vocabulary
- Manhattan Prep blog/flashcards: https://www.manhattanprep.com/gre/wp-json/wp/v2/posts/12824 ; forum: https://forum.thegradcafe.com/topic/46074-how-many-gre-words-should-i-learn
- Manhattan Review decks: https://www.manhattanreview.com/free-gre-vocab-flashcards/?fcid=56
- Anki algorithm FAQ: https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm.md
- Leitner system overview: https://subjectguides.york.ac.uk/study-revision/leitner-system
