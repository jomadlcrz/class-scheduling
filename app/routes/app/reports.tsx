import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { Card } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { ResultState } from "~/components/feedback/result-state";
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
  type ScheduleSemester,
} from "~/types/schedule";
import { useSemesters } from "~/hooks/use-semesters";
import { useSchoolYears } from "~/hooks/use-school-years";

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
  const { semesters, semesterLabel } = useSemesters();
  const { schoolYears, defaultSchoolYear } = useSchoolYears();
  const [activeTab, setActiveTab] = useState<Tab>("schedule");
  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear);
  const [semester, setSemester] = useState<ScheduleSemester>(1);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   setLoading(true);
  //   setData(null);
  //   Promise.all([
  //     reportService.getScheduleSummary(schoolYear, semester),
  //     reportService.getFacultyLoad(schoolYear, semester),
  //     reportService.getRoomUtilization(schoolYear, semester),
  //     reportService.getEnrollmentStats(),
  //   ]).then(([summary, facultyLoad, roomUtilization, enrollment]) => {
  //     setData({ summary, facultyLoad, roomUtilization, enrollment });
  //     setLoading(false);
  //   });
  // }, [schoolYear, semester]);

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
              items={schoolYears.map((y) => ({ value: y.schoolYear, label: y.schoolYear }))}
              value={schoolYear}
              onValueChange={(v) => setSchoolYear(v as string)}
            >
              <SelectTrigger id="school-year" aria-label="School Year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((y) => (
                  <SelectItem key={y.id} value={y.schoolYear}>
                    {y.schoolYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={semesters.map((s) => ({
                value: String(s.semesterNumber),
                label: semesterLabel(s.semesterNumber),
              }))}
              value={String(semester)}
              onValueChange={(v) => setSemester(Number(v) as ScheduleSemester)}
            >
              <SelectTrigger id="semester" aria-label="Semester">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.semesterNumber)}>
                    {semesterLabel(s.semesterNumber)}
                  </SelectItem>
                ))}
              </SelectContent>
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
            <ResultState tone="error" title="Not available">
              This feature is not connected to the backend yet.
            </ResultState>
          </div>
        </div>
      </div>
    </div>
  );
}
