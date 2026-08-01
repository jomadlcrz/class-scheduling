import type { BadgeTone } from "~/components/ui/badge";

export type YearLevel = number;

export type Semester = number;

/**
 * Subject type vocabulary lives in the backend (app/enums.py SubjectTypeName)
 * and is fetched via enumService — only display tones are mapped here, by value.
 * Keep the keys in sync with mapping-model.ts SUBJECT_TYPES.
 */
export const SUBJECT_TYPE_TONES: Record<string, BadgeTone> = {
  "GenEd Core": "violet",
  "GenEd Elective": "sky",
  "Mandated Rizal": "gold",
  "Major with Lab": "slate",
  "Major without Lab": "green",
  "Physical Education": "pink",
  "National Service Training Program": "red",
  "Research/Thesis": "navy",
};

/** Display labels matching classroom-mapping TYPE_LABELS. */
export const SUBJECT_TYPE_LABELS: Record<string, string> = {
  "GenEd Core": "GenEd Core",
  "GenEd Elective": "GenEd Elective",
  "Mandated Rizal": "Mandated Rizal",
  "Major with Lab": "Major (Lab)",
  "Major without Lab": "Major (w/o Lab)",
  "Physical Education": "PE",
  "National Service Training Program": "NSTP",
  "Research/Thesis": "Research/Thesis",
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

/** Shape of GET /subjects/:id/delete-preview and the DELETE /subjects/:id payload.
 * A subject can sit on more than one program's curriculum, so every list here
 * spans ALL programs that use it. Nothing data-driven blocks the delete. */
export type SubjectDeletePreview = {
  subject: {
    subject_id: number;
    subject_code: string;
    descriptive_title: string;
  };
  will_delete: {
    /** Every program whose curriculum this subject sits on. */
    programs: string[];
    curriculum_links: number;
    /** Instructor subject assignments for this subject, hard-deleted per program. */
    faculty_assignments: { instructor_name: string; program_abbrev: string }[];
    /** Only this subject's own schedule sessions are cleared; the rest of each set's schedule is untouched. */
    regular_schedules: number;
    /** Irregular students' enrolled-subject rows naming this subject, hard-deleted. */
    enrolled_subjects: number;
    /** Prerequisite rows naming this subject in either direction, hard-deleted. */
    prerequisite_links: number;
  };
};
