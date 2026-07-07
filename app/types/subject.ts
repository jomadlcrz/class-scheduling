export const YEAR_LEVELS = [1, 2, 3, 4] as const;
export type YearLevel = (typeof YEAR_LEVELS)[number];

export const YEAR_LEVEL_LABELS: Record<YearLevel, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

export const SEMESTERS = [1, 2, 3] as const;
export type Semester = (typeof SEMESTERS)[number];

export const SEMESTER_LABELS: Record<Semester, string> = {
  1: "1st Semester",
  2: "2nd Semester",
  3: "Summer",
};

export const SUBJECT_TYPES = ["gened", "major-lab", "major", "minor"] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export const SUBJECT_TYPE_LABELS: Record<SubjectType, string> = {
  gened: "GenEd",
  "major-lab": "Major with Lab",
  major: "Major w/out Lab",
  minor: "Minors",
};

/** A curriculum entry: a subject offered by one program at a year/semester slot. */
export type Subject = {
  id: string;
  /** Program code, e.g. "BSIS". */
  program: string;
  yearLevel: YearLevel;
  semester: Semester;
  /** Catalog code, e.g. "CS 101" — unique within a program. */
  code: string;
  /** Descriptive title, e.g. "Introduction to Computing". */
  title: string;
  units: number;
  lectureHours: number;
  labHours: number;
  subjectType: SubjectType;
  /** Ids of same-program subjects that must be completed first. */
  prerequisiteIds: string[];
};

export type CreateSubjectInput = Omit<Subject, "id">;

export type UpdateSubjectInput = Partial<CreateSubjectInput>;
