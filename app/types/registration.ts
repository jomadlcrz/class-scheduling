export type RegistrationSubject = {
  subject_id?: number;
  subject_code: string;
  descriptive_title?: string;
  subject_title?: string;
  units: number;
  lec_hours?: number;
  lab_hours?: number;
  is_scheduled?: boolean;
};

export type RegistrationScheduleItem = {
  subject_code: string;
  descriptive_title?: string;
  day: string;
  start_time: string;
  end_time: string;
  hours?: number;
  room?: string;
  instructor?: string;
};

export type RegistrationData = {
  enrolled?: boolean;
  meta?: {
    school_year?: string;
    semester_name?: string;
    semester_number?: number;
    sy_id?: number;
    student_profile_id?: number;
    student_id?: string;
    student_name?: string;
    full_name?: string;
    name_natural?: string;
    enrolled_status?: string;
    program_abbrev?: string;
    program_name?: string;
    set_name?: string;
    year_level?: number;
    year_level_name?: string;
    scheduleReleaseStatus?: string;
    registrar_name?: string;
  };
  summary?: {
    total_subjects: number;
    total_units: number;
    subjects_scheduled?: number;
    subjects_pending?: number;
    total_weekly_hours?: number;
    sessions?: number;
  };
  subjects: RegistrationSubject[];
  schedule?: RegistrationScheduleItem[];
  student_id?: string;
  student_name?: string;
  program_name?: string;
  program_code?: string;
  year_level?: number;
  section?: string;
  academic_status?: string;
  school_year?: string;
  semester?: string;
  total_units?: number;
};
