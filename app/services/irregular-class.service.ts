import { ApiError, apiGet } from "~/lib/api";

/** Irregular students and their enrolled subjects (registrar_admin schedules module). */

type IrregularStudentsResponse = {
  student_id: string;
  first_name: string;
  mid_name: string | null;
  last_name: string;
  academics: {
    program: string;
    school_year: string | null;
    semester: number | null;
  }[];
  enrolled_subjects: {
    subject_id: number;
    subject_code: string;
    descriptive_title: string;
    units: number;
  }[];
}[];

export type IrregularStudent = {
  studentId: string;
  studentName: string;
  programTaken: string;
  subjectsEnrolled: { subjectId: number; subjectCode: string; descTitle: string; units: number }[];
};

/** Picks the most recent academic record (by school year, then semester) to source the current program. */
function latestProgram(academics: IrregularStudentsResponse[number]["academics"]): string {
  if (academics.length === 0) return "—";
  const sorted = [...academics].sort(
    (a, b) =>
      (b.school_year ?? "").localeCompare(a.school_year ?? "") || (b.semester ?? 0) - (a.semester ?? 0),
  );
  return sorted[0].program;
}

/** GET /students/irregular — students flagged AcademicStatus.IRREGULAR. 404 → empty. */
async function listStudents(): Promise<IrregularStudent[]> {
  let data: IrregularStudentsResponse;
  try {
    data = await apiGet<IrregularStudentsResponse>("/students/irregular");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((s) => ({
    studentId: s.student_id,
    studentName: `${s.last_name}, ${s.first_name}`,
    programTaken: latestProgram(s.academics),
    subjectsEnrolled: s.enrolled_subjects.map((sub) => ({
      subjectId: sub.subject_id,
      subjectCode: sub.subject_code,
      descTitle: sub.descriptive_title,
      units: sub.units,
    })),
  }));
}

export const irregularClassService = { listStudents };
