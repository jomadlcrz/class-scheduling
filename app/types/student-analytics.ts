/** The raw analytics payload `GET /students/me/analytics?sy_id=&semester_number=`
 * returns — the current student's term-scoped schedule and subjects. The backend
 * computes the numbers and ships no colours, chart types or layout — every
 * presentational decision is made here. */

export type StudentScheduleEntry = {
  day: string;
  descriptive_title: string;
  start_time: string;
  end_time: string;
  hours: number;
  instructor: string;
  mode: string;
  room: string;
  subject_code: string;
};

export type StudentSubjectSession = {
  regular_sched_id: number;
  day: string;
  start_time: string;
  end_time: string;
  hours: number;
  instructor: string;
  mode: string;
  room: string;
};

export type StudentSubject = {
  subject_id: number;
  subject_code: string;
  descriptive_title: string;
  units: number;
  is_scheduled: boolean;
  sessions: StudentSubjectSession[];
};

export type StudentSummary = {
  sessions: number;
  subjects_pending: number;
  subjects_scheduled: number;
  total_subjects: number;
  total_weekly_hours: number;
};

export type StudentAnalytics = {
  meta: {
    student_name: string;
    student_profile_id: number;
    enrolled_status: string;
    program_abbrev: string;
    program_name: string | null;
    set_name: string;
    year_level: number;
    school_year: string;
    semester_number: number;
    semester_name: string;
    sy_id: number;
    scheduleReleaseStatus: string;
  };
  schedule: StudentScheduleEntry[];
  subjects: StudentSubject[];
  summary: StudentSummary;
};
