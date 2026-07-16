import { ApiError, apiGet } from "~/lib/api";

/** Irregular students and their enrolled subjects (registrar_admin schedules module). */

type IrregularStudentsResponse = {
  student_id: string;
  student_name: string;
  program_taken: string;
  subjects_enrolled: {
    subject_id: number;
    subject_code: string;
    desc_title: string;
    units: number;
  }[];
}[];

export type IrregularStudent = {
  studentId: string;
  studentName: string;
  programTaken: string;
  subjectsEnrolled: { subjectId: number; subjectCode: string; descTitle: string; units: number }[];
};

/** GET /get-irregular-students — students flagged AcademicStatus.IRREGULAR. 404 → empty. */
async function listStudents(): Promise<IrregularStudent[]> {
  let data: IrregularStudentsResponse;
  try {
    data = await apiGet<IrregularStudentsResponse>("/get-irregular-students");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return data.map((s) => ({
    studentId: s.student_id,
    studentName: s.student_name,
    programTaken: s.program_taken,
    subjectsEnrolled: s.subjects_enrolled.map((sub) => ({
      subjectId: sub.subject_id,
      subjectCode: sub.subject_code,
      descTitle: sub.desc_title,
      units: sub.units,
    })),
  }));
}

export const irregularClassService = { listStudents };
