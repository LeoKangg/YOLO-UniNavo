# UniNavo

[Live site](https://yolo-edu.github.io/YOLO-UniNavo/) · [Repository](https://github.com/YOLO-EDU/YOLO-UniNavo)

A bilingual U.S. university admission planner for an Ontario Grade11 student in October2026, targeting Fall2028. The university explorer offers ten explicitly editorial research candidates per Ontario/SAT combination, with sourced requirements and score cohorts. It cannot establish complete admission eligibility or an acceptance outcome.

## Run and verify

Requires Node22.18+ (Node24 recommended) and the package manager recorded in package.json.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build:pages
```

No account, API key, database or backend is required. Plans, language, saved schools and scenario inputs use browser localStorage. A blocked/corrupt store falls back safely. Plans support JSON backup/restore; there is no automatic cross-device synchronization. There is no analytics or form submission.

## Experience

- **Monthly roadmap:**23months, October2026–August2028;72original tasks. All months and instructions are expanded. Add, edit, move, delete, complete, hide completed, undo and back up/restore. Edited official reminders retain their original guidance and sources. The stage dropdown defaults to Select.
- **University explorer:** 94 researched universities; eight Ontario bands × five SAT scenarios, with ten research candidates per combination. SAT is the only profile input. The applicant context is Korean citizenship / U.S. international first-year / humanities, sociology and history.
- **All scenarios:** each of 40 cells previews three names and opens ten candidates with programs, academic conditions, testing policies and evidence. CSV exports all 250 candidate entries, including uncertainty and selection method.
- **Research catalog:** all reviewed schools remain searchable, including schools excluded from strict recommendations. Cards link program/entry structure and primary evidence. School details distinguish current rules, score-cohort scope, unknown Ontario equivalencies and future-cycle uncertainty.
- **SAT distribution table:** the full research pool is reorganized by SAT bands1100–1600. These are score positions, never an independent admission recommendation.
- **SAT/AP and resources:** official practice, sourced exam calendars, AP priorities and credit examples, study materials and book editions.
- **Sources:** searchable exact URLs, publisher, actual review date and cycle. Korean/English toggle persists without changing IDs or saved inputs. Official source titles and publishers retain original wording.

Body and controls remain readable; mobile tables scroll within their containers. The SAT field accepts valid 400–1600 totals in increments of ten. Curated lists cover 1100–1600. A score between reference points uses the lower reference list, while evidence comparison uses the actual score. Old saved citizenship, GPA-calculation confirmations and section assumptions are cleared from candidate state.

## Candidate selection and accuracy

The live lists are **editorial research priorities, not confirmed eligibility, Safety/Match classifications, admission probabilities or the ten best attainable universities nationwide**. This distinction appears above the matrix, above results, in details and in every CSV record. Official facts and editorial grade-band placement are separate. No Ontario percentage is converted to U.S. GPA, and no missing fact is turned into a satisfied requirement.

Lower-grade cases investigate lower published GPA requirements, alternative SAT routes, special review and foundation options. Stronger-grade cases broaden to selective universities and college-specific profiles. SAT policy, cohort scope and academic review remain explicit; a higher SAT does not override an academic minimum. Some lower-grade lists therefore repeat at higher SAT scores.

Toledo publishes lower GPA requirements for its general arts/social-sciences college than several professional programs; Purdue publishes separate Liberal Arts and Engineering profiles. Neither proves the absolute easiest individual major. Maryland and Florida expressly do not provide a university-admission advantage merely from choosing humanities. All records retain the unknown easiest-major status.

Ranking references are historical 2026 U.S. News National Universities evidence, not a current-edition or Korean-recognition ranking. A current policy is not automatically a Fall 2028 commitment. Minnesota's profile year inconsistency remains visible. Detailed school and SAT views share the updated catalog to avoid conflicting profiles.

Read [research/candidate-method.md](research/candidate-method.md) for current selection scope. [research/scenario-method.md](research/scenario-method.md) documents the retained strict component engine; that engine does not drive the live shortlist.

## Data and source structure

```text
src/main.ts                    Navigation, editable timeline, local persistence
src/university-explorer.ts     Research candidate views and detail dialogs
src/candidate-plans.ts         40 curated lists, evidence explanations,400-row CSV
src/scenarios.ts               Retained strict component engine (not live selection)
src/scenario-types.ts          Evidence and input types
src/data/scenario-catalog.ts   Original records plus expanded research
src/data/scenario-raw.ts       Raw research files and source collection
src/planner.ts                 Personal monthly plan transformations
src/locales/                  Korean UI and research translations
research/scenario-*.json        New program, entry, testing and percentage evidence
research/*-method.md            Source methods and explicit research limits
research/west.json             Original western school details
research/east.json             Original eastern school details
research/iowa.json             Original Iowa State details
research/expansion-*.json      Original additional11extended school records
research/planning.json          Exam, Ontario, entry and materials guidance
scripts/validate-scenarios.ts  Expanded evidence validation
scripts/validate.ts             Source/calendar/extended-data validation
```

Research was reviewed October21–22,2026. University admissions pages, official catalogs, institutional profiles and Common Data Sets establish consequential facts. Original ranking reports identify secondary sourcing when applicable. Every source keeps its exact URL, publisher, review date and reference cycle. Not verified means this review did not establish a value; it does not claim the school never publishes it. An HTTP success code alone does not audit the claim.

Original strategy/recommendation modules and the strict component engine retain historical tests; they do not select the live candidate lists.

## Known limits

- Most Fall2028 deadlines and several entry-year testing commitments still require confirmation.
- 2027–28 SAT dates are anticipated;2028APdates remain unconfirmed in the reviewed schedule.
- Specific English waivers, program prerequisites, Ontario equivalencies, costs, aid and citizenship/visa rules require school-specific review.
- A major offered by a university is not necessarily easier to enter. Admission to a university, a selective college and later admission/declaration of a major are different processes.
- School/college score distributions identify admitted versus enrolled cohorts and score-submitter scope. Test-optional submitters do not represent every applicant.
- Browser CSV generation is tested directly; automation did not verify the download save dialogue. No browser download-completion claim is made.

## Maintaining evidence

Open the exact primary source, identify year/campus/program/applicant category, and update text and source IDs together. Preserve real review dates and unknown/conflicting values. Add a structured numeric rule only when it is explicitly published and its scope is clear. A new easiest-major assertion requires comparative evidence and a new audit. Update Korean wording with the same limits. Run validation, typecheck, lint, behavioral tests and production build, then inspect desktop/mobile and keyboard interaction.

## Repository and deployment

This deployment uses https://github.com/YOLO-EDU/YOLO-UniNavo and its `main` source branch. It shares ancestry with `ivyparc/UniNavo`, but contains newer planner and YOLO Education branding changes. Deploy this repository independently; the original repository is not the publishing destination.

GitHub Pages publishes at https://yolo-edu.github.io/YOLO-UniNavo/. In Settings → Pages, the source must be **GitHub Actions**. `.github/workflows/pages.yml` validates the data, types and behavioral tests, builds with `pnpm build:pages` using the `/YOLO-UniNavo/` asset base, uploads `dist`, and deploys through the `github-pages` environment on every push to `main`. It can also be started manually. Pull requests continue to use the separate validation workflow.

The separate Sites deployment documented in `research/shared-site.md` uses `--base=/` and is not updated by this GitHub Pages workflow.

## University imagery

University cards and detail dialogs share a locally hosted logo and campus-building photo for each researched school. `src/data/university-media.json` records the original file, identifying caption, author, source page and license; the UI exposes attribution and license links. Files live in `public/university-media/` and load lazily. University logos remain the property of their owners.

Use `python3 scripts/download-university-media.py` only to restore missing files from the reviewed manifest. It preserves existing files, spaces requests and stops on rate limiting; honor the server's Retry-After before resuming. Verify school/campus identity and image rights before replacing an image. `tests/university-media.test.ts` checks full catalog coverage, local file presence and attribution.

QS review: the live matrix displays Ontario 75–100% (25 combinations), with 250 exported entries. Verified QS2027 ranks order candidates and the SAT comparison; QS is not an admission probability. Secondary Naver/Reddit review and official sources are in research/recognition-review.md and research/qs-ranking-review.md.

Elite SAT review: the SAT view keeps all 14 reviewed highly selective universities visible. Twelve official composite profiles retain their cohort/year (Brown: Fall 2026 admitted submitters; eleven others: Fall 2025 enrolled submitters). Harvard and Penn display official section distributions without adding percentiles into a fabricated composite. Verification records: research/elite-sat-verification.md and research/harvard-sat-review.md.
