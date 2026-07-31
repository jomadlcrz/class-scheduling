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

export type UnscheduledSet = {
  set_id: number;
  set_code: string;
  year_level: number;
  program_id: number;
  program_abbrev: string;
};

export type ScheduleCompletion = {
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

export type LabCapacity = {
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

export type Enrollment = {
  total_students: number;
  regular_count: number;
  irregular_count: number;
  irregular_pending_count: number;
  irregular_fully_seated_count: number;
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

export type Staffing = {
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
