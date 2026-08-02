export type Semester = {
  id: number;
  semester: string;
  semesterNumber: number;
  displayName?: string;
  description?: string | null;
  status?: string;
  canEdit?: boolean;
};

export type CreateSemesterInput = {
  semester: string;
  semesterNumber: number;
};
