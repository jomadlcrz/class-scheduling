import { DAYS, formatTime, type Attestation, type Day, type Schedule } from "~/types/schedule";

function safe(value: string | number | null | undefined): string {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDayBody(day: Day, slots: Schedule[], dayLabels: Record<Day, string>): string {
  const rows = slots
    .map(
      (s) => `
        <tr>
          <td>${formatTime(s.startTime)} – ${formatTime(s.endTime)}</td>
          <td>${safe(s.subjectCode)}</td>
          <td>${safe(s.subjectTitle)}</td>
          <td>${safe(s.setCode)}</td>
          <td>${safe(s.mode)}</td>
          <td>${safe(s.roomName)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <tbody class="sp-day">
      <tr class="sp-day-head"><td colspan="6">${safe(dayLabels[day] ?? "").toUpperCase()}</td></tr>
      ${rows}
    </tbody>
  `;
}

export function openInstructorSchedulePrint(
  schedules: Schedule[],
  context: {
    schoolYear: string;
    semesterLabel: string;
    instructorName: string;
    semesterNumber?: number;
    attestations?: Attestation[];
    dayLabels: Record<Day, string>;
  },
): boolean {
  if (schedules.length === 0) return false;

  const origin = window.location.origin;
  const { departmentCode } = schedules[0];

  const dayBodies = DAYS.map((day) => ({
    day,
    slots: schedules
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }))
    .filter((g) => g.slots.length > 0)
    .map(({ day, slots }) => renderDayBody(day, slots, context.dayLabels))
    .join("");

  const setCodes = new Set(schedules.map((s) => s.setCode));
  const matchesTerm = (a: Attestation) =>
    a.schoolYear === context.schoolYear &&
    (context.semesterNumber == null || a.semesterNumber === context.semesterNumber);
  const attestation =
    context.attestations?.find((a) => a.setCode === schedules[0].setCode && matchesTerm(a)) ??
    context.attestations?.find((a) => setCodes.has(a.setCode) && matchesTerm(a));
  const preparedName = attestation?.preparedBy.name ?? "";
  const preparedPosition = attestation?.preparedBy.position ?? "";
  const approvedName = attestation?.approvedBy.name ?? "";
  const approvedPosition = attestation?.approvedBy.departmentAbbrev
    ? `${attestation.approvedBy.position}, ${attestation.approvedBy.departmentAbbrev} Department`
    : attestation?.approvedBy.position ?? "";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Instructor Schedule — ${safe(context.instructorName)}</title>
  <link rel="icon" href="${origin}/favicon.ico" />
  <style>
    *{box-sizing:border-box;margin:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;padding:0.4in}

    .sp-header{position:relative;min-height:0.72in;text-align:center;margin-bottom:0.35rem;line-height:1.12;padding:0 0.78in}
    .sp-header strong,.sp-header span,.sp-header small{display:block}
    .sp-header strong{font-size:15px}
    .sp-header span{font-size:10px}
    .sp-header small{margin-top:0.35rem;font-size:9px}
    .sp-header h2{margin:0.05rem 0 0;font-size:15px}
    .sp-header p{margin:0.05rem 0 0;font-size:10px}

    .sp-logo{position:absolute;top:0.03in;width:0.62in;height:0.62in;display:block;box-sizing:border-box;padding:0.03in;object-fit:contain;object-position:center}
    .sp-logo-left{left:0.03in}
    .sp-logo-right{right:0.03in}

    .sp-table{width:100%;table-layout:fixed;border-collapse:collapse}
    .sp-table th,.sp-table td{border:1px solid #444;padding:0.12rem 0.2rem;color:#000;font-size:9px;line-height:1.2;vertical-align:middle}
    .sp-table th{text-align:center}
    .sp-table thead th{border-bottom-width:2px}
    .sp-table td:nth-child(1),.sp-table th:nth-child(1){width:14%;text-align:center;white-space:nowrap}
    .sp-table td:nth-child(2),.sp-table th:nth-child(2){width:11%;text-align:center}
    .sp-table td:nth-child(3),.sp-table th:nth-child(3){width:22%}
    .sp-table td:nth-child(4),.sp-table th:nth-child(4){width:10%;text-align:center}
    .sp-table td:nth-child(5),.sp-table th:nth-child(5){width:13%;text-align:center}
    .sp-table td:nth-child(6),.sp-table th:nth-child(6){width:9%;text-align:center}
    .sp-table td:nth-child(7),.sp-table th:nth-child(7){width:11%;text-align:center}

    .sp-day{break-inside:avoid;page-break-inside:avoid}
    .sp-day + .sp-day .sp-day-head td{border-top-width:2px}
    .sp-day-head td{background:#f2f2f2;font-weight:bold;font-size:10px;text-align:center}

    .sp-signatures{display:flex;justify-content:space-between;margin-top:1.5rem;gap:1rem}
    .sp-signatures div{flex:1}
    .sp-signatures .sig-label{font-weight:bold;font-size:11px}
    .sp-signatures .sig-name{font-size:11px;margin-top:0.15rem}
    .sp-signatures .sig-role{font-size:9px;color:#555;margin-top:0.15rem}

    @media print{body{padding:0.35in}}
    @media print and (orientation:landscape){
      body{zoom:0.82}
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
    <small>Instructor Schedule for</small>
    <h2>${safe(context.instructorName)}</h2>
    <p>S.Y. ${safe(context.schoolYear)}, ${safe(context.semesterLabel)}</p>
  </header>
  <table class="sp-table">
    <thead>
      <tr><th>TIME</th><th>SUBJECT CODE</th><th>DESCRIPTIVE TITLE</th><th>SET</th><th>MODE</th><th>ROOM</th></tr>
    </thead>
    ${dayBodies}
  </table>
  ${attestation ? `
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
  </footer>` : ""}
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
