import { getLanguage, localize } from "./i18n.ts";
import {
  EDITORS,
  coreAverage,
  gradeBand,
  removeAp,
  removeCourse,
  removeSat,
  saveAp,
  saveCourse,
  saveSat,
  satTotal,
  simpleAverage,
  suggestTag,
  bestSat,
  type ApPlan,
  type CourseGrade,
  type CourseTag,
  type EditorId,
  type GradesState,
} from "./grades.ts";

const w = (en: string, ko: string) => (getLanguage() === "ko" ? ko : en);
const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const todayIso = () => new Date().toLocaleDateString("en-CA");
const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(
    getLanguage() === "ko" ? "ko-KR" : "en-CA",
    { month: "short", day: "numeric", timeZone: "UTC" },
  );

const editorLabels: Record<EditorId, [string, string]> = {
  student: ["Taeyul", "태율"],
  mom: ["Mom", "엄마"],
  dad: ["Dad", "아빠"],
  teacher: ["Teacher", "선생님"],
};
const editorName = (id: EditorId) => w(...editorLabels[id]);
const tagLabels: Record<CourseTag, [string, string]> = {
  required: ["Required", "필수"],
  major: ["Major-related", "전공 관련"],
  science: ["Check science requirement", "과학 요건 확인"],
  other: ["Other", "기타"],
};
const apStatusLabels: Record<ApPlan["status"], [string, string]> = {
  considering: ["Considering", "검토 중"],
  "checking-school": ["Finding a test school", "응시 학교 확인 중"],
  registered: ["Registered", "신청 완료"],
  done: ["Exam taken", "응시 완료"],
};

export interface GradesUi {
  grade: number;
  notice: string;
  canUndo: boolean;
}

function courseTable(courses: CourseGrade[]) {
  if (!courses.length)
    return `<p class="empty-state grades-empty">${w("No courses for this grade yet. Add the first one.", "이 학년에 입력한 과목이 아직 없어요. 첫 과목을 추가하세요.")}</p>`;
  return `<div class="table-wrap"><table class="grades-table"><thead><tr><th>${w("Code", "코드")}</th><th>${w("Course", "과목")}</th><th class="num">${w("Midterm", "중간")}</th><th class="num">${w("Final", "최종")}</th><th>${w("Last entry", "마지막 입력")}</th><th><span class="sr-only">${w("Actions", "관리")}</span></th></tr></thead><tbody>${courses
    .map(
      (c) =>
        `<tr><td class="muted" data-original-language>${esc(c.code) || "—"}</td><td><span data-original-language>${esc(c.name)}</span> <span class="grade-tag tag-${c.tag}">${w(...tagLabels[c.tag])}</span></td><td class="num ${c.final === null ? "strong" : "muted"}">${c.midterm ?? "—"}</td><td class="num ${c.final === null ? "muted" : "strong"}">${c.final ?? "—"}</td><td class="small muted">${editorName(c.updatedBy)} · ${shortDate(c.updatedAt)}</td><td class="row-actions"><button class="text-button" data-edit-course="${c.id}">${w("Edit", "수정")}</button><button class="text-button" data-delete-course="${c.id}" aria-label="${esc(w(`Delete ${c.name}`, `${c.name} 삭제`))}">${w("Delete", "삭제")}</button></td></tr>`,
    )
    .join("")}</tbody></table></div>`;
}

function satSection(state: GradesState) {
  const best = bestSat(state.sat);
  const bars = state.sat.length
    ? state.sat
        .map((a) => {
          const total = satTotal(a);
          const pct = Math.max(((total - 400) / 1200) * 100, 2);
          return `<div class="sat-attempt"><div class="sat-attempt-head"><span>${shortDate(a.date)} · ${a.kind === "official" ? w("Official", "실전") : w("Practice", "모의")}</span><span class="small muted">${w("Reading & Writing", "읽기·쓰기")} ${a.readingWriting} · ${w("Math", "수학")} ${a.math}</span></div><div class="sat-attempt-bar"><span class="sat-track"><i class="${total === best ? "best" : ""}" style="width:${pct}%"></i></span><strong>${total}</strong><button class="text-button" data-delete-sat="${a.id}" aria-label="${esc(w(`Delete ${shortDate(a.date)} score`, `${shortDate(a.date)} 점수 삭제`))}">${w("Delete", "삭제")}</button></div></div>`;
        })
        .join("")
    : `<p class="muted">${w("No SAT scores yet.", "아직 입력한 SAT 점수가 없어요.")}</p>`;
  return `<section class="grades-card" aria-labelledby="sat-history-title"><div class="grades-card-head"><h2 id="sat-history-title">${w("SAT history", "SAT 기록")}</h2>${best !== null ? `<span class="small muted">${w("Best", "최고점")} <strong>${best}</strong></span>` : ""}</div><div class="sat-attempts">${bars}</div></section>
  <section class="grades-card" aria-labelledby="sat-add-title"><h2 id="sat-add-title">${w("Add an SAT score", "SAT 점수 추가")}</h2><form id="sat-form" class="grades-form"><label>${w("Date", "날짜")}<input type="date" name="date" required value="${todayIso()}"></label><fieldset class="kind-choice"><legend>${w("Type", "종류")}</legend><label><input type="radio" name="kind" value="practice" checked>${w("Practice", "모의")}</label><label><input type="radio" name="kind" value="official">${w("Official", "실전")}</label></fieldset><div class="grades-form-pair"><label>${w("Reading & Writing", "읽기·쓰기")}<input type="number" name="readingWriting" required min="200" max="800" step="10" inputmode="numeric" placeholder="200–800"></label><label>${w("Math", "수학")}<input type="number" name="math" required min="200" max="800" step="10" inputmode="numeric" placeholder="200–800"></label></div><button class="button" type="submit">${w("Save", "저장")}</button></form></section>`;
}

function apSection(state: GradesState) {
  return `<section class="grades-card" aria-labelledby="ap-plan-title"><h2 id="ap-plan-title">${w("AP plan", "AP 계획")}</h2>${
    state.ap.length
      ? `<div class="ap-plan-list">${state.ap
          .map(
            (p) =>
              `<article class="ap-plan"><div><strong data-original-language>${esc(p.course)}</strong><span class="small muted">${p.mode === "exam-only" ? w("Exam only", "시험만 응시") : w("Course and exam", "수업과 시험")}</span></div><label><span class="sr-only">${w("Status", "상태")}</span><select data-ap-status="${p.id}">${Object.entries(
                apStatusLabels,
              )
                .map(
                  ([value, label]) =>
                    `<option value="${value}" ${p.status === value ? "selected" : ""}>${w(...label)}</option>`,
                )
                .join(
                  "",
                )}</select></label><button class="text-button" data-delete-ap="${p.id}" aria-label="${esc(w(`Delete ${p.course}`, `${p.course} 삭제`))}">${w("Delete", "삭제")}</button></article>`,
          )
          .join("")}</div>`
      : `<p class="muted">${w("No AP subjects planned yet.", "아직 계획한 AP 과목이 없어요.")}</p>`
  }<form id="ap-form" class="ap-add"><label>${w("AP subject", "AP 과목")}<input name="course" required maxlength="80" placeholder="${w("e.g. AP Statistics", "예: AP Statistics")}"></label><label>${w("How", "방식")}<select name="mode"><option value="exam-only">${w("Exam only", "시험만 응시")}</option><option value="course">${w("Course and exam", "수업과 시험")}</option></select></label><button class="button" type="submit">${w("Add", "추가")}</button></form></section>`;
}

export const editorPicker = (editor: EditorId) =>
  `<label class="editor-pick">${w("Who is entering", "입력하는 사람")}<select id="editor-pick">${EDITORS.map((id) => `<option value="${id}" ${id === editor ? "selected" : ""}>${editorName(id)}</option>`).join("")}</select></label>`;

export function renderGradesPage(state: GradesState, ui: GradesUi) {
  const courses = state.courses.filter((c) => c.grade === ui.grade);
  const average = simpleAverage(courses),
    core = coreAverage(courses),
    band = gradeBand(average);
  const summary =
    average === null
      ? w("Add marks to see an average.", "점수를 입력하면 평균이 나와요.")
      : `${w("Simple average", "단순 평균")} <strong>${average}%</strong>${band ? ` · ${band} ${w("band", "구간")}` : ""}${core !== null ? ` · ${w("Required & major-related average", "필수·전공 관련 과목 평균")} <strong>${core}%</strong>` : ""}`;
  return `<div class="page-intro grades-intro"><h1 class="home-title">${w("Grades", "성적")}</h1></div>
  ${ui.notice ? `<div class="planner-notice" role="status">${esc(ui.notice)} ${ui.canUndo ? `<button id="undo-grades" class="text-button">${w("Undo", "실행 취소")}</button>` : ""}</div>` : ""}
  <section class="grades-card" aria-labelledby="school-marks-title"><div class="grades-card-head"><div><h2 id="school-marks-title">${w(`Ontario marks · Grade ${ui.grade}`, `온타리오 내신 · ${ui.grade}학년`)}</h2><p class="small muted">${summary}</p></div><div class="grades-card-actions"><div class="grade-switch" role="group" aria-label="${w("Grade", "학년")}">${[9, 10, 11, 12].map((g) => `<button data-grade-view="${g}" aria-pressed="${g === ui.grade}">${w(`Gr ${g}`, `${g}학년`)}</button>`).join("")}</div><button class="button" id="add-course">＋ ${w("Add course", "과목 추가")}</button></div></div>${courseTable(courses)}</section>
  <div class="grades-split">${satSection(state)}</div>
  ${apSection(state)}`;
}

export interface GradesContext {
  state: () => GradesState;
  editor: () => EditorId;
  ui: GradesUi;
  commit: (next: GradesState, notice: string, undoable?: boolean) => void;
  undo: () => void;
  rerender: () => void;
}

function openCourseEditor(ctx: GradesContext, id?: string) {
  const existing = ctx.state().courses.find((c) => c.id === id);
  const dialog = document.querySelector<HTMLDialogElement>("#task-dialog")!;
  const tagOptions = (selected: CourseTag) =>
    (Object.keys(tagLabels) as CourseTag[])
      .map(
        (t) =>
          `<option value="${t}" ${t === selected ? "selected" : ""}>${w(...tagLabels[t])}</option>`,
      )
      .join("");
  dialog.innerHTML = `<form id="course-form"><div class="dialog-header"><h2 id="task-dialog-title">${existing ? w("Edit course", "과목 수정") : w("Add a course", "과목 추가")}</h2><button type="button" class="close-dialog" aria-label="${w("Cancel", "취소")}">×</button></div><div class="task-form-fields"><div class="grades-form-pair"><label>${w("Course code", "과목 코드")}<input name="code" maxlength="12" placeholder="ENG3U" value="${esc(existing?.code ?? "")}"></label><label>${w("Grade", "학년")}<select name="grade">${[9, 10, 11, 12].map((g) => `<option value="${g}" ${g === (existing?.grade ?? ctx.ui.grade) ? "selected" : ""}>${w(`Grade ${g}`, `${g}학년`)}</option>`).join("")}</select></label></div><label>${w("Course name", "과목 이름")}<input name="name" required maxlength="80" value="${esc(existing?.name ?? "")}"></label><div class="grades-form-pair"><label>${w("Midterm", "중간")}<input type="number" name="midterm" min="0" max="100" step="0.1" inputmode="decimal" value="${existing?.midterm ?? ""}"></label><label>${w("Final", "최종")}<input type="number" name="final" min="0" max="100" step="0.1" inputmode="decimal" value="${existing?.final ?? ""}"></label></div><label>${w("Type", "분류")}<select name="tag">${tagOptions(existing?.tag ?? "other")}</select></label><div class="form-actions"><button type="button" id="cancel-course" class="text-button">${w("Cancel", "취소")}</button><button class="button" type="submit">${w("Save", "저장")}</button></div></div></form>`;
  const form = dialog.querySelector<HTMLFormElement>("form")!;
  const codeField = form.elements.namedItem("code") as HTMLInputElement;
  const tagField = form.elements.namedItem("tag") as HTMLSelectElement;
  let tagTouched = !!existing;
  tagField.addEventListener("change", () => (tagTouched = true));
  codeField.addEventListener("input", () => {
    if (!tagTouched) tagField.value = suggestTag(codeField.value);
  });
  dialog
    .querySelectorAll(".close-dialog, #cancel-course")
    .forEach((b) => b.addEventListener("click", () => dialog.close()));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const num = (key: string) =>
      data.get(key) === "" ? null : Number(data.get(key));
    const midterm = num("midterm"),
      final = num("final");
    const course: CourseGrade = {
      id: existing?.id ?? `course-${crypto.randomUUID()}`,
      code: String(data.get("code") ?? "")
        .trim()
        .toUpperCase(),
      name: String(data.get("name") ?? "").trim(),
      grade: Number(data.get("grade")),
      midterm,
      final,
      tag: String(data.get("tag")) as CourseTag,
      updatedBy: ctx.editor(),
      updatedAt: todayIso(),
    };
    ctx.ui.grade = course.grade;
    dialog.close();
    ctx.commit(
      saveCourse(ctx.state(), course),
      w("Course saved.", "과목을 저장했어요."),
    );
  });
  localize(dialog);
  dialog.showModal();
}

export function bindGradesPage(ctx: GradesContext) {
  document
    .querySelectorAll<HTMLButtonElement>("[data-grade-view]")
    .forEach((b) =>
      b.addEventListener("click", () => {
        ctx.ui.grade = Number(b.dataset.gradeView);
        ctx.rerender();
      }),
    );
  document
    .querySelector("#add-course")
    ?.addEventListener("click", () => openCourseEditor(ctx));
  document
    .querySelectorAll<HTMLButtonElement>("[data-edit-course]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        openCourseEditor(ctx, b.dataset.editCourse),
      ),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-delete-course]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        ctx.commit(
          removeCourse(ctx.state(), b.dataset.deleteCourse!),
          w("Course deleted.", "과목을 삭제했어요."),
          true,
        ),
      ),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-delete-sat]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        ctx.commit(
          removeSat(ctx.state(), b.dataset.deleteSat!),
          w("Score deleted.", "점수를 삭제했어요."),
          true,
        ),
      ),
    );
  document
    .querySelector<HTMLFormElement>("#sat-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      ctx.commit(
        saveSat(ctx.state(), {
          id: `sat-${crypto.randomUUID()}`,
          date: String(data.get("date")),
          kind: data.get("kind") === "official" ? "official" : "practice",
          readingWriting: Number(data.get("readingWriting")),
          math: Number(data.get("math")),
          updatedBy: ctx.editor(),
          updatedAt: todayIso(),
        }),
        w("SAT score saved.", "SAT 점수를 저장했어요."),
      );
    });
  document
    .querySelector<HTMLFormElement>("#ap-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget as HTMLFormElement;
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      ctx.commit(
        saveAp(ctx.state(), {
          id: `ap-${crypto.randomUUID()}`,
          course: String(data.get("course") ?? "").trim(),
          mode: data.get("mode") === "course" ? "course" : "exam-only",
          status: "considering",
          updatedBy: ctx.editor(),
          updatedAt: todayIso(),
        }),
        w("AP subject added.", "AP 과목을 추가했어요."),
      );
    });
  document
    .querySelectorAll<HTMLSelectElement>("[data-ap-status]")
    .forEach((s) =>
      s.addEventListener("change", () => {
        const plan = ctx.state().ap.find((p) => p.id === s.dataset.apStatus);
        if (!plan) return;
        ctx.commit(
          saveAp(ctx.state(), {
            ...plan,
            status: s.value as ApPlan["status"],
            updatedBy: ctx.editor(),
            updatedAt: todayIso(),
          }),
          w("AP status saved.", "AP 상태를 저장했어요."),
        );
      }),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-delete-ap]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        ctx.commit(
          removeAp(ctx.state(), b.dataset.deleteAp!),
          w("AP subject deleted.", "AP 과목을 삭제했어요."),
          true,
        ),
      ),
    );
  document.querySelector("#undo-grades")?.addEventListener("click", ctx.undo);
}
