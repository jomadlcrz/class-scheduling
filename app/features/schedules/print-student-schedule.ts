import { DAYS, DAY_LABELS, formatTime, type Attestation, type Day, type Schedule } from "~/types/schedule";

function safe(value: string | number | null | undefined): string {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDayGroup(day: Day, slots: Schedule[], showSet: boolean): string {
  const setHeading = showSet ? "<th>SET</th>" : "";
  const rows = slots
    .map(
      (schedule) => `
        <tr>
          <td>${safe(formatTime(schedule.startTime))} – ${safe(formatTime(schedule.endTime))}</td>
          <td>${safe(schedule.subjectCode)}</td>
          <td>${safe(schedule.subjectTitle)}</td>
          ${showSet ? `<td>${safe(schedule.setCode)}</td>` : ""}
          <td>${safe(schedule.mode)}</td>
          <td>${safe(schedule.facultyName || "TBA")}</td>
          <td>${safe(schedule.roomName || "TBA")}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section class="sp-day">
      <h4>${safe(DAY_LABELS[day]).toUpperCase()}</h4>
      <table class="${showSet ? "sp-with-set" : ""}">
        <thead>
          <tr><th>TIME</th><th>SUBJECT CODE</th><th>DESCRIPTIVE TITLE</th>${setHeading}<th>MODE</th><th>INSTRUCTOR</th><th>ROOM</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

/** Opens the student's approved schedule as the original day-grouped print document. */
export function openStudentSchedulePrint(
  schedules: Schedule[],
  context: {
    schoolYear: string;
    semesterLabel: string;
    studentName: string;
    academicStatus?: string;
    programName?: string;
    attestations?: Attestation[];
  },
): boolean {
  if (schedules.length === 0) return false;

  const origin = window.location.origin;
  const first = schedules[0];
  const departmentCode = first.departmentCode;
  const isRegular = context.academicStatus === "Regular";
  const showSet = !isRegular;

  const attestation = context.attestations?.find((a) => a.setCode === first.setCode);
  const preparedName = attestation?.preparedBy.name ?? "";
  const preparedPosition = attestation?.preparedBy.position ?? "";
  const approvedName = attestation?.approvedBy.name ?? "";
  const approvedPosition = attestation?.approvedBy.departmentAbbrev
    ? `${attestation.approvedBy.position}, ${attestation.approvedBy.departmentAbbrev} Department`
    : attestation?.approvedBy.position ?? "";

  const dayBlocks = DAYS.map((day) => ({
    day,
    slots: schedules
      .filter((schedule) => schedule.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }))
    .filter(({ slots }) => slots.length > 0)
    .map(({ day, slots }) => renderDayGroup(day, slots, showSet))
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Class Schedule — ${safe(context.studentName)}</title>
  <link rel="icon" href="${origin}/favicon.ico" />
  <style>
    *{box-sizing:border-box;margin:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;padding:0.4in}

    .sp-header{position:relative;min-height:0.72in;text-align:center;margin-bottom:0.35rem;line-height:1.12;padding:0 0.78in}
    .sp-header strong,.sp-header span,.sp-header small{display:block}
    .sp-header strong{font-size:15px}
    .sp-header span{font-size:10px}
    .sp-header small{margin-top:0.35rem;font-size:9px}
    .sp-header p{margin:0.05rem 0 0;font-size:10px}

    .sp-logo{position:absolute;top:0.03in;width:0.62in;height:0.62in;display:block;padding:0.03in;object-fit:contain;object-position:center}
    .sp-logo-left{left:0.03in}
    .sp-logo-right{right:0.03in}

    .sp-meta{display:grid;grid-template-columns:1fr 1fr;gap:0.08in 0.35in;margin:0.18in 0 0.05in;padding:0.1in 0.12in;font-size:9px}
    .sp-meta p{line-height:1.45}
    .sp-meta b{display:inline-block;min-width:1.05in}

    .sp-day{break-inside:avoid;margin-top:2rem}
    .sp-day h4{border:1px solid #444;padding:0.12rem 0.2rem;text-align:center;font-size:11px;border-bottom:none}
    .sp-day table{width:100%;table-layout:fixed;border-collapse:collapse}
    .sp-day th,.sp-day td{border:1px solid #444;padding:0.12rem 0.2rem;color:#000;font-size:9px;line-height:1.2;vertical-align:middle}
    .sp-day th{text-align:center}
    .sp-day td:nth-child(1),.sp-day th:nth-child(1){width:16%;text-align:center;white-space:nowrap}
    .sp-day td:nth-child(2),.sp-day th:nth-child(2){width:13%;text-align:center}
    .sp-day td:nth-child(3),.sp-day th:nth-child(3){width:31%}
    .sp-day td:nth-child(4),.sp-day th:nth-child(4){width:10%;text-align:center}
    .sp-day td:nth-child(5),.sp-day th:nth-child(5){width:18%}
    .sp-day td:nth-child(6),.sp-day th:nth-child(6){width:12%;text-align:center}

    .sp-with-set td:nth-child(1),.sp-with-set th:nth-child(1){width:14%;text-align:center;white-space:nowrap}
    .sp-with-set td:nth-child(2),.sp-with-set th:nth-child(2){width:11%;text-align:center}
    .sp-with-set td:nth-child(3),.sp-with-set th:nth-child(3){width:24%}
    .sp-with-set td:nth-child(4),.sp-with-set th:nth-child(4){width:12%;text-align:center}
    .sp-with-set td:nth-child(5),.sp-with-set th:nth-child(5){width:9%;text-align:center}
    .sp-with-set td:nth-child(6),.sp-with-set th:nth-child(6){width:17%}
    .sp-with-set td:nth-child(7),.sp-with-set th:nth-child(7){width:13%;text-align:center}

    .sp-signatures{display:flex;justify-content:space-between;margin-top:1.5rem;gap:1rem}
    .sp-signatures div{flex:1}
    .sp-signatures .sig-label{font-weight:bold;font-size:11px}
    .sp-signatures .sig-name{font-size:11px;margin-top:0.15rem}
    .sp-signatures .sig-role{font-size:9px;color:#555;margin-top:0.15rem}

    @media print{body{padding:0.35in}}
    @media print and (orientation:landscape){
      body{zoom:0.82}
      .sp-day{margin-top:0.9rem}
      .sp-signatures{break-inside:avoid;page-break-inside:avoid}
    }
  </style>
</head>
<body>
  <header class="sp-header">
    <img class="sp-logo sp-logo-left" src="${origin}/images/logos/gwc-logo.avif" alt="GWC logo" />
    <img class="sp-logo sp-logo-right" src="${origin}/images/departments/${safe(departmentCode.toLowerCase())}.avif" alt="${safe(departmentCode)} logo" onerror="if(this.src!=='${origin}/images/departments/no-logo.avif')this.src='${origin}/images/departments/no-logo.avif'" />
    <strong>GOLDEN WEST COLLEGES, INC.</strong>
    <span>San Jose Drive, Alaminos City, Pangasinan</span>
    <small>Class Schedule</small>
    <p>S.Y. ${safe(context.schoolYear)}, ${safe(context.semesterLabel)}</p>
  </header>
  <section class="sp-meta">
    <p><b>Name of Student:</b> ${safe(context.studentName)}</p>
    <p><b>Program:</b> ${safe(context.programName || first.program)}</p>
    ${isRegular ? `<p><b>Year Level and Section:</b> ${safe(first.setCode)}</p>` : ""}
    <p><b>Status:</b> ${safe(context.academicStatus || "—")}</p>
  </section>
  ${dayBlocks}
  <footer class="sp-signatures">
    <div>
      <p class="sig-label">Prepared by:</p>
      <p class="sig-name">${safe(preparedName)}</p>
      <p class="sig-role">${safe(preparedPosition)}</p>
    </div>
    <div>
      <p class="sig-label">Approved by:</p>
      <p class="sig-name">${safe(approvedName)}</p>
      <p class="sig-role">${safe(approvedPosition)}</p>
    </div>
  </footer>
  <script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)})</script>
</body>
</html>`;

  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return true;
}
