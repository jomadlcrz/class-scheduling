import { DAYS, DAY_LABELS, formatTime, type Day, type Schedule } from "~/types/schedule";

function safe(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDayGroup(day: Day, slots: Schedule[]): string {
  const rows = slots
    .map(
      (s) => `
        <tr>
          <td>${formatTime(s.startTime)} – ${formatTime(s.endTime)}</td>
          <td>${safe(s.subjectCode)}</td>
          <td>${safe(s.subjectTitle)}</td>
          <td>${safe(s.mode)}</td>
          <td>${safe(s.facultyName)}</td>
          <td>${safe(s.roomName)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section class="sp-day">
      <h4>${safe(DAY_LABELS[day]).toUpperCase()}</h4>
      <table>
        <thead>
          <tr><th>TIME</th><th>SUBJECT CODE</th><th>DESCRIPTIVE TITLE</th><th>MODE</th><th>INSTRUCTOR</th><th>ROOM</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

/**
 * Open a set's regular class schedule as a printable document in a new tab —
 * school letterhead, day-grouped time tables, mirroring the curriculum print
 * layout. Runs in an isolated document so it never needs to hide the app
 * shell (sidebar/navbar) or touch global print CSS.
 */
export function openSchedulePrint(
  schedules: Schedule[],
  context: { schoolYear: string; semesterLabel: string },
): boolean {
  if (schedules.length === 0) return false;

  const origin = window.location.origin;
  const { setCode, departmentCode } = schedules[0];

  const dayGroups = DAYS.map((day) => ({
    day,
    slots: schedules
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((g) => g.slots.length > 0);

  const dayBlocks = dayGroups.map(({ day, slots }) => renderDayGroup(day, slots)).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Class Schedule — ${safe(setCode)}</title>
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

    @media print{body{padding:0.35in}}
  </style>
</head>
<body>
  <header class="sp-header">
    <img class="sp-logo sp-logo-left" src="${origin}/images/logos/gwc-logo.avif" alt="GWC logo" />
    <img class="sp-logo sp-logo-right" src="${origin}/images/departments/${safe(departmentCode.toLowerCase())}.avif" alt="${safe(departmentCode)} logo" onerror="if(this.src!=='${origin}/images/departments/no-logo.avif')this.src='${origin}/images/departments/no-logo.avif'" />
    <strong>GOLDEN WEST COLLEGES, INC.</strong>
    <span>San Jose Drive, Alaminos City, Pangasinan</span>
    <small>Class Schedule for</small>
    <h2>${safe(setCode)}</h2>
    <p>S.Y. ${safe(context.schoolYear)}, ${safe(context.semesterLabel)}</p>
  </header>
  ${dayBlocks}
  <script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)})</script>
</body>
</html>`;

  // A blob URL is a real navigation target, unlike document.write into "about:blank" —
  // browsers only pick up <link rel="icon"> on an actual navigated document.
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  // "noopener" would make window.open return null — this tab hosts only our markup.
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return true;
}
