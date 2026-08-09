/** The raw analytics payload `GET /instructor/analytics?sy_id=&semester_number=`
 * returns — the current instructor's term-scoped load and schedule. The backend
 * computes the numbers and ships no colours, chart types or layout — every
 * presentational decision is made here. */

export type InstructorSession = {
  regular_sched_id: number;
  day: string;
  start_time: string;
  end_time: string;
  hours: number;
  mode: string;
  room: string;
  set_id: number;
  set_code: string;
  program: string;
  year_level: number;
};

export type InstructorSubject = {
  subject_id: number;
  subject_code: string;
  descriptive_title: string;
  units: number;
  year_level: number;
  program_abbrev: string;
  is_scheduled: boolean;
  is_shared: boolean;
  expected_weekly_hours: number;
  sessions: InstructorSession[];
};

export type InstructorScheduleEntry = {
  day: string;
  descriptive_title: string;
  start_time: string;
  end_time: string;
  mode: string;
  room: string;
  program: string;
  subject_code: string;
};

export type InstructorSummary = {
  assigned_subjects: number;
  scheduled_subjects: number;
  sessions: number;
  units: number;
  booked_hours: number;
  expected_weekly_hours: number;
  max_weekly_hours: number;
  remaining_hours: number;
  load_percent: number;
};

export type InstructorAnalytics = {
  meta: {
    instructor_name: string;
    instructor_profile_id: number;
    school_year: string;
    semester_number: number;
    semester_name: string;
    sy_id: number;
  };
  schedule: InstructorScheduleEntry[];
  subjects: InstructorSubject[];
  summary: InstructorSummary;
};
