import type { CurriculumGroup, ProgramCurriculum } from "~/types/curriculum";
import type { YearLevel } from "~/types/subject";
import { YEAR_LEVEL_LABELS } from "~/types/subject";

function safe(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSemesterTable(group: CurriculumGroup, semesterLabel: (n: number) => string): string {
  const rows = group.subjects
    .map(
      (subject) => `
        <tr>
          <td>${safe(subject.code)}</td>
          <td>${safe(subject.title)}</td>
          <td>${subject.units}</td>
          <td>${
            subject.prerequisites.length > 0 ? safe(subject.prerequisites.join(", ")) : "-"
          }</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section class="cp-semester">
      <h4>${safe(semesterLabel(group.semester)).toUpperCase()}</h4>
      <table>
        <thead>
          <tr><th>SUBJECT CODE</th><th>DESCRIPTIVE TITLE</th><th>UNITS</th><th>PRE-REQUISITE</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="4">No subjects assigned.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="2"></td><td>${group.totalUnits || ""}</td><td></td></tr></tfoot>
      </table>
    </section>
  `;
}

function renderYearBlock(yearLevel: YearLevel, groups: CurriculumGroup[], semesterLabel: (n: number) => string): string {
  return `
    <section class="cp-year">
      <h3>${safe(YEAR_LEVEL_LABELS[yearLevel]).toUpperCase()}</h3>
      <div class="cp-semester-grid">
        ${groups.map((group) => renderSemesterTable(group, semesterLabel)).join("")}
      </div>
    </section>
  `;
}

/**
 * Open the program curriculum as a printable document in a new tab — school
 * letterhead, year/semester checklist tables, and total units, mirroring the
 * legacy print layout. Runs in an isolated document so it never needs to hide
 * the app shell (sidebar/navbar) or touch global print CSS.
 */
export function openCurriculumPrint(curriculum: ProgramCurriculum, semesterLabel: (n: number) => string): boolean {
  // "noopener" would make window.open return null — this tab hosts only our markup.
  const win = window.open("", "_blank");
  if (!win) return false;

  const origin = window.location.origin;
  const yearLevels = [...new Set(curriculum.groups.map((g) => g.yearLevel))].sort() as YearLevel[];

  const yearBlocks = yearLevels
    .map((year) => renderYearBlock(year, curriculum.groups.filter((g) => g.yearLevel === year), semesterLabel))
    .join("");

  win.document.open();
  win.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Curriculum — ${safe(curriculum.programName)}</title>
  <style>
    *{box-sizing:border-box;margin:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;padding:0.4in}

    .cp-header{position:relative;min-height:0.72in;text-align:center;margin-bottom:0.35rem;line-height:1.12;padding:0 0.78in}
    .cp-header strong,.cp-header span,.cp-header small{display:block}
    .cp-header strong{font-size:15px}
    .cp-header span{font-size:10px}
    .cp-header small{margin-top:0.35rem;font-size:9px}
    .cp-header h2{margin:0.05rem 0 0;font-size:15px}
    .cp-header p{margin:0.05rem 0 0;font-size:10px}

    .cp-logo{position:absolute;top:0.03in;width:0.62in;height:0.62in;display:block;box-sizing:border-box;padding:0.03in;object-fit:contain;object-position:center}
    .cp-logo-left{left:0.03in}
    .cp-logo-right{right:0.03in}

    .cp-year{break-inside:avoid;margin-top:0.3rem}
    .cp-year h3{margin:0 0 0.08rem;text-align:center;font-size:13px}

    .cp-semester-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0.28rem}

    .cp-semester h4{margin:0;border:1px solid #444;padding:0.08rem 0.12rem;text-align:center;font-size:10px;border-bottom:none}
    .cp-semester table{width:100%;table-layout:fixed;border-collapse:collapse}
    .cp-semester th,.cp-semester td{border:1px solid #444;padding:0.08rem 0.12rem;color:#000;font-size:8px;line-height:1.08;vertical-align:middle}
    .cp-semester th{text-align:center}
    .cp-semester td:nth-child(1),.cp-semester th:nth-child(1){width:20%}
    .cp-semester td:nth-child(2),.cp-semester th:nth-child(2){width:52%}
    .cp-semester td:nth-child(3),.cp-semester th:nth-child(3){width:8%;text-align:center}
    .cp-semester td:nth-child(4),.cp-semester th:nth-child(4){width:20%;text-align:center}
    .cp-semester tfoot td{border-top:0;border-left-color:transparent;border-right-color:transparent;border-bottom-color:transparent;text-align:center}

    .cp-total{margin-top:0.25rem;font-size:9px}

    @media print{body{padding:0.35in}}
  </style>
</head>
<body>
  <header class="cp-header">
    <img class="cp-logo cp-logo-left" src="${origin}/images/logos/gwc-logo.avif" alt="GWC logo" />
    <img class="cp-logo cp-logo-right" src="${origin}/images/departments/${safe(curriculum.departmentCode.toLowerCase())}.avif" alt="${safe(curriculum.departmentCode)} logo" />
    <strong>GOLDEN WEST COLLEGES, INC.</strong>
    <span>San Jose Drive, Alaminos City, Pangasinan</span>
    <small>Curriculum for</small>
    <h2>${safe(curriculum.programName).toUpperCase()}</h2>
  </header>
  ${yearBlocks}
  <p class="cp-total">TOTAL UNITS: <strong>${curriculum.totalUnits}</strong></p>
  <script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)})</script>
</body>
</html>`);
  win.document.close();
  return true;
}
