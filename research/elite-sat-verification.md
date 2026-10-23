# Elite university SAT profile verification — 2026-10-22

`elite-sat-profiles.json` contains 12 verified composite middle-50% records. These are descriptive distributions, not minimum requirements or personal admission probabilities. Section percentiles were never added to fabricate a composite distribution.

- Stanford: official IR CDS index links the Google Drive PDF. Downloaded the linked original; PDF pages 15–16 (printed 13–14) explicitly identify Fall 2025 enrolled first-year score submitters and composite 1520/1550/1570. SAT submission: 55.57%, 1,022. Original remains `/tmp/stanford-cds.pdf` during this task.
- MIT: official HTML CDS 2025–26 C9 explicitly reports Fall 2025 enrolled submitters, composite 1520/1550/1570.
- Princeton: official CDS 2025–26 PDF pp.10–11 C9, Fall 2025 enrolled submitters, composite 1490/1530/1560.
- Yale: official CDS index now links the June 16, 2026 revision, not the obsolete April file. PDF p.13 C9 reports 1480/1540/1560 for Fall 2025 enrolled submitters.
- Columbia: College and Engineering combined CDS, NOT General Studies. PDF p.15 reports Fall 2025 enrolled submitters, composite 1510/1540/1560.
- Cornell: official September 2026 PDF p.19 C9 is a fillable form. Text extraction omits values; verified the original PDF AcroForm fields `SAT1_COMP_25TH_P=1490` and `SAT1_COMP_75TH_P=1550`. C9 identifies Fall 2025 enrolled submitters.
- Dartmouth: official CDS 2025–26 p.9 C9, Fall 2025 enrolled submitters, composite 1440/1520/1550.
- Northwestern: official CDS 2025–26 pp.20–21 C9, Fall 2025 enrolled submitters, composite 1520/1540/1560.
- Vanderbilt: official current CDS index links July 2026 workbook. Read workbook with openpyxl; `CDS-C` C9 and answer-sheet fields explicitly report composite 1510/1530/1560. The cohort is Fall 2025 enrolled submitters.
- Brown: use the NEWER official admissions profile updated September 2026, Class of 2030, ADMITTED SAT submitters, composite 1470–1550. The earlier Class of 2029 newsletter reported 1480–1560; it is not the current chosen record. Do not relabel the current Brown statistic as enrolled or Fall 2025.
- Duke: official June 22, 2026 published-version CDS PDF p.11 C9 reports Fall 2025 enrolled submitters, composite 1510/1550/1570; 48%, 843 submitted SAT.
- UChicago: official university-hosted CDN 2025–26 PDF pp.10–11 C9 explicitly says Fall 2025 enrolled submitters and composite 1500/1540/1560. Some page headers retain 2024–2025 from the template; the document title and C9 cohort are 2025–26 / Fall 2025. 57%, 1,011 submitted SAT.

## Verified section-only record

Penn's official IR index links `https://upenn.box.com/s/woo7d85yxpol6j9e2o121aucjc6dc1k5`. Downloaded original via Box static link; PDF pp.10–11 (dated June 23, 2026) C9 identifies Fall 2025 enrolled submitters. Reading/Writing is 740–770 and Math 770–800. No composite percentile row is reported. `elite-sat-sections.json` preserves these two independent ranges. Do not report 1510–1570 by adding endpoints.

## Source handling

Secondary CDS directories were used only to locate Duke/UChicago original URLs after university landing-page failures. All incorporated numerical records were checked in university originals. Google Drive Stanford file was followed from Stanford's own IR index. Penn file was followed from Penn's own IR index. No Reddit or blog numerical claims were substituted for missing official statistics.
