export type CalendarStatus = "Ongoing" | "Ended" | "Upcoming";

export type MockSchoolYear = {
  id: number;
  schoolYear: string;
  calendarStatus: CalendarStatus;
  isCurrent: boolean;
  createdAt: string;
};

export type MockSemester = {
  id: number;
  semesterNumber: 1 | 2;
  displayName: string;
  description: string;
  status: "Active";
};

export type TermStatus = "Open" | "Closed";
export type ClosedReason = "Closed by Registrar (Posted)" | "School Year Ended" | null;

export type MockTermClosure = {
  id: number;
  schoolYear: string;
  semester: string;
  semesterNumber: 1 | 2;
  status: TermStatus;
  closedReason: ClosedReason;
  closedAt: string | null;
  closedBy: string | null;
  reopenable: boolean;
  closedNotes?: string;
};

export type AuditAction = "Closed" | "Reopened" | "Auto-Closed";

export type MockAuditEntry = {
  id: number;
  dateTime: string;
  action: AuditAction;
  schoolYear: string;
  semester: string;
  performedBy: string;
  role: string;
  ipAddress: string | null;
  details: string;
};

export const MOCK_SCHOOL_YEARS: MockSchoolYear[] = [
  {
    id: 1,
    schoolYear: "2026-2027",
    calendarStatus: "Ongoing",
    isCurrent: true,
    createdAt: "May 15, 2025 10:23 AM",
  },
  {
    id: 2,
    schoolYear: "2025-2026",
    calendarStatus: "Ended",
    isCurrent: false,
    createdAt: "May 20, 2024 09:15 AM",
  },
  {
    id: 3,
    schoolYear: "2024-2025",
    calendarStatus: "Ended",
    isCurrent: false,
    createdAt: "May 18, 2023 02:30 PM",
  },
  {
    id: 4,
    schoolYear: "2027-2028",
    calendarStatus: "Upcoming",
    isCurrent: false,
    createdAt: "May 10, 2025 11:05 AM",
  },
  {
    id: 5,
    schoolYear: "2028-2029",
    calendarStatus: "Upcoming",
    isCurrent: false,
    createdAt: "May 10, 2025 11:06 AM",
  },
];

export const MOCK_SEMESTERS: MockSemester[] = [
  {
    id: 1,
    semesterNumber: 1,
    displayName: "1st Semester",
    description: "First semester of the academic year.",
    status: "Active",
  },
  {
    id: 2,
    semesterNumber: 2,
    displayName: "2nd Semester",
    description: "Second semester of the academic year.",
    status: "Active",
  },
];

export const MOCK_TERM_CLOSURES: MockTermClosure[] = [
  {
    id: 1,
    schoolYear: "2026-2027",
    semester: "1st Semester",
    semesterNumber: 1,
    status: "Closed",
    closedReason: "Closed by Registrar (Posted)",
    closedAt: "Mar 15, 2026 10:30 AM",
    closedBy: "Maria Santos (Registrar Admin)",
    reopenable: true,
    closedNotes: "End of term grades have been posted and verified.",
  },
  {
    id: 2,
    schoolYear: "2026-2027",
    semester: "2nd Semester",
    semesterNumber: 2,
    status: "Open",
    closedReason: null,
    closedAt: null,
    closedBy: null,
    reopenable: false,
  },
  {
    id: 3,
    schoolYear: "2025-2026",
    semester: "2nd Semester",
    semesterNumber: 2,
    status: "Closed",
    closedReason: "School Year Ended",
    closedAt: "Jun 01, 2025",
    closedBy: "System (Auto)",
    reopenable: false,
  },
  {
    id: 4,
    schoolYear: "2025-2026",
    semester: "1st Semester",
    semesterNumber: 1,
    status: "Closed",
    closedReason: "Closed by Registrar (Posted)",
    closedAt: "Oct 20, 2025 02:15 PM",
    closedBy: "Maria Santos (Registrar Admin)",
    reopenable: false,
  },
  {
    id: 5,
    schoolYear: "2024-2025",
    semester: "2nd Semester",
    semesterNumber: 2,
    status: "Closed",
    closedReason: "School Year Ended",
    closedAt: "Jun 01, 2024",
    closedBy: "System (Auto)",
    reopenable: false,
  },
];

export const MOCK_AUDIT_LOG: MockAuditEntry[] = [
  {
    id: 1,
    dateTime: "Mar 15, 2026 10:30 AM",
    action: "Closed",
    schoolYear: "2026-2027",
    semester: "1st Semester",
    performedBy: "Maria Santos",
    role: "Registrar Admin",
    ipAddress: "192.168.1.45",
    details: "Closed by Registrar (Posted)",
  },
  {
    id: 2,
    dateTime: "Mar 10, 2026 03:45 PM",
    action: "Reopened",
    schoolYear: "2025-2026",
    semester: "2nd Semester",
    performedBy: "Maria Santos",
    role: "Registrar Admin",
    ipAddress: "192.168.1.45",
    details: "Reopened for corrections",
  },
  {
    id: 3,
    dateTime: "Jun 01, 2025 12:00 AM",
    action: "Auto-Closed",
    schoolYear: "2024-2025",
    semester: "2nd Semester",
    performedBy: "System (Auto)",
    role: "System",
    ipAddress: null,
    details: "School year ended",
  },
  {
    id: 4,
    dateTime: "Oct 20, 2025 02:15 PM",
    action: "Closed",
    schoolYear: "2025-2026",
    semester: "1st Semester",
    performedBy: "Maria Santos",
    role: "Registrar Admin",
    ipAddress: "192.168.1.45",
    details: "Closed by Registrar (Posted)",
  },
  {
    id: 5,
    dateTime: "Oct 18, 2025 09:00 AM",
    action: "Reopened",
    schoolYear: "2026-2027",
    semester: "1st Semester",
    performedBy: "Maria Santos",
    role: "Registrar Admin",
    ipAddress: "192.168.1.45",
    details: "Reopened for grade correction",
  },
];
