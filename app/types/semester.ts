export type Semester = {
  id: number;
  semester: string;
  semesterNumber: number;
  displayName?: string;
  description?: string | null;
  status?: string;
  canEdit?: boolean;
};

/** POST /semesters body — matches backend SemesterSchema (camelCase keys). */
export type SemesterWritePayload = {
  semester: string;
  semesterNumber: 1 | 2;
  semesterName: string;
};

export type CreateSemesterInput = SemesterWritePayload;
