# UniNavo

**Live site:** https://ivyparc.github.io/UniNavo/ · **Implementation PR:** https://github.com/ivyparc/UniNavo/pull/1

A source-linked U.S. university admission planner for an Ontario student in Grade 11, Semester 1 (October 2026), targeting Fall 2028 entry. The planner assumes normal progression to Grade 12 in 2027–28 and high-school graduation in June 2028. This is planning guidance, not an admission guarantee.

## Run locally

Requires Node.js 22.18+ (Node 24 recommended) and pnpm 11.25.0. The package manager version is recorded in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`.

```sh
pnpm validate     # data completeness, references, dates and IDs
pnpm typecheck
pnpm lint
pnpm test         # behavioral, evidence, comparison and personal-plan tests
pnpm build       # production output in dist/
pnpm preview     # preview the production build
pnpm check:links  # network check; writes research/link-check.json
```

No account, API key, database or backend is required. Language preference, profile, personal monthly plans, task completion and saved schools use browser localStorage. Plans can be backed up and restored as JSON. A blocked/corrupt store falls back to the current session. Browser data is not synchronized across devices. Google Fonts is the only runtime third-party asset request; system fonts are fallbacks. There is no analytics or form submission.

## Experience

- Language: the header’s **한국어 / English** button switches all five views, university facts and the complete timeline. The choice persists in this browser; filters, saved schools and task IDs stay unchanged. Korean university/major search is supported. Official source document titles, publishers, reference cycles and book titles retain their original wording. No translation API is used.

- Timeline (home): 23 months, October 2026–August 2028, and 72 original tasks. All months and task details are expanded. The month chart shows progress and links to each month. Add, edit, move, delete and complete tasks; completed tasks hide by default and can be revealed. Single-step undo and JSON backup/restore are available. Edited official reminders retain their original guidance and sources. The stage dropdown defaults to “Select”.
- Universities: the first tab presents nine SAT score bands (1100–1600) as a school distribution table. Sixteen schools have verified official composite ranges; four remain explicitly unclassified. Whole-band position is shown as score advantage / overlap / score stretch, with actual ranges, campus/college scope, source cohorts and clickable school details. Each cell initially shows four schools and can reveal the rest. The detailed comparison retains 20 schools, eight Ontario grade bands from 60–65% through 95–100%, and five SAT scenarios from 1100 to 1500. Compare 40 combinations, export all 800 school-scenario rows, inspect rankings/major evidence, browse school cards and keep up to six working recommendations. Saved schools remain separate from generated picks.
- SAT & AP: confirmed 2026–27 SAT dates, separately labeled anticipated 2027–28 dates, four AP priorities and university-specific credit examples.
- Study resources: purpose and link first; publisher editions, explanations and sources expand on demand. Preorder information is preserved.
- Sources: searchable source register with exact URLs, publisher, reviewed date and applicable cycle.

Body text is 16–18px and secondary text is at least 14px. Desktop university/AP cards use two columns and mobile uses one. The university SAT matrix is visible after a grade band is selected; detailed exam preparation and AP credit sections expand on demand. Task instructions and their sources are shown directly, without a separate expand button, in both languages. Important entry-year uncertainty remains visible.

## Structure

```text
src/main.ts                 Views, accessible native controls and interaction
src/style.css               Responsive layout and focus/reduced-motion styles
src/types.ts                Shared types and supported grade bands
src/recommendations.ts      Transparent conservative planning scenarios
src/storage.ts              Resilient browser-local persistence
src/planner.ts              Editable personal timeline and backup normalization
src/comparison.ts           SAT comparisons and complete scenario CSV
src/i18n.ts                 Saved language, text localization, stable option values
src/locales/ko-*.ts          Korean UI, university, planning and timeline translations
src/data/index.ts           Research loading and source register
src/data/strategies.ts      Editorial choices, majors and sourced score ranges
src/data/timeline.ts        Monthly tasks with stable completion IDs
research/west.json          ASU, Arizona, Oregon, Colorado Boulder
research/east.json          MSU, IU Bloomington, Penn State University Park, NYU
research/iowa.json          Iowa State
research/expansion-*.json    Eleven additional schools and supporting metadata
research/existing-rankings.json  Dated ranks for the original nine schools
research/comparison-context.json  Additional program evidence and full catalogs
research/sat-band-*.json     New official score distributions and policy context
research/*-method.md         Comparison, score-band and recognition research boundaries
research/planning.json      Official exam calendars, Ontario/entry guidance, books
research/pathways.json      Transfer strategy, separate from freshman admission
research/link-check.json    HTTP verification results, not a claim-accuracy audit
scripts/validate.ts         Data and source validation
scripts/check-links.mjs     Conservative link reachability checker
tests/*.test.ts             Behavioral, localization, evidence and scenario tests
```

## Source policy

Research reviewed: **October 21–22, 2026**. Individual records keep their actual review date. University admissions pages and official catalogs are primary; institutional profiles/Common Data Sets support cohort statistics. College Board, Common App, Ontario education and U.S. government pages support general guidance. Publisher pages establish book titles/editions. The ranking table uses the historical **2026 U.S. News National Universities** edition, not the latest 2027 edition. Institutional releases are preferred; dated secondary reports are identified where used. Rankings and admission aggregators are not used to establish requirements.

Each consequential university fact has text, a status, and source IDs. Sources retain exact URL, title, publisher, date reviewed and cycle. An unknown has an explicit status, rather than a fabricated number. “Not verified” means this research did not establish the value; it is not a claim that the university does not publish it. A current page that lacks an entry year is not relabeled as a Fall 2028 commitment.

Where a page was accessible to the research browser but blocks a later HTTP check, keep the distinction. The link report records status/redirects and cannot prove that a claim is correct. It does not bypass authentication or bot protection.

## Recommendations and limitations

The categories are manually authored, conservative **exploration scenarios**, not a calibrated admissions model. No Ontario percentage is converted to a U.S. GPA. Grade bands are inputs, not university cutoffs. Full academic history, rigor, course prerequisites, essays/activities, school context, language evidence, citizenship, program and campus may change the outcome.

“More Realistic” is only displayed after the user reports course eligibility checks and strong preparation; it is still not a safety. Specialized interests and an unreviewed U.S.-citizen/permanent-resident route cannot inherit broad international-program Target labels. SAT comparisons help preparation/submission decisions and never automatically improve a category. Verified acceptance rates are descriptive cohort data, not personal odds.

The six-pick selection first preserves available planning categories, then uses editorial brand/strategy ordering. There may be fewer than six: 60–70% receives no supported direct-entry shortlist in this dataset; 70–75% receives limited Reach exploration leads. Low-band users can inspect a separate transfer strategy. The comparison matrix still displays all 20 schools and conditionally identifies Iowa State’s current international SAT 1200 GPA-component alternative; other requirements and Fall 2028 applicability need confirmation. NYU always remains a reach. “Brand Recognition” is an editorial comparison, not a measured Korean recognition survey or an admissions statistic. No representative Korean recognition ranking was established. Focused majors are researched individually and each school links to its full official program directory; this is not an exhaustive research record for every major. No lowest Ontario admission cutoff is invented. ASU BA/BS rules and Purdue/Minnesota college-specific distributions are identified separately.

Important open items:

- Fall 2028 deadlines and most entry-year testing commitments are not yet confirmed. Minnesota’s published optional-testing period includes Fall 2028; Alabama explicitly requires SAT/ACT for Fall 2028.
- 2027–28 SAT dates are **anticipated**, including the updated October 9, 2027 date. Registration/release dates remain unpublished. 2028 AP dates remain unpublished in the reviewed schedule.
- Several Ontario course-equivalency rules, English waivers, CSS Profile/need-aid details and program-specific rules need direct confirmation.
- ASU current international and general deadline pages show different cycles; Oregon insurance amounts conflict across official pages.
- NYU New York testing scope needs confirmation; the current NYU Abu Dhabi page is not silently generalized to NYC.
- Costs retain their year, campus, scope and exclusions. IU's retrieved international estimate has no labeled year; Penn State's projection is tuition, not a full international budget.
- ASU’s verified acceptance statistic covers Campus Immersion, not Tempe alone. SAT distributions identify admitted versus enrolled cohorts and score-submitter scope.
- Citizenship is unknown by default. Ontario attendance does not establish Canadian citizenship, U.S. aid eligibility or visa requirements.

## Updating research

1. Open the exact official source. Identify entry year, applicant category, campus and program before editing any value.
2. Update the corresponding JSON fact, source IDs, status and source cycle. Record the actual review date; do not bulk-renew dates without reviewing the underlying sources. For incremental updates, preserve prior review dates and extend the allowed review window in `scripts/validate.ts` and the UI snapshot label appropriately.
3. Preserve unknowns/conflicts until resolved. Record statistics with cohort, counts/denominator where applicable, and score-submitter/admitted/enrolled scope. Never infer Ontario equivalencies.
4. Review affected strategies in `src/data/strategies.ts`, score ranges and timeline entries. Keep task IDs stable for browser checklist continuity, or deliberately version the storage key if semantics change.
5. Update the corresponding Korean text in `src/locales/` when changing English content. The English research remains canonical; preserve the same uncertainties, dates and exclusions in Korean. Run validate, typecheck, lint, tests and build. Check changed source links, and inspect desktop/tablet/mobile, keyboard navigation and the detail dialog.
6. Update this README and the research coverage notes. Review the actual 2027–28 application cycle before using this snapshot to submit applications.

## Repository and deployment

The only project repository is **https://github.com/ivyparc/UniNavo**. Work is prepared on `codex/us-college-planner`; main history is preserved. CI runs validation, typecheck, lint, tests and build.

The production `dist/` output is static. `pnpm build:pages` builds with the `/UniNavo/` asset base for GitHub Pages. Hash-based routes need no server-side fallback beyond `index.html`.

GitHub Pages publication uses a separate `codex/site` branch in this same repository containing only the built static output and `.nojekyll`. Source development remains on `codex/us-college-planner`. Updating the deployed build requires rebuilding and publishing that artifact branch; source changes do not silently redeploy the site.

### Republishing the existing Pages branch

After reviewing and committing source/data updates, run `pnpm build:pages`. Publish the resulting `dist/` files to the root of the existing `codex/site` branch, retaining `.nojekyll`, with a normal new commit and fast-forward push to **ivyparc/UniNavo**. Use a separate working tree for that branch so generated files cannot replace the source checkout. Never force-push or change repository identity. Check the repository's Pages deployment result and open the live URL before claiming the update is published. No Pages settings change is needed for subsequent artifact updates.

### Verification record

- Local validation, typecheck, lint, 27 behavioral tests and Pages production build passed for 20 schools, 309 source records, 23 months and 72 original tasks.
- New tests cover all 40 grade/SAT scenarios, CSV generation (800 rows), score boundaries, conditional international rules, source references, score-band boundary crossings, all-school classification, and personal-plan editing/moving/deleting/serialization.
- Browser checks cover adding/editing/moving/deleting tasks, completed-item hiding, undo and reload persistence; grade changes and the 20-school comparison; and university details with program distributions and catalog links.
- Mobile 390px inspection shows no document-level horizontal overflow; the comparison table scrolls inside its container. Download content is tested directly; browser download completion was not verified because the automation download wait timed out.

![Desktop preview](docs/preview.jpg)

The SAT band table uses official composite percentiles, not Safety/Match/Reach admission guarantees. Newly inspected 2025–26 CDS data add Penn State University Park (1280–1410), Ohio State Columbus (1300–1440), Wisconsin Madison (1400–1490) and Iowa State (1153–1360), all Fall 2025 enrolled SAT submitters. ASU composite fields are blank; Oregon/NYU primary report access could not be verified, and Buffalo composite percentiles remain unverified. See `research/sat-band-method.md` for grouping and source limitations.
