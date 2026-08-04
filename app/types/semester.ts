export type Semester = {
  id: number;
  semester: string;
  semesterNumber: number;
  displayName?: string;
  status?: string;
  canEdit?: boolean;
};

/** POST /semesters body — matches backend SemesterSchema (camelCase keys). */
export type SemesterWritePayload = {
  semesterNumber: 1 | 2;
  semesterName: string;
};

export type CreateSemesterInput = SemesterWritePayload;
