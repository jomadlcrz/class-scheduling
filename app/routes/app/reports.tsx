import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Card } from "~/components/ui/card";
import { Select } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { EnrollmentReport } from "~/features/reports/enrollment-report";
import { ExportReport } from "~/features/reports/export-report";
import { FacultyLoad } from "~/features/reports/faculty-load";
import { RoomUtilization } from "~/features/reports/room-utilization";
import { ScheduleReport } from "~/features/reports/schedule-report";
import { PageHeader } from "~/layouts/page-header";
import {
  type EnrollmentStats,
  type FacultyLoadRow,
  type RoomUtilizationRow,
  type ScheduleSummary,
  reportService,
} from "~/services/report.service";
import {
  DEFAULT_SCHOOL_YEAR,
  SCHEDULE_SEMESTER_LABELS,
  SCHEDULE_SEMESTERS,
  SCHOOL_YEARS,
  type ScheduleSemester,
} from "~/types/schedule";

export function meta() {
  return [
    { title: "Reports — GWC Class Scheduling" },
    { name: "description", content: "Schedule, enrollment, faculty, and room reports." },
  ];
}

export default function ReportsRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <ReportsPage />
    </RoleGuard>
  );
}

type Tab = "schedule" | "faculty" | "rooms" | "enrollment" | "export";

const TABS: { id: Tab; label: string }[] = [
  { id: "schedule", label: "Schedules" },
  { id: "faculty", label: "Faculty Load" },
  { id: "rooms", label: "Room Usage" },
  { id: "enrollment", label: "Enrollment" },
  { id: "export", label: "Export" },
];

type ReportData = {
  summary: ScheduleSummary;
  facultyLoad: FacultyLoadRow[];
  roomUtilization: RoomUtilizationRow[];
  enrollment: EnrollmentStats;
};

function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("schedule");
  const [schoolYear, setSchoolYear] = useState(DEFAULT_SCHOOL_YEAR);
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    Promise.all([
      reportService.getScheduleSummary(schoolYear, semester),
      reportService.getFacultyLoad(schoolYear, semester),
      reportService.getRoomUtilization(schoolYear, semester),
      reportService.getEnrollmentStats(),
    ]).then(([summary, facultyLoad, roomUtilization, enrollment]) => {
      setData({ summary, facultyLoad, roomUtilization, enrollment });
      setLoading(false);
    });
  }, [schoolYear, semester]);

  const needsFilter = activeTab !== "enrollment" && activeTab !== "export";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Reports"
        description="Aggregate views of schedules, faculty workload, room usage, and enrollment."
      />

      <div className="mt-6 flex flex-col gap-6">
        {needsFilter && (
          <Card className="flex flex-wrap items-end gap-4 p-4">
            <Select
              id="school-year"
              label="School Year"
              hideLabel
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
            >
              {SCHOOL_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
            <Select
              id="semester"
              label="Semester"
              hideLabel
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value) as ScheduleSemester)}
            >
              {SCHEDULE_SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {SCHEDULE_SEMESTER_LABELS[s]}
                </option>
              ))}
            </Select>
          </Card>
        )}

        <div>
          <div
            role="tablist"
            aria-label="Report types"
            className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/8"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-3 pb-3 font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                  activeTab === tab.id
                    ? "border-navy-700 text-navy-700 dark:border-gold-400 dark:text-gold-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="mt-6">
            {activeTab === "export" ? (
              <ExportReport />
            ) : activeTab === "enrollment" ? (
              loading || !data ? (
                <Spinner />
              ) : (
                <EnrollmentReport data={data.enrollment} />
              )
            ) : loading || !data ? (
              <div
                role="status"
                aria-label="Loading report"
                className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
              >
                <Spinner />
              </div>
            ) : (
              <>
                {activeTab === "schedule" && <ScheduleReport data={data.summary} />}
                {activeTab === "faculty" && <FacultyLoad rows={data.facultyLoad} />}
                {activeTab === "rooms" && <RoomUtilization rows={data.roomUtilization} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
