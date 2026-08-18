import type { EnrollmentRegistration } from "~/types/enrollment";
import { programService } from "~/services/program.service";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function safe(value: string | number | null | undefined): string {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTime(time: string | null): string {
  if (!time) return "—";
  const parts = time.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return "—";
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

type ScheduleEntry = EnrollmentRegistration["schedule"][number];

function groupByDay(schedule: ScheduleEntry[]): Map<string, ScheduleEntry[]> {
  const map = new Map<string, ScheduleEntry[]>();
  for (const entry of schedule) {
    const day = entry.day ?? "—";
    const list = map.get(day) ?? [];
    list.push(entry);
    map.set(day, list);
  }
  return map;
}

/** Opens the Certificate of Registration as a printable document. */
export async function openRegistrationPrint(
  registration: EnrollmentRegistration,
): Promise<boolean> {
  if (!registration.enrolled) return false;

  const { meta, summary, subjects, schedule } = registration;
  const origin = window.location.origin;

  let departmentCode = "";
  if (meta.program_abbrev) {
    try {
      const programs = await programService.list();
      const matched = programs.find((p) => p.abbrev === meta.program_abbrev);
      if (matched?.departmentAbbrev) departmentCode = matched.departmentAbbrev;
    } catch {
      // fallback: no department logo
    }
  }

  const subjectRows = subjects
    .map(
      (s) => `
        <tr>
          <td>${safe(s.subject_code)}</td>
          <td>${safe(s.descriptive_title)}</td>
          <td class="center">${s.lec_hours ?? "—"}</td>
          <td class="center">${s.lab_hours ?? "—"}</td>
          <td class="center">${s.units ?? "—"}</td>
        </tr>
      `,
    )
    .join("");

  let scheduleSection = "";
  if (schedule.length > 0) {
    const grouped = groupByDay(schedule);
    const dayOrder = DAY_ORDER.filter((d) => grouped.has(d));
    const otherDays = [...grouped.keys()].filter((d) => !DAY_ORDER.includes(d));
    const orderedDays = [...dayOrder, ...otherDays];

    const dayRows = orderedDays
      .map((day) => {
        const entries = grouped.get(day)!;
        return entries
          .map(
            (s, i) => `
              <tr>
                ${i === 0 ? `<td class="day-cell" rowspan="${entries.length}">${safe(day)}</td>` : ""}
                <td>${safe(s.subject_code)}</td>
                <td class="center">${formatTime(s.start_time)} – ${formatTime(s.end_time)}</td>
                <td>${safe(s.room)}</td>
                <td>${safe(s.instructor)}</td>
              </tr>
            `,
          )
          .join("");
      })
      .join("");

    scheduleSection = `
      <section class="cor-section">
        <h3>Class Schedule</h3>
        <table class="sched-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Subject Code</th>
              <th>Time</th>
              <th>Room</th>
              <th>Instructor</th>
            </tr>
          </thead>
          <tbody>${dayRows}</tbody>
        </table>
      </section>
    `;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Certificate of Registration — ${safe(meta.full_name)}</title>
  <link rel="icon" href="${origin}/favicon.ico" />
  <style>
    *{box-sizing:border-box;margin:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff;padding:0.35in}

    .cor-header{position:relative;min-height:0.65in;text-align:center;margin-bottom:0.3rem;line-height:1.1;padding:0 0.75in}
    .cor-header strong,.cor-header span,.cor-header small{display:block}
    .cor-header strong{font-size:14px}
    .cor-header span{font-size:9.5px}
    .cor-header small{margin-top:0.25rem;font-size:8.5px}
    .cor-header h2{font-size:11px;margin-top:0.45rem;letter-spacing:0.06em;text-decoration:underline}

    .cor-logo{position:absolute;top:0.02in;width:0.55in;height:0.55in;display:block;padding:0.02in;object-fit:contain;object-position:center}
    .cor-logo-left{left:0.02in}
    .cor-logo-right{right:0.02in}

    .cor-student{display:grid;grid-template-columns:1fr 1fr;gap:0.04in 0.3in;margin:0.12in 0;padding:0.05in 0;font-size:8.5px}
    .cor-student p{line-height:1.3}
    .cor-student b{display:inline-block;min-width:1in}

    .cor-section{margin-top:0.15in}
    .cor-section h3{font-size:9.5px;text-transform:uppercase;margin-bottom:0.05in}

    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #000;padding:0.03in 0.06in;font-size:8px;line-height:1.15;vertical-align:middle}
    th{background:#f0f0f0;text-align:center;font-weight:bold;font-size:7.5px;text-transform:uppercase}
    td.center{text-align:center}

    .day-cell{background:#f5f5f5;font-weight:bold;text-align:center;vertical-align:middle}

    .cor-summary{margin-top:0.08in;font-size:8.5px;text-align:right}
    .cor-summary b{margin-left:0.25in}

    .cor-footer{display:flex;justify-content:space-between;margin-top:0.4in;font-size:8.5px;page-break-inside:avoid;break-inside:avoid}
    .cor-footer div{flex:1}
    .cor-footer .sig-label{font-weight:bold}
    .cor-footer .sig-name{margin-top:0.1in}
    .cor-footer .sig-role{color:#555;margin-top:0.08in}

    @media print{body{padding:0.3in}}
    @media print and (orientation:landscape){body{zoom:0.82}}
  </style>
</head>
<body>
  <header class="cor-header">
    <img class="cor-logo cor-logo-left" src="${origin}/images/logos/gwc-logo.avif" alt="GWC logo" />
    <img class="cor-logo cor-logo-right" src="${origin}/images/departments/${safe(departmentCode.toLowerCase())}.avif" alt="${safe(departmentCode)} logo" onerror="if(this.src!=='${origin}/images/departments/no-logo.avif')this.src='${origin}/images/departments/no-logo.avif'" />
    <strong>GOLDEN WEST COLLEGES, INC.</strong>
    <span>San Jose Drive, Alaminos City, Pangasinan</span>
    <small>S.Y. ${safe(meta.school_year)} &middot; ${safe(meta.semester_name)}</small>
    <h2>Certificate of Registration</h2>
  </header>

  <section class="cor-student">
    <p><b>Student ID:</b> ${safe(meta.student_id)}</p>
    <p><b>Name:</b> ${safe(meta.full_name)}</p>
    <p><b>Program:</b> ${safe(meta.program_abbrev)} — ${safe(meta.program_name)}</p>
    <p><b>Year Level:</b> ${meta.year_level ? `${meta.year_level}${["","st","nd","rd"][meta.year_level] ?? "th"} Year` : "—"}</p>
    <p><b>Section:</b> ${safe(meta.set_name)}</p>
    <p><b>Status:</b> ${safe(meta.enrolled_status)}</p>
  </section>

  <section class="cor-section">
    <h3>Enrolled Subjects</h3>
    <table>
      <thead>
        <tr>
          <th>Subject Code</th>
          <th>Descriptive Title</th>
          <th>Lec Hrs</th>
          <th>Lab Hrs</th>
          <th>Units</th>
        </tr>
      </thead>
      <tbody>${subjectRows}</tbody>
    </table>
    <div class="cor-summary">
      <b>Total Subjects: ${summary.total_subjects}</b>
      <b>Total Units: ${summary.total_units}</b>
    </div>
  </section>

  ${scheduleSection}

  <footer class="cor-footer">
    <div>
      <p class="sig-label">Prepared by:</p>
      <p class="sig-name">${safe(meta.registrar_name ?? "Harvin A. Arisga")}</p>
      <p class="sig-role">Registrar</p>
    </div>
    <div>
      <p class="sig-label">Approved by:</p>
      <p class="sig-name">Denzel Valdez</p>
      <p class="sig-role">Dean, CITE Department</p>
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
