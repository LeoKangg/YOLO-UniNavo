# UniNavo

[Live site](https://ivyparc.github.io/UniNavo/) · [Implementation PR](https://github.com/ivyparc/UniNavo/pull/1)

A bilingual U.S. university admission planner for an Ontario Grade11 student in October2026, targeting Fall2028. The university explorer compares published academic/test components. It cannot establish complete admission eligibility or an acceptance outcome.

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
- **University explorer:** an expanding research pool of63schools, including20with extended detail records. Eight Ontario bands and five SAT scenarios produce40combinations. At most10records appear when applicable published components can be compared. A shortage is explicit; unverified institutions do not fill missing places.
- **All scenarios:**40cells show match counts and shortages under the selected averaging basis and applicant route. Click a cell to inspect its evidence; download all40results as CSV.
- **Research catalog:** all reviewed schools remain searchable, including schools excluded from strict recommendations. Cards link program/entry structure and primary evidence. School details distinguish current rules, score-cohort scope, unknown Ontario equivalencies and future-cycle uncertainty.
- **SAT distribution table:** the full research pool is reorganized by SAT bands1100–1600. These are score positions, never an independent admission recommendation.
- **SAT/AP and resources:** official practice, sourced exam calendars, AP priorities and credit examples, study materials and book editions.
- **Sources:** searchable exact URLs, publisher, actual review date and cycle. Korean/English toggle persists without changing IDs or saved inputs. Official source titles and publishers retain original wording.

Body and control text stays readable; mobile tables scroll within their containers. The selected averaging basis is required because cumulative academic, core-subject, overall and Grade12top-six averages are not interchangeable. Each university percentage rule also needs its own calculation confirmation, unchecked by default. Each scenario then conditionally represents an average calculated by that university’s method; it does not convert an actual top-six mark. Contradictory SAT totals/sections block all matches.

## Strict recommendation policy

The user explicitly requested **only officially confirmed criteria and a visible shortage when fewer than ten are supported**. The live explorer no longer uses the earlier editorial six-pick or manually assigned grade-category model.

A record needs a resolvable current testing rule and one of:

1. An explicit Ontario percentage requirement, compared on the correct basis.
2. A university-published international100-point rule, compared on its stated core-course basis.
3. An applicable international SAT alternative that replaces the GPA component, with any section minima checked.

Missing Ontario equivalencies, mismatched averaging methods, unresolved source conflicts and an unreviewed U.S.domestic route cannot produce a strict match. Historical SAT percentiles, university rank and choosing humanities do not create eligibility. No Ontario percentage is converted to a U.S.GPA.

The output says **published component comparison**, not complete qualification. Coursework, English, graduation, program requirements, documents and finances remain separate. A current rule is not automatically a Fall2028 commitment. An empty list is not a rejection decision.

Verified2026U.S.NewsNationalUniversities ranks order matching records where available; unverified ranks follow by name. This ranks the matching researched pool, not every U.S.university. Categories/editions are not mixed. No representative Korean recognition ranking or unique easiest-admission major was established. Program names and actual admission structures are given with sources; unknown lowest cutoffs remain unknown.

Read [research/scenario-method.md](research/scenario-method.md) for exact scope, strict inequalities, test-alternative logic and limitations.

## Data and source structure

```text
src/main.ts                    Navigation, editable timeline, local persistence
src/university-explorer.ts     Evidence-only university views and detail dialogs
src/scenarios.ts               Strict component checks, shortages,40-case CSV
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

Original strategy/recommendation modules retain historical metadata and tests for earlier behavior and storage compatibility; their editorial categories are not used by the live university explorer.

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

Only repository: https://github.com/ivyparc/UniNavo . Source branch is codex/us-college-planner; main history is preserved. CI validates data, types, lint, tests and build.

GitHub Pages publishes built static files from codex/site in the same repository. Build with pnpm build:pages for the /UniNavo/ asset base. Publish dist plus .nojekyll as a new commit retaining the artifact branch's previous parent, then fast-forward its ref. A separate worktree or Git data API may publish artifacts without overwriting the source checkout. Never force-push or change repository identity. Check Pages deployment and the live bundle before reporting publication.
