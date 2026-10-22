import type { Month, Task } from "../types.ts";
const t = (
  title: string,
  detail: string,
  sourceIds: string[] = [],
  kind: Task["kind"] = "Planning task",
) => ({ title, detail, sourceIds, kind });
const rows: [string, string, string, string, ReturnType<typeof t>[]][] = [
  [
    "2026-10",
    "Grade 11 · Fall",
    "Build your starting point",
    "Start with your transcript, not a ranking.",
    [
      t(
        "Review your Grade 11 courses with guidance",
        "Audit marks, Grade 9–11 records, U/M prerequisites and your OSSD cohort. Keep original percentages.",
        ["ontario-ossd", "ontario-codes", "common-gpa"],
      ),
      t(
        "Take one timed SAT diagnostic",
        "Use Bluebook. Save section scores and an error log; do not rush to book a test before reviewing the result.",
        ["sat-practice"],
      ),
      t(
        "Find an AP coordinator now",
        "Ask whether your school or another host accepts exam-only students, and confirm its student deadline before the Nov 13 school order deadline.",
        ["ap-order", "ap-outside"],
      ),
      t(
        "Start an activities inventory",
        "Record responsibilities, hours, projects and meaningful impact; begin exploring university requirements.",
        ["common-guide"],
      ),
    ],
  ],
  [
    "2026-11",
    "Grade 11 · Fall",
    "Make a manageable plan",
    "Protect school marks while adding focused preparation.",
    [
      t(
        "Confirm your AP exam order",
        "Nov 13, 2026 is the school ordering deadline for full-year, fall and exam-only sections. Your host may close student registration earlier.",
        ["ap-order"],
        "Official date",
      ),
      t(
        "Build a weekly SAT routine",
        "Use diagnostic weaknesses to choose two or three short sessions per week; adjust to coursework.",
        ["sat-practice"],
      ),
      t(
        "Choose one meaningful activity to deepen",
        "Develop sustained responsibility or a project rather than collecting unrelated memberships.",
        ["common-guide"],
      ),
    ],
  ],
  [
    "2026-12",
    "Grade 11 · Fall",
    "Check your progress",
    "Finish the semester with evidence of improvement.",
    [
      t(
        "Review grades and missing prerequisites",
        "Ask teachers what needs improvement and plan Grade 12 U/M course options.",
        ["ontario-courses"],
      ),
      t(
        "Retake a practice test",
        "Compare skill areas, not just the total. Decide whether a spring SAT is useful for your emerging list.",
        ["sat-practice"],
      ),
      t(
        "Compare costs as a family",
        "Record citizenship, four-year budget and school-specific aid questions. Ontario residence alone does not establish aid eligibility.",
        ["federal-aid"],
      ),
    ],
  ],
  [
    "2027-01",
    "Grade 11 · Winter / Spring",
    "Build the academic plan",
    "Use the new semester to close gaps.",
    [
      t(
        "Plan Grade 12 U/M courses",
        "Check each university’s English, math, science, social studies and language expectations with your counselor.",
        ["ontario-courses"],
      ),
      t(
        "Choose a spring SAT date",
        "March 6 is a confirmed option; May 1 and June 5 are alternatives. Plan around coursework and AP.",
        ["sat-dates"],
      ),
      t(
        "Keep a running activities résumé",
        "Record examples of initiative, commitments and results while they are fresh.",
        ["common-guide"],
      ),
    ],
  ],
  [
    "2027-02",
    "Grade 11 · Winter / Spring",
    "Prepare for your first attempt",
    "A test date is useful only with a preparation plan.",
    [
      t(
        "Register by Feb 19 if taking the March SAT",
        "March 6, 2027 SAT regular registration closes Feb 19; late/change deadline Feb 23. Deadlines are 11:59 p.m. ET. Device borrowing needs 30 days.",
        ["sat-dates"],
        "Official date",
      ),
      t(
        "Check Grade 12 course requests",
        "Confirm prerequisites and the school’s local selection deadline; it varies by school.",
        ["ontario-courses"],
      ),
      t(
        "Discuss summer plans",
        "Choose work, volunteering, a project or an affordable learning opportunity aligned with your interests.",
        [],
      ),
    ],
  ],
  [
    "2027-03",
    "Grade 11 · Winter / Spring",
    "Test, reflect, adjust",
    "Treat the first score as useful information.",
    [
      t(
        "Take the SAT on March 6 if registered",
        "Review March 19 score release and the official report. Retake only with a focused reason.",
        ["sat-dates", "sat-release"],
        "Official date",
      ),
      t(
        "Check spring AP course orders by March 12",
        "This is the coordinator deadline for spring course orders and changes; local student deadlines may be earlier.",
        ["ap-order"],
        "Official date",
      ),
      t(
        "Build a broad first college list",
        "Compare admission structure, curriculum evaluation, English rules and affordability. Confirm that each campus offers your intended degree.",
        [],
      ),
    ],
  ],
  [
    "2027-04",
    "Grade 11 · Winter / Spring",
    "Turn research into a shortlist",
    "Start conversations before recommendation season.",
    [
      t(
        "Review AP practice and exam logistics",
        "Confirm the host’s reporting times and accommodations; use official subject practice.",
        ["ap-dates"],
      ),
      t(
        "Register by Apr 16 if taking the May SAT",
        "May 1 SAT can overlap with AP preparation. A June attempt may be more manageable.",
        ["sat-dates"],
        "Official date",
      ),
      t(
        "Build teacher relationships",
        "Discuss academic interests and future recommendation requirements, which differ by college.",
        ["common-guide"],
      ),
    ],
  ],
  [
    "2027-05",
    "Grade 11 · Winter / Spring",
    "Focus on school and exams",
    "Do fewer things well during a busy month.",
    [
      t(
        "Sit your registered AP exams",
        "Official regular window: May 3–7 and May 10–14, 2027. See subject-specific dates in SAT & AP.",
        ["ap-dates"],
        "Official date",
      ),
      t(
        "Register by May 21 if taking the June SAT",
        "June 5 SAT regular registration deadline is May 21; late/change deadline May 25.",
        ["sat-dates"],
        "Official date",
      ),
      t(
        "Ask potential recommenders early",
        "If your colleges need letters, ask teachers who know your work well. Confirm their availability for fall.",
        ["common-guide"],
      ),
    ],
  ],
  [
    "2027-06",
    "Grade 11 · Winter / Spring",
    "Close Grade 11 strongly",
    "Your academic record is the foundation.",
    [
      t(
        "Complete finals and collect updated records",
        "Retain the full transcript and confirm graduation/course plans with guidance.",
        ["ontario-ossd"],
      ),
      t(
        "Take the June 5 SAT if registered",
        "Scores are scheduled for June 21. Decide whether another attempt is worth the time.",
        ["sat-dates", "sat-release"],
        "Official date",
      ),
      t(
        "Select a working college list",
        "Use balanced planning categories, check English exemption evidence and identify requirements still needing confirmation.",
        [],
      ),
    ],
  ],
  [
    "2027-07",
    "Summer · Before Grade 12",
    "Make room for your story",
    "Start writing before the school-year rush.",
    [
      t(
        "Brainstorm and draft your personal statement",
        "Write from your own experiences. Use one thoughtful reviewer; preserve your voice.",
        ["common-guide", "essay-free"],
      ),
      t(
        "Finish an activities résumé",
        "Collect dates, time commitments and concise impact descriptions.",
        ["common-guide"],
      ),
      t(
        "Review family finances and aid forms",
        "Check citizenship-specific aid, CSS Profile participation and any proof-of-funds requirements per university.",
        ["federal-aid"],
      ),
      t(
        "Research or visit shortlisted campuses",
        "Compare academic fit and campus experience; a visit is optional, not assumed required.",
        [],
      ),
    ],
  ],
  [
    "2027-08",
    "Summer · Before Grade 12",
    "Prepare your applications",
    "Recheck every policy for the actual entry year.",
    [
      t(
        "Check the 2027–28 application launch",
        "Review rollover and live college questions. Do not assume last year’s essays, deadlines or testing rules still apply.",
        ["common-guide"],
      ),
      t(
        "Re-verify Fall 2028 college deadlines",
        "Record each university’s exact EA, ED, RD or rolling deadline and time zone from its official page.",
        [],
      ),
      t(
        "Confirm recommendation and transcript logistics",
        "Share your résumé and calendar with counselors and teachers; allow time for submissions.",
        ["common-guide"],
      ),
      t(
        "Confirm fall SAT dates before booking",
        "2027–28 dates were only anticipated at the October 2026 review; verify registration and score release before committing.",
        ["sat-dates"],
      ),
    ],
  ],
  [
    "2027-09",
    "Grade 12 · Fall",
    "Bring the application together",
    "Start early without committing blindly.",
    [
      t(
        "Check the final shortlist and entry-year policy",
        "Verify applicant category, campus, school, major, test reporting and English waiver rules for every choice.",
        [],
      ),
      t(
        "Complete core application sections",
        "Enter school records as instructed, proofread activities and send recommender invitations.",
        ["common-guide", "common-gpa"],
      ),
      t(
        "Decide whether an early plan fits",
        "ED is binding under its agreement. EA is nonbinding; restrictive plans have specific limits. Confirm affordability first.",
        ["early-plans"],
      ),
    ],
  ],
  [
    "2027-10",
    "Grade 12 · Fall",
    "Prepare early submissions",
    "Work backwards from verified deadlines.",
    [
      t(
        "Finish early application drafts",
        "Use each school’s Fall 2028 published deadline; dates shown from older cycles are reference only.",
        ["common-guide"],
      ),
      t(
        "Check letters, transcript and test delivery",
        "An application may be incomplete until required documents arrive; review each portal’s checklist.",
        ["common-guide"],
      ),
      t(
        "Complete required aid applications",
        "Use the correct award year and school-specific deadlines; CSS Profile and FAFSA eligibility are separate questions.",
        ["federal-aid"],
      ),
    ],
  ],
  [
    "2027-11",
    "Grade 12 · Fall",
    "Submit and verify",
    "Submission is a step, not the whole process.",
    [
      t(
        "Submit applicable early applications on time",
        "Follow verified 2028 deadlines and time zones. Review ED agreements and restrictions before submitting.",
        ["early-plans"],
      ),
      t(
        "Check applicant portals",
        "Resolve missing materials and verify receipt of English evidence, school reports and test scores.",
        ["common-guide"],
      ),
      t(
        "Continue Regular Decision essays",
        "Maintain a balanced list and keep Grade 12 marks strong.",
        ["common-guide"],
      ),
    ],
  ],
  [
    "2027-12",
    "Grade 12 · Fall",
    "Finish the remaining applications",
    "Leave time for school holiday closures.",
    [
      t(
        "Finalize Regular Decision materials",
        "Verify each live deadline. Ask guidance about documents before the holiday break.",
        ["common-guide"],
      ),
      t(
        "Respond to early outcomes carefully",
        "Read any ED obligation and deferral instructions. Do not assume deferral means an automatic RD review.",
        ["early-plans"],
      ),
      t(
        "Plan the mid-year report",
        "Confirm which colleges need it and when Ontario semester marks will be available.",
        ["common-guide"],
      ),
    ],
  ],
  [
    "2028-01",
    "Grade 12 · Winter / Spring",
    "Complete applications and reports",
    "Use your own school-specific deadline list.",
    [
      t(
        "Submit remaining Regular Decision applications",
        "January is a planning window, not a universal deadline. Check each official entry-year schedule.",
        [],
      ),
      t(
        "Request mid-year marks where required",
        "Have the counselor send the report using each university’s instructions.",
        ["common-guide"],
      ),
      t(
        "Verify aid and scholarship completion",
        "Check missing forms and separate merit deadlines; some occur before admission decisions.",
        ["federal-aid"],
      ),
    ],
  ],
  [
    "2028-02",
    "Grade 12 · Winter / Spring",
    "Keep every file complete",
    "Be responsive while keeping your grades steady.",
    [
      t(
        "Follow up on missing documents",
        "Review applicant portals and counselor submissions; check English test validity periods.",
        [],
      ),
      t(
        "Apply for remaining verified scholarships",
        "Use each university’s current international scholarship deadlines, not last cycle’s examples.",
        [],
      ),
      t(
        "Continue coursework and activities",
        "Offers may depend on successful completion and a final transcript.",
        ["common-guide"],
      ),
    ],
  ],
  [
    "2028-03",
    "Grade 12 · Winter / Spring",
    "Compare real offers",
    "Assess the full package, not just the name.",
    [
      t(
        "Track decisions and offer conditions",
        "Record campus, program, annual cost, aid renewal rules and deadlines in one place.",
        [],
      ),
      t(
        "Ask about outstanding aid decisions",
        "Confirm international eligibility and multi-year funding before accepting an offer.",
        ["federal-aid"],
      ),
      t(
        "Confirm any AP exam arrangements",
        "2028 AP dates were not published at this research snapshot. Check the current official schedule.",
        ["ap-dates"],
      ),
    ],
  ],
  [
    "2028-04",
    "Grade 12 · Winter / Spring",
    "Make an informed choice",
    "A sustainable four-year plan matters.",
    [
      t(
        "Compare total costs and conditions",
        "Include insurance, travel, currency exposure and annual aid renewal. Ask each school about unresolved figures.",
        [],
      ),
      t(
        "Confirm your actual enrollment deadline",
        "Do not assume May 1 applies to every campus, offer, ED agreement or international applicant.",
        [],
      ),
      t(
        "Prepare funding documents",
        "If you will need student status, ask the university what it needs to issue an I-20.",
        ["student-visa"],
      ),
    ],
  ],
  [
    "2028-05",
    "Grade 12 · Winter / Spring",
    "Choose and confirm",
    "Follow the deadline in your offer.",
    [
      t(
        "Accept an offer and pay the required deposit",
        "May 1 is a checkpoint to verify, not a guaranteed universal deadline. Follow the written offer.",
        [],
      ),
      t(
        "Complete registered AP exams",
        "Use the published 2028 schedule once available. Send scores according to the enrolling university’s credit policy.",
        ["ap-dates", "ap-scores"],
      ),
      t(
        "Start housing and health forms",
        "Check the admitted-student portal for housing, immunization and orientation deadlines.",
        [],
      ),
    ],
  ],
  [
    "2028-06",
    "Grade 12 · Winter / Spring",
    "Finish Ontario high school",
    "Close the academic loop.",
    [
      t(
        "Graduate and send final records",
        "Have your school send the final transcript and OSSD/graduation proof required by the university.",
        ["ontario-ossd", "common-guide"],
      ),
      t(
        "Request and check your I-20 if applicable",
        "Confirm name, program and funding details with the international office. U.S. citizens do not need F-1 status.",
        ["student-visa"],
      ),
      t(
        "Arrange citizenship-specific entry steps",
        "Canadian citizens generally do not need an F-1 stamp, but still need student-status documentation and initial SEVIS fee compliance. Other citizenships follow their own rules.",
        ["student-visa", "sevis-official"],
      ),
    ],
  ],
  [
    "2028-07",
    "Summer · Before university",
    "Get ready for the move",
    "Complete practical steps before booking everything.",
    [
      t(
        "Confirm immigration and travel documents",
        "Pay the required I-901 fee; complete any required visa process. Recheck government rules before travel.",
        ["student-visa", "sevis-official"],
      ),
      t(
        "Complete housing, health and insurance tasks",
        "Use the enrolling school’s deadlines and coverage requirements.",
        [],
      ),
      t(
        "Review tuition, AP credit and registration",
        "Confirm bill due dates, final AP credit, advising and orientation instructions.",
        ["ap-scores"],
      ),
    ],
  ],
  [
    "2028-08",
    "Summer · Before university",
    "Begin your next chapter",
    "Arrive prepared, with documents in hand.",
    [
      t(
        "Confirm permitted entry timing",
        "Follow the I-20 start date and official entry rules; contact the international office before booking travel.",
        ["student-visa"],
      ),
      t(
        "Attend orientation and finalize courses",
        "Meet your advisor and confirm all academic conditions and required check-ins are satisfied.",
        [],
      ),
      t(
        "Keep important documents accessible",
        "Carry the documents appropriate to your citizenship/status and save school contacts.",
        ["student-visa"],
      ),
    ],
  ],
];
export const timeline: Month[] = rows.map(
  ([id, phase, title, focus, tasks]) => ({
    id,
    phase,
    title,
    focus,
    priority: [
      "2026-10",
      "2026-11",
      "2027-07",
      "2027-08",
      "2027-09",
      "2027-10",
      "2027-11",
      "2027-12",
      "2028-01",
      "2028-05",
      "2028-08",
    ].includes(id)
      ? "High"
      : "Steady",
    tasks: tasks.map((task, i) => ({ ...task, id: `${id}-${i}` })),
  }),
);
