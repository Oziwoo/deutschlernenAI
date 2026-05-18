/**
 * UI translations: English (default) and Polish.
 * Usage: t('key', lang)  where lang = 'en' | 'pl'
 */

const strings = {
  // ── App shell ─────────────────────────────────────────────────────
  app_loading:       { en: 'Loading progress…',   pl: 'Ładowanie postępu…'  },

  // ── Navigation ────────────────────────────────────────────────────
  nav_home:          { en: 'Home',        pl: 'Start'       },
  nav_learn:         { en: 'Learn',       pl: 'Nauka'       },
  nav_quiz:          { en: 'Quiz',        pl: 'Quiz'        },
  nav_browse:        { en: 'Dictionary',  pl: 'Słownik'     },
  nav_mastered:      { en: '% mastered',  pl: '% opanowano' },
  nav_login:         { en: 'Sign in',     pl: 'Zaloguj się' },
  nav_logout:        { en: 'Sign out',    pl: 'Wyloguj się' },
  nav_theme_toggle:  { en: 'Toggle theme',pl: 'Zmień motyw' },
  nav_lang_toggle:   { en: 'Language',    pl: 'Język'       },

  // ── Dashboard ─────────────────────────────────────────────────────
  dash_welcome:      { en: 'Welcome!',               pl: 'Witaj!'                    },
  dash_keep_going:   { en: 'Keep learning!',          pl: 'Ucz się dalej!'            },
  dash_subtitle_new: { en: 'most important German words', pl: 'najważniejszych słów niemieckich' },
  dash_progress_of:  { en: 'of',                     pl: 'z'                         },
  dash_progress_lbl: { en: 'Progress',               pl: 'Postęp'                    },
  dash_stat_mastered:{ en: 'Mastered',               pl: 'Opanowano'                 },
  dash_stat_to_learn:{ en: 'To study',               pl: 'Do nauki'                  },
  dash_stat_done:    { en: 'Done',                   pl: 'Ukończono'                 },
  dash_legend_learning:{ en: 'Learning',             pl: 'W nauce'                   },
  dash_legend_review: { en: 'Review',                pl: 'Powtórzenie'               },
  dash_legend_mastered:{ en: 'Mastered',             pl: 'Opanowane'                 },
  dash_legend_new:   { en: 'New',                    pl: 'Nowe'                      },
  dash_action_learn: { en: 'Study words',            pl: 'Ucz się słów'              },
  dash_action_learn_sub:{ en: 'Flashcards with spaced repetition · {n} new', pl: 'Karty z powtarzaniem · {n} nowych' },
  dash_action_sentence:{ en: 'Sentence Builder',     pl: 'Układanie zdań'            },
  dash_action_sentence_sub:{ en: 'Practice word order and grammar', pl: 'Ćwicz szyk wyrazów i gramatykę' },
  dash_action_quiz:  { en: 'Quick Quiz',             pl: 'Szybki quiz'               },
  dash_action_quiz_sub:{ en: 'Pick the right word from 4 choices', pl: 'Wybierz właściwe słowo spośród 4' },
  dash_action_browse:{ en: 'All words',              pl: 'Wszystkie słowa'            },
  dash_action_browse_sub:{ en: 'Search and filters', pl: 'Wyszukaj i filtruj'        },
  dash_action_add:   { en: 'Add word',               pl: 'Dodaj słowo'               },
  dash_action_add_sub:{ en: 'Add to dictionary',     pl: 'Dodaj do słownika'         },
  dash_how_title:    { en: '💡 How it works',        pl: '💡 Jak to działa'           },
  dash_how_1:        { en: '• <strong>Flashcards</strong> — see the word, think, flip → read contextual explanation', pl: '• <strong>Karty</strong> — widzisz słowo, myślisz, odwracasz → czytasz wyjaśnienie w kontekście' },
  dash_how_2:        { en: '• <strong>Rating</strong> — "Don\'t know / Hard / Know / Easy" → system decides when to repeat', pl: '• <strong>Ocena</strong> — "Nie wiem / Trudne / Wiem / Łatwe" → system decyduje kiedy powtórzyć' },
  dash_how_3:        { en: '• <strong>Progress</strong> — saved automatically, works on any device', pl: '• <strong>Postęp</strong> — zapisywany automatycznie, działa na każdym urządzeniu' },

  // ── Status labels ─────────────────────────────────────────────────
  status_new:        { en: '✦ New',         pl: '✦ Nowe'          },
  status_learning:   { en: '~ Learning',    pl: '~ W nauce'       },
  status_review:     { en: '↻ Review',      pl: '↻ Powtórzenie'   },
  status_mastered:   { en: '✓ Mastered',    pl: '✓ Opanowane'     },
  status_new_lbl:    { en: 'New',           pl: 'Nowe'            },
  status_learning_lbl:{ en: 'Learning',     pl: 'W nauce'         },
  status_review_lbl: { en: 'Review',        pl: 'Powtórzenie'     },
  status_mastered_lbl:{ en: 'Mastered',     pl: 'Opanowane'       },

  // ── LearnMode ─────────────────────────────────────────────────────
  learn_back:        { en: '← Back',               pl: '← Wróć'                  },
  learn_show_expl:   { en: 'Show explanation',      pl: 'Pokaż wyjaśnienie'        },
  learn_generating:  { en: 'Generating explanation…', pl: 'Generuję wyjaśnienie…'  },
  learn_remaining:   { en: 'Remaining: {n} words',  pl: 'Pozostało: {n} słów'     },
  learn_done_title:  { en: 'Session complete!',     pl: 'Sesja zakończona!'        },
  learn_done_sub:    { en: 'Cards studied: {n}',    pl: 'Przerobiono kart: {n}'    },
  learn_done_all:    { en: 'All done for today!',   pl: 'Na dziś wszystko!'        },
  learn_another:     { en: 'Another round',         pl: 'Jeszcze runda'            },
  learn_home:        { en: 'Home',                  pl: 'Start'                    },
  learn_know:        { en: 'Know',                  pl: 'Wiem'                     },
  learn_hard:        { en: 'Hard',                  pl: 'Trudne'                   },
  learn_again:       { en: "Don't know",            pl: 'Nie wiem'                 },
  learn_easy:        { en: 'Easy',                  pl: 'Łatwe'                    },
  learn_again_sub:   { en: 'Again',                 pl: 'Jeszcze raz'              },
  learn_hard_sub:    { en: '+1 day',                pl: '+1 dzień'                 },
  learn_good_sub:    { en: 'Good',                  pl: 'Dobrze'                   },
  learn_easy_sub:    { en: 'Great',                 pl: 'Świetnie'                 },
  learn_translation: { en: 'Translation',           pl: 'Tłumaczenie'              },
  // score labels on done screen
  score_know:        { en: 'Know',                  pl: 'Wiem'                     },
  score_hard:        { en: 'Hard',                  pl: 'Trudne'                   },
  score_again:       { en: "Don't know",            pl: 'Nie wiem'                 },

  // ── QuizMode ─────────────────────────────────────────────────────
  quiz_header:       { en: 'Select the word by description', pl: 'Wybierz słowo według opisu' },
  quiz_loading:      { en: 'Loading…',              pl: 'Ładowanie…'               },
  quiz_done_title:   { en: 'Quiz complete!',        pl: 'Quiz zakończony!'          },
  quiz_done_sub:     { en: 'Correct: {c} of {t} ({p}%)', pl: 'Poprawnie: {c} z {t} ({p}%)' },
  quiz_another:      { en: 'Another round',         pl: 'Jeszcze runda'            },
  quiz_home:         { en: 'Home',                  pl: 'Start'                    },
  quiz_back:         { en: '← Back',               pl: '← Wróć'                  },
  quiz_correct_lbl:  { en: 'Correct ✓',            pl: 'Dobrze ✓'                 },
  quiz_wrong_lbl:    { en: 'Wrong ✗',              pl: 'Błąd ✗'                   },

  // ── BrowseMode ────────────────────────────────────────────────────
  browse_title:      { en: 'All words',             pl: 'Wszystkie słowa'           },
  browse_of:         { en: 'of',                    pl: 'z'                         },
  browse_search:     { en: 'Search by word…',       pl: 'Szukaj słowa…'             },
  browse_all:        { en: 'All',                   pl: 'Wszystkie'                 },
  browse_nothing:    { en: 'Nothing found',         pl: 'Nic nie znaleziono'        },
  browse_show_expl:  { en: 'Show contextual explanation', pl: 'Pokaż wyjaśnienie w kontekście' },
  browse_generating: { en: 'Generating explanation…', pl: 'Generuję wyjaśnienie…'  },
  browse_reviews:    { en: 'Reviews:',              pl: 'Powtórzeń:'                },
  browse_interval:   { en: 'Interval:',             pl: 'Interwał:'                 },
  browse_days:       { en: 'days',                  pl: 'dni'                       },
  browse_next:       { en: 'Next:',                 pl: 'Następne:'                 },

  // ── SentenceBuilder ───────────────────────────────────────────────
  sb_back:           { en: '← Back',               pl: '← Wróć'                  },
  sb_mode_blocks:    { en: 'Blocks',                pl: 'Bloki'                    },
  sb_mode_free:      { en: 'Free form',             pl: 'Własny tekst'             },
  sb_loading:        { en: 'Generating task...',    pl: 'Generuję zadanie...'      },
  sb_error_title:    { en: 'Failed to load task',   pl: 'Nie udało się załadować zadania' },
  sb_error_sub:      { en: 'Check your internet connection and API key.', pl: 'Sprawdź połączenie z internetem i klucz API.' },
  sb_retry:          { en: 'Try again',             pl: 'Spróbuj ponownie'         },
  sb_skip:           { en: 'Skip →',                pl: 'Pomiń →'                  },
  sb_prompt_blocks:  { en: 'Build the translation:', pl: 'Ułóż tłumaczenie:'       },
  sb_prompt_free:    { en: 'Make a sentence with:', pl: 'Ułóż zdanie ze słowem:'   },
  sb_placeholder:    { en: 'Place words here...',   pl: 'Przeciągnij słowa tutaj...' },
  sb_check:          { en: 'Check',                 pl: 'Sprawdź'                  },
  sb_check_ai:       { en: 'Check with AI',         pl: 'Sprawdź przez AI'         },
  sb_checking:       { en: 'Checking...',           pl: 'Sprawdzam...'             },
  sb_correct:        { en: 'Excellent!',            pl: 'Doskonale!'               },
  sb_minor:          { en: 'Almost perfect',        pl: 'Prawie idealnie'           },
  sb_wrong:          { en: 'Errors found',          pl: 'Znaleziono błędy'         },
  sb_next:           { en: 'Next word →',           pl: 'Następne słowo →'         },
  sb_done_title:     { en: 'Training complete!',    pl: 'Trening zakończony!'      },
  sb_done_sub:       { en: 'Great work on sentence building.', pl: 'Świetna praca nad budowaniem zdań.' },
  sb_home:           { en: 'Home',                  pl: 'Start'                    },

  // ── Voice Answer ──────────────────────────────────────────────────
  voice_listen:      { en: 'Listening…',                              pl: 'Słucham…'                                       },
  voice_evaluating:  { en: 'Analyzing…',                             pl: 'Analizuję…'                                     },
  voice_try_again:   { en: 'You said: "{said}". Try again!',         pl: 'Powiedziałeś: "{said}". Spróbuj ponownie!'      },
  voice_no_support:  { en: 'Voice input not supported in this browser', pl: 'Przeglądarka nie obsługuje rozpoznawania głosu' },

  // ── Categories ────────────────────────────────────────────────────
  cat_art:  { en: 'Articles / Pronouns',          pl: 'Rodzajniki / Zaimki'      },
  cat_con:  { en: 'Conjunctions / Prepositions',  pl: 'Spójniki / Przyimki'      },
  cat_vb1:  { en: 'Core Verbs',                   pl: 'Podstawowe czasowniki'    },
  cat_vb2:  { en: 'Extended Verbs',               pl: 'Dodatkowe czasowniki'     },
  cat_ppl:  { en: 'People / Family',              pl: 'Ludzie / Rodzina'         },
  cat_plc:  { en: 'Places / Buildings',           pl: 'Miejsca / Budynki'        },
  cat_tim:  { en: 'Time',                         pl: 'Czas'                     },
  cat_obj:  { en: 'Objects / Things',             pl: 'Przedmioty / Rzeczy'      },
  cat_abs:  { en: 'Abstract Concepts',            pl: 'Pojęcia abstrakcyjne'     },
  cat_bod:  { en: 'Body / Health',                pl: 'Ciało / Zdrowie'          },
  cat_fod:  { en: 'Food / Drinks',                pl: 'Jedzenie / Napoje'        },
  cat_nat:  { en: 'Nature / Environment',         pl: 'Natura / Środowisko'      },
  cat_tec:  { en: 'Technology / Media',           pl: 'Technologia / Media'      },
  cat_adj:  { en: 'Adjectives',                   pl: 'Przymiotniki'             },
  cat_adv:  { en: 'Adverbs / Numbers',            pl: 'Przysłówki / Liczby'      },
}

/**
 * Get a translated string by key and language.
 * Supports {n}, {c}, {t}, {p} placeholders: pass replacements as 2nd arg object.
 * @param {string} key
 * @param {'en'|'pl'} lang
 * @param {Record<string,string|number>} [vars]
 */
export function t(key, lang = 'en', vars = {}) {
  const entry = strings[key]
  if (!entry) return key
  let str = entry[lang] ?? entry.en ?? key
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, String(v))
  }
  return str
}

/**
 * Returns the translated category name map for the given language.
 */
export function getCategoryNames(lang = 'en') {
  return {
    art: t('cat_art', lang),
    con: t('cat_con', lang),
    vb1: t('cat_vb1', lang),
    vb2: t('cat_vb2', lang),
    ppl: t('cat_ppl', lang),
    plc: t('cat_plc', lang),
    tim: t('cat_tim', lang),
    obj: t('cat_obj', lang),
    abs: t('cat_abs', lang),
    bod: t('cat_bod', lang),
    fod: t('cat_fod', lang),
    nat: t('cat_nat', lang),
    tec: t('cat_tec', lang),
    adj: t('cat_adj', lang),
    adv: t('cat_adv', lang),
  }
}
