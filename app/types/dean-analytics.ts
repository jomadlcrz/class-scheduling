/** The raw analytics payload `GET /deans/analytics` returns. The backend
 * computes the numbers and ships no colours, chart types or layout — every
 * presentational decision is made here. */

export type LoadBand = {
  band: string;
  range_low_percent: number;
  range_high_percent: number | null;
  description: string;
  count: number;
};

export type InstructorLoad = {
  teaching_term_id: number;
  instructor_profile_id: number;
  instructor_name: string;
  employee_id: string | null;
  account_active: boolean;
  max_weekly_hours: number;
  booked_hours: number;
  remaining_hours: number;
  load_percent: number;
  load_band: string;
  over_cap: boolean;
  assigned_subjects: number;
  scheduled_subjects: number;
  sessions: number;
  units: number;
  programs: number;
};

export type DailyLoadHour = {
  day_of_week: number;
  day_name: string;
  hours: number;
};

export type CoverageByProgram = {
  program_id: number;
  program_abbrev: string;
  program_name: string;
  total_subjects: number;
  staffed_subjects: number;
  unstaffed_subjects: number;
  staffed_percent: number;
};

export type CoverageSubject = {
  program_id: number;
  program_abbrev: string;
  year_level: number;
  subject_id: number;
  subject_code: string;
  descriptive_title: string;
  subject_type: string | null;
  units: number;
  is_staffed: boolean;
};

export type AttentionItem = {
  severity: "critical" | "warning" | "serious";
  instructor_profile_id?: number;
  teaching_term_id?: number;
  instructor_name?: string;
  program_id?: number;
  program_abbrev?: string;
  subject_id?: number;
  subject_code?: string;
  issue: string;
  detail: string;
  action: string;
};

export type Spread = {
  instructors: number;
  median_load_percent: number;
  p90_load_percent: number;
  coefficient_of_variation_percent: number;
  evenness: string;
};

export type Insight = {
  severity: "critical" | "warning" | "info" | "good";
  title: string;
  message: string;
  action: string | null;
  related_to: string | null;
};

export type DeanAnalyticsResponse = {
  meta: {
    department: string | null;
    department_id: number;
    sy_id: number;
    school_year: string;
    sem_id: number;
    semester: string;
    semester_number: number;
    teaching_terms: number;
    assignments: number;
    curriculum_subjects: number;
  };
  summary: {
    roster_size: number;
    instructors_staffed: number;
    instructors_idle: number;
    curriculum_subjects_total: number;
    curriculum_subjects_staffed: number;
    curriculum_subjects_unstaffed: number;
    curriculum_staffed_percent: number;
    capacity_total_hours: number;
    capacity_booked_hours: number;
    capacity_remaining_hours: number;
    capacity_used_percent: number;
    curriculum_hours_assigned: number;
    assignments_total: number;
    assignments_scheduled: number;
    assignments_scheduled_percent: number;
    instructors_over_cap: number;
  };
  instructor_loads: InstructorLoad[];
  load_bands: LoadBand[];
  daily_load_hours: DailyLoadHour[];
  curriculum_coverage: {
    by_program: CoverageByProgram[];
    subjects: CoverageSubject[];
  };
  attention: AttentionItem[];
  spread: Spread;
  insights: Insight[];
};
