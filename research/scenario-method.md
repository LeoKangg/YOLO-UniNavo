# Retained strict component engine (not the live candidate view)

Reviewed 22 October 2026. The user requested a larger pool with ten universities for each grade/SAT combination, then explicitly chose **only officially confirmed criteria; show a shortage when fewer than ten can be supported**. The current candidate explorer is documented in candidate-method.md; this file records the retained strict engine and its original evidence rules.

## Research scope

The pool contains 63 unique universities: the original 20 extended records plus 43 new admissions/program records. New records cover accessible, broad-entry and selective institutions; they are not all assigned personal-fit labels. New policy, program and score facts use university primary sources. Original dated ranking reports retain their secondary-source labels. Individual source records preserve exact URLs, actual review dates, applicable years and limitations. Missing values remain unknown. The catalog is extensible and has no 20-school cap.

The new files are scenario-access.json, scenario-mid.json, scenario-selective.json, scenario-root.json and scenario-ontario.json. scenario-existing-rules.json audits possible new quantitative rules for the original schools. Campus, applicant category and program scope are part of each record.

## Input meaning

Eight Ontario bands cover60–100%, with the lower endpoint included and upper endpoint excluded except100. Five SAT scenarios1100/1200/1300/1400/1500 produce40 combinations. A single selected scenario may additionally use1600 or a saved valid SAT total. Valid total and section scores move in steps of10. Contradictory supplied SAT totals/sections block all matching, including alternatives without section minima.

The averaging basis is an independent input: cumulative academic subjects, core subjects, overall secondary-school average, Grade12top-six U/M, or a calculation directly confirmed with the university. These are not interchangeable. Default is unknown. Each percentage rule also requires its own university-specific calculation confirmation, unchecked by default. A generic core average cannot confirm both Iowa and Missouri. Confirming a school means the scenario average is conditionally calculated using that school’s own published method; it does not reuse an actual top-six mark. Each matrix cell retains those explicit hypothetical calculation assumptions. James Madison’s unspecified formula requires direct university confirmation. A precise average must lie inside the selected band. The route defaults to an explicitly labeled hypothetical international first-year scenario; selecting U.S.citizen/permanent-resident prevents international rules from being reused as domestic eligibility.

## What qualifies for the strict list

A record needs a resolvable, applicable current testing rule and at least one of:

1. An explicit Ontario percentage rule, compared using its published calculation basis.
2. A university-published international100-point-scale rule, compared using that same core-course basis; no Ontario-to-U.S.GPA conversion is performed.
3. An explicit, applicable international SAT alternative that replaces the GPA component, including any section minima.

Every other record is excluded from the strict list with a reason. Conflicting sources cannot create a confirmed alternative. A historical SAT middle50% distribution, university rank, major-declaration condition or manually authored grade band cannot establish eligibility. A top-six average cannot silently satisfy a cumulative or core-subject rule.

Each result is labeled as a **published academic/test component comparison**, not complete admission eligibility, acceptance, a personal probability or a Fall2028 commitment. Courses, English, final credentials, program rules, documents and finances remain separate. The user has not supplied a complete transcript or evidence of every remaining condition.

Relevant verified distinctions include:

- Northern Iowa:75 cumulative academic-subject average for its Canada/OSSD route.
- Iowa:70 across core academic subjects for Ontario, distinct from Iowa State.
- Portland State: strictly **greater than70**, not at least70. The70–75band straddles that rule; an exact average is required unless the entire band is above it.
- James Madison: Ontario minimum70, but the reviewed page does not specify its averaging window or course selection. Automatic comparison uses the separate school-confirmed-basis input, not an invented top-six calculation.
- Missouri: official international100-point average80 across required core coursework. The university decides which coursework counts; this is not a self-generated GPA conversion.
- Iowa State: SAT1200+ can replace only its international GPA component; other requirements remain.
- Wichita State: SAT1060+ and both sections490+ for its international alternative. Unknown section scores are not assumed. The mathematical SAT section maximum800 means a total1290+ necessarily gives each section at least490; this is a derived lower bound, not a new university cutoff. At lower totals, actual sections or a total plus one section are needed.
- South Dakota: incompatible wording across reviewed international/general pages remains flagged, and the apparent SAT1070 alternative is excluded from automatic matching. Missouri Southern's older SAT1060 alternative is not imported when its current page omits it.

## Ranking and shortages

At most ten matching records are displayed. Matching records with a verified2026U.S.NewsNationalUniversities rank are sorted by that rank; unverified ranks follow alphabetically. Different ranking categories and editions are not mixed. This ranks only matching records within the researched pool; it does not prove these are the best ten attainable universities in the U.S. A representative Korean recognition ranking was not verified.

The count short of ten is explicit. Unmatched institutions are not used to fill places. An audit lists why each other researched school was not included. An empty list is not a rejection decision. All researched institutions remain searchable in the catalog, including selective schools whose Ontario equivalencies are unknown.

## Programs and future policy

Program names and entry structure are source-linked. General entry, later major declaration, and special auditions/portfolios are distinguished. No record in this audit establishes a unique easiest-admission major, so none is marketed as one. For example, UMD and UF explain that choosing a different intended major does not improve university admission in the ways reviewed; ASU publishes a genuine BA/BS requirement distinction, which is retained with scope.

Current/recent-cycle policy is not relabeled as a Fall2028 promise. Examples of explicit2028 testing statements remain school-specific. The original editorial six-pick model is no longer used in the live university explorer; legacy modules/tests remain for earlier data and storage compatibility.

## Verification

Behavior tests cover all40cases, evidence references, unknown exclusions, source conflicts, citizenship scope, strict inequalities, calculation-basis mismatches, section-score inference, count shortages, CSV content (including exact matched calculation basis and remaining GPA-alternative conditions) and local-input normalization. Browser QA checks filtering,40-case navigation, sources, saved schools, both languages and mobile overflow. A network-success code alone does not prove claim accuracy; the recorded source-reading audit is separate from link reachability.
