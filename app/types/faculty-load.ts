import type { Semester, YearLevel } from "~/types/subject";

/** One subject to assign within a program (matched by id on the backend). */
type SubjectLoadInput = {
  subjectId: number;
};

/** Subjects to assign for a single program (matched by id on the backend). */
export type ProgramLoadInput = {
  programId: number;
  subjects: SubjectLoadInput[];
};

type DepartmentSubjectEntry = {
  curriculumDetailId: number;
  subjectId: number;
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
  prerequisites: string[];
};

type DepartmentSubjectSemesterGroup = {
  semester: Semester;
  semesterTotalUnits: number;
  subjects: DepartmentSubjectEntry[];
};

type DepartmentSubjectYearGroup = {
  yearLevel: YearLevel;
  yearTotalUnits: number;
  semesterDetails: DepartmentSubjectSemesterGroup[];
};

/** One program's curriculum tree for the dean's department. `programName` comes from GET /deans/subjects; `programAbbrev` is resolved from GET /programs. */
export type DepartmentSubjectProgram = {
  programId?: number;
  programAbbrev: string;
  programName: string;
  programTotalUnits: number;
  curriculumDetails: DepartmentSubjectYearGroup[];
};

/** One scheduled session under a subject, as returned by GET /deans/faculty-loading. */
type FacultyLoadingSchedule = {
  day: string;
  time: string;
  numberOfStudents: number;
  course: string;
  yearLevel: YearLevel;
  setCode: string;
  room: string | null;
};

/** One subject an instructor is carrying this term, with its scheduled sessions. */
type FacultyLoadingSubject = {
  subjectCode: string;
  descriptiveTitle: string;
  units: { total: number; lecHours: number; labHours: number };
  schedules: FacultyLoadingSchedule[];
  /** curriculum_detail_id from the teaching term's subject assignment — needed for PUT updates. */
  curriculumDetailId?: number;
  /** program abbreviation from the subject assignment — used to group subjects by program in the dean view. */
  programAbbrev?: string;
};

/** One instructor's loading sheet for a term, as returned by GET /deans/faculty-loading. */
export type FacultyLoadingEntry = {
  instructorName: string;
  employeeId: string | null;
  department: string;
  semester: string;
  academicTerm: string;
  maxWeeklyHours: number | null;
  /** Populated from GET /deans/teaching-terms so maxWeeklyHours can be edited. */
  teachingTermId: number | null;
  instructorProfileId?: number;
  syId?: number;
  semId?: number;
  semesterNumber?: number;
  /** subjectCode → subjectAssignmentId lookup, merged from teaching terms. */
  subjectAssignmentIds?: Map<string, number>;
  /** Programs grouped from the teaching term response — matches the grouped view on /dean/teaching-terms/<id>. */
  programs?: {
    programAbbrev: string;
    programName: string;
    programId: number;
    subjects: {
      subjectAssignmentId: number;
      curriculumDetailId: number;
      subjectCode: string;
      descriptiveTitle: string;
      units: number;
      lecHours: number;
      labHours: number;
    }[];
  }[];
  subjects: FacultyLoadingSubject[];
};

/** A term-scoped instructor teaching load, as returned by GET /deans/teaching-terms/<id>. */
export type TeachingTerm = {
  id: number;
  instructorProfileId: number;
  instructorName: string;
  employeeId: string | null;
  department?: string;
  syId: number;
  semId: number;
  semesterNumber: number;
  maxWeeklyHours: number;
  currentWeeklyHours: number;
  /** Populated by the list endpoint so the view can reference assignment IDs. */
  subjectAssignments?: {
    subjectAssignmentId: number;
    subjectCode: string;
    curriculumDetailId: number;
    programAbbrev: string;
    descriptiveTitle: string;
    units: number;
    lecHours: number;
    labHours: number;
  }[];
  /** Grouped-by-program view from the list endpoint. */
  programs?: { programId: number; programAbbrev: string; programName: string; subjects: { subjectAssignmentId: number; curriculumDetailId: number; subjectCode: string }[] }[];
};

/** One scheduled session within a teaching-term detail subject assignment. */
export type TeachingTermDetailScheduledSession = {
  regular_sched_id: number;
  day: string;
  start_time: string;
  end_time: string;
  hours: number;
  room: string | null;
  mode: string | null;
  program: string | null;
  year_level: number | null;
  set_code: string | null;
};

/** One subject assignment inside the rich teaching-term detail payload. */
export type TeachingTermDetailSubjectAssignment = {
  subject_assignment_id: number;
  curriculum_detail_id: number;
  subject_id: number | null;
  subject_code: string | null;
  descriptive_title: string | null;
  units: number;
  subject_type: string | null;
  lec_hours: number;
  lab_hours: number;
  expected_weekly_hours: number;
  meetings: number | null;
  program_id: number | null;
  program_abbrev: string | null;
  program_name: string | null;
  year_level: number | null;
  semester_category: number | null;
  is_shared: boolean;
  programs_covered: {
    curriculum_detail_id: number;
    program_id: number;
    program_abbrev: string | null;
    program_name: string | null;
    year_level: number | null;
    semester_category: number | null;
  }[];
  also_carried_by: {
    curriculum_detail_id: number;
    program_id: number;
    program_abbrev: string | null;
    program_name: string | null;
    year_level: number | null;
    semester_category: number | null;
  }[];
  scheduled_sessions: TeachingTermDetailScheduledSession[];
  scheduled_hours: number;
  is_scheduled: boolean;
};

/** One daily load entry (always Mon–Sat, 6 rows). */
type TeachingTermDetailDailyLoad = {
  daily_load_id: number | null;
  day_of_week: number;
  day_name: string;
  current_daily_hours: number;
};

/** An unassigned subject that has scheduled sessions — data-integrity signal. */
export type TeachingTermDetailUnassignedSubject = {
  subject_id: number;
  subject_code: string;
  descriptive_title: string;
  scheduled_sessions: TeachingTermDetailScheduledSession[];
  scheduled_hours: number;
};

/** Full rich payload from GET /deans/teaching-terms/<id>. */
export type TeachingTermDetail = {
  teaching_term_id: number;
  instructor: {
    instructor_profile_id: number;
    employee_id: string | null;
    profile_photo_url: string | null;
    first_name: string | null;
    mid_name: string | null;
    last_name: string | null;
    full_name: string | null;
    gender: string | null;
    civil_status: string | null;
    department_id: number | null;
    department: string | null;
    department_abbrev: string | null;
    email: string | null;
    mobile: string | null;
    account_active: boolean | null;
    account_status: string | null;
  };
  term: {
    sy_id: number;
    school_year: string | null;
    sem_id: number;
    semester: string | null;
    semester_number: number | null;
  };
  hours: {
    max_weekly_hours: number;
    current_weekly_hours: number;
    remaining_weekly_hours: number;
    utilization_rate: number;
    is_overloaded: boolean;
    expected_weekly_hours: number;
    total_daily_hours: number;
  };
  totals: {
    assigned_subjects: number;
    total_units: number;
    scheduled_subjects: number;
    scheduled_sessions: number;
    programs: number;
  };
  daily_loads: TeachingTermDetailDailyLoad[];
  programs: {
    program_id: number;
    program_abbrev: string | null;
    program_name: string | null;
    subjects: TeachingTermDetailSubjectAssignment[];
    totals: { assigned_subjects: number; total_units: number; scheduled_subjects: number };
  }[];
  subject_assignments: TeachingTermDetailSubjectAssignment[];
  unassigned_scheduled_subjects: TeachingTermDetailUnassignedSubject[];
};

/** Raw snake_case response from GET /deans/faculty-loading. */
export type FacultyLoadingResponse = {
  instructor_name: string;
  department: string;
  semester: string;
  academic_year: string;
  subjects: {
    subject_code: string;
    descriptive_title: string;
    units: { total: number; lec_hours: number; lab_hours: number };
    schedules: {
      day: string;
      time: string;
      number_of_students: number;
      course: string;
      year_level: number;
      set_code: string;
      room: string | null;
    }[];
  }[];
}[];
