# QS world ranking review — 2026-10-22

## Scope and sources

The current published edition is **QS World University Rankings 2027**, published in June 2026. This is a worldwide institutional ranking, not a US undergraduate ranking, humanities ranking, Korean name-recognition survey, or admission probability.

- [QS 2027 main results](https://www.topuniversities.com/qs-top-uni-wur): explicitly identifies the edition as 2027.
- [QS official US university table](https://www.topuniversities.com/where-to-study/north-america/united-states/ranked-top-100-us-universities): primary source for the numerical ranks saved in `src/data/qs-rankings.json`. Its leading entries were cross-checked against the explicitly dated 2027 results, including MIT, Stanford, Harvard, Penn, Cornell, Yale, Berkeley and Chicago.
- [QS US performance report, July 6, 2026](https://www.qs.com/insights/us-performance-in-the-qs-world-university-rankings-2027): confirms the 2027 edition is published. Its US-only ordinal list must not be mistaken for world rank.
- [Minnesota QS profile](https://www.topuniversities.com/universities/university-minnesota-system): QS ranks **University of Minnesota (System)** at joint 255, not a separately named Twin Cities institution. The stored `scope` preserves this qualification and must be displayed with this rank.

## Implementation rules

49 existing catalog institutions have an individually numbered, directly observed 2027 world rank. `tied: true` preserves QS's `=` prefix. A lower number is a better position. These numerical facts are stored without copying QS editorial descriptions.

Schools absent from this JSON have **no verified exact numeric rank in this subset**, not necessarily no QS listing. Several existing schools have banded ranks; these are intentionally omitted because the UI's numeric rank schema must not turn a band into a fictional exact rank. Examples independently observed on official QS profiles: Oklahoma 771–780, Temple 751–760, Nebraska–Lincoln 801–850. UC Merced's 2027 overall rank could not be verified; leave it unknown. Do not use another UC campus's rank.

The 49-school pool supports an editorial preference for internationally ranked, widely recognizable institutions. It does not establish a numerical Korean recognition ranking. A high SAT alone does not establish admission eligibility; preserve official testing policies, international applicant rules, transcript evaluation and existing source links. UC's current test-free policy and unconfirmed Fall 2028 policy require UC candidates to remain independent of SAT-column changes.

No Ontario-percent-to-GPA conversion or lowest-admitted humanities score was inferred from QS. QS profile admission widgets were not adopted as authoritative admissions cutoffs.
