import type { FacultyLoadingEntry } from "~/types/faculty-load";

function safe(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Open a faculty loading sheet as a printable document in a new tab —
 * GWC letterhead, instructor info grid, schedule table mirroring the
 * on-screen layout. Runs in an isolated document so it never needs to
 * hide the app shell or touch global print CSS.
 */
export function openFacultyLoadingPrint(
  entry: FacultyLoadingEntry,
  context: { schoolYear: string; semesterLabel: string },
): boolean {
  const origin = window.location.origin;

  const rows: string[] = [];
  for (const subject of entry.subjects) {
    subject.schedules.forEach((sched, idx) => {
      const isFirst = idx === 0;
      const borderClass = isFirst ? 'style="border-top:2px solid #1e3a5f"' : "";
      rows.push(`
        <tr ${borderClass}>
          ${isFirst ? `<td rowspan="${subject.schedules.length}" class="center">${safe(subject.subjectCode)}</td>` : ""}
          ${isFirst ? `<td rowspan="${subject.schedules.length}" class="center">${safe(subject.descriptiveTitle)}</td>` : ""}
          ${isFirst ? `<td rowspan="${subject.schedules.length}" class="center">${subject.units.lecHours}</td>` : ""}
          ${isFirst ? `<td rowspan="${subject.schedules.length}" class="center">${subject.units.labHours}</td>` : ""}
          <td class="center">${safe(sched.day)}</td>
          <td class="center">${safe(sched.time)}</td>
          <td class="center">${sched.numberOfStudents}</td>
          <td class="center">${safe(sched.course)}</td>
          <td class="center">${safe(sched.yearLevel)}</td>
          <td class="center bold">${safe(sched.setCode)}</td>
          <td class="center">${safe(sched.room)}</td>
        </tr>
      `);
    });
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Faculty Loading — ${safe(entry.instructorName)}</title>
  <link rel="icon" href="${origin}/favicon.ico" />
  <style>
    *{box-sizing:border-box;margin:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;padding:0.4in}

    .fl-header{display:flex;align-items:center;justify-content:center;gap:0.15in;padding-bottom:0.3rem;margin-bottom:0;line-height:1.12;border-bottom:2px solid #1e3a5f}
    .fl-header .fl-text{text-align:center}
    .fl-header strong,.fl-header span{display:block}
    .fl-header strong{font-size:15px}
    .fl-header span{font-size:10px}

    .fl-heading{text-align:center;padding:0.25rem 0;font-size:14px;font-weight:700;letter-spacing:0.1em;margin-bottom:0.35rem}

    .fl-logo{width:0.62in;height:0.62in;border-radius:50%;object-fit:contain}

    .fl-info{width:100%;border-collapse:collapse;margin-bottom:0.35rem}
    .fl-info td{border:1px solid #444;padding:0.12rem 0.25rem;font-size:9px;vertical-align:middle}
    .fl-info td.lbl{font-weight:700;width:12%;background:#f5f5f5}
    .fl-info td.oval{width:38%}

    .fl-table{width:100%;border-collapse:collapse;table-layout:fixed}
    .fl-table th,.fl-table td{border:1px solid #444;padding:0.12rem 0.15rem;font-size:8px;line-height:1.2;vertical-align:middle}
    .fl-table th{background:#f5f5f5;font-weight:700;text-align:center;font-size:8px}
    .fl-table .center{text-align:center}
    .fl-table .bold{font-weight:700}

    .fl-table .group-label{font-size:8px;letter-spacing:0.05em;background:#e5e7eb}
    .fl-empty{text-align:center;padding:1rem;font-size:9px;color:#666}


    @media print{body{padding:0.35in}}
  </style>
</head>
<body>
  <header class="fl-header">
    <img class="fl-logo" src="${origin}/images/logos/gwc-logo.avif" alt="GWC logo" />
    <div class="fl-text">
      <strong>GOLDEN WEST COLLEGES, INC.</strong>
      <span>San Jose Drive, Alaminos City, Pangasinan *Tel. No. (075) 552-7382</span>
      <span>Email Address: goldenwest.colleges@yahoo.com.ph</span>
    </div>
  </header>

  <div class="fl-heading">FACULTY LOADING</div>

  <table class="fl-info">
    <tr>
      <td class="lbl">NAME</td>
      <td class="oval">${safe(entry.instructorName)}</td>
      <td class="lbl">SEMESTER</td>
      <td class="oval">${safe(context.semesterLabel)}</td>
    </tr>
    <tr>
      <td class="lbl">DEPARTMENT</td>
      <td class="oval">${safe(entry.department)}</td>
      <td class="lbl">ACADEMIC TERM</td>
      <td class="oval">${safe(context.schoolYear)}</td>
    </tr>
  </table>

  ${rows.length === 0 ? '<p class="fl-empty">No classes scheduled for the selected term.</p>' : `
  <table class="fl-table">
    <colgroup>
      <col style="width:8%" />
      <col style="width:22%" />
      <col style="width:4%" />
      <col style="width:4%" />
      <col style="width:9%" />
      <col style="width:14%" />
      <col style="width:5%" />
      <col style="width:8%" />
      <col style="width:5%" />
      <col style="width:9%" />
      <col style="width:12%" />
    </colgroup>
    <thead>
      <tr>
        <th rowspan="2">SUBJECT CODE</th>
        <th rowspan="2">DESCRIPTIVE TITLE</th>
        <th colspan="2" class="group-label">UNITS</th>
        <th colspan="2" class="group-label">SCHEDULE</th>
        <th colspan="5" class="group-label">Class Information</th>
      </tr>
      <tr>
        <th>LEC</th>
        <th>LAB</th>
        <th>DAY</th>
        <th>TIME</th>
        <th>No. of<br>students</th>
        <th>COURSE</th>
        <th>YEAR</th>
        <th>SET</th>
        <th>ROOM</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join("")}
    </tbody>
  </table>`}

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
