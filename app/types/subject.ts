import type { BadgeTone } from "~/components/ui/badge";

export type YearLevel = number;

export type Semester = number;

/**
 * Subject type vocabulary lives in the backend (app/enums.py SubjectTypeName)
 * and is fetched via enumService — only display tones are mapped here, by value.
 */
export const SUBJECT_TYPE_TONES: Record<string, BadgeTone> = {
  GenEd: "violet",
  "Major with Lab": "navy",
  "Major without Lab": "emerald",
};

/** A curriculum entry: a subject offered by one program at a year/semester slot. */
export type Subject = {
  id: number;
  /** Program abbrev, e.g. "BSIS". */
  program: string;
  yearLevel: YearLevel;
  semester: Semester;
  /** Catalog code, e.g. "CS 101" — unique within a program. */
  code: string;
  /** Descriptive title, e.g. "Introduction to Computing". */
  title: string;
  units: number;
  /** Backend SubjectTypeName value, e.g. "GenEd". */
  subjectType: string;
  /** Prerequisite subject codes (or standing text, e.g. "3rd year standing"). */
  prerequisites: string[];
};

export type CreateSubjectInput = Omit<Subject, "id">;

/** PUT /subjects/:id updates the subject itself; its curriculum slot is fixed. */
export type UpdateSubjectInput = {
  code: string;
  title: string;
  units: number;
  subjectType: string;
  prerequisites: string[];
};
