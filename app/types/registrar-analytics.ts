/** The raw analytics payload `GET /registrar/analytics` returns. The backend
 * computes the numbers and ships no colours, chart types or layout — every
 * presentational decision is made here. */

export type ScheduleCompletionProgram = {
  program_id: number;
  program_abbrev: string;
  total_sets: number;
  scheduled_sets: number;
  unscheduled_sets: number;
  scheduled_percent: number;
};

type UnscheduledSet = {
  set_id: number;
  set_code: string;
  year_level: number;
  program_id: number;
  program_abbrev: string;
};

type ScheduleCompletion = {
  total_sets: number;
  scheduled_sets: number;
  unscheduled_sets_count: number;
  scheduled_percent: number;
  by_program: ScheduleCompletionProgram[];
  unscheduled_sets: UnscheduledSet[];
};

export type LabSummary = {
  room_id: number;
  room_name: string;
  building: string;
  booked_hours: number;
  window_capacity_hours: number;
  hour_utilization_percent: number;
  slots_used: number;
  slot_capacity: number;
  is_fully_booked: boolean;
};

type LabCapacity = {
  laboratories_total: number;
  fully_booked_laboratories: number;
  laboratories_with_free_slots: number;
  booked_hours: number;
  window_capacity_hours: number;
  hour_utilization_percent: number;
  slot_utilization_percent: number;
  conflicts: number;
  laboratories: LabSummary[];
};

type EnrollmentStatusBreakdown = {
  status: string;
  count: number;
};

type NotEnrolledStudent = {
  student_profile_id: number;
  student_id: string | null;
  full_name: string;
};

export type Enrollment = {
  /** Enrolled THIS term — a StudentAcademic row exists for this sy_id/sem_id. */
  total_students: number;
  /** Whole active roster, enrolled or not — the denominator for not_enrolled_count. */
  total_active_students: number;
  /** Active students with no enrollment row at all this term — they never
   * show up in the pending counts below, since there's nothing to be
   * "pending" on. */
  not_enrolled_count: number;
  /** Every not-yet-enrolled active student, complete — not a "top N" sample. */
  not_enrolled_students: NotEnrolledStudent[];
  regular_count: number;
  regular_seated_count: number;
  regular_pending_count: number;
  irregular_count: number;
  irregular_pending_count: number;
  irregular_fully_seated_count: number;
  /** Sum of regular_pending_count + irregular_pending_count — read this for a
   * single school-wide "awaiting seats" figure instead of adding the two
   * group counts yourself. */
  total_pending_count: number;
  total_seated_count: number;
  /** Five mutually-exclusive categories (including "Not yet enrolled"),
   * donut/pie-ready, across the whole active roster. */
  status_breakdown: EnrollmentStatusBreakdown[];
};

export type DepartmentStaffing = {
  department_id: number;
  department_abbrev: string;
  department_name: string;
  roster_size: number;
  instructors_staffed: number;
  instructors_idle: number;
  capacity_total_hours: number;
  capacity_booked_hours: number;
  capacity_used_percent: number;
  instructors_over_cap: number;
};

type Staffing = {
  roster_size: number;
  instructors_staffed: number;
  instructors_idle: number;
  capacity_total_hours: number;
  capacity_booked_hours: number;
  capacity_used_percent: number;
  instructors_over_cap: number;
  by_department: DepartmentStaffing[];
};

export type RegistrarAnalyticsResponse = {
  meta: {
    sy_id: number;
    school_year: string;
    sem_id: number;
    semester: string;
    semester_number: number;
  };
  schedule_completion: ScheduleCompletion;
  lab_capacity: LabCapacity;
  enrollment: Enrollment;
  staffing: Staffing;
};
