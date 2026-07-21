import { apiGet } from "~/lib/api";
import type { RegularStudentRow } from "~/types/student";

/** Regular students and their academic records (registrar_admin students module). */

type RegularStudentsResponse = {
  student_profile_id: number;
  student_id: string | null;
  first_name: string;
  mid_name: string | null;
  last_name: string;
  mobile: string | null;
  email: string | null;
  account_status: string;
  academics: {
    student_academic_id: number;
    year_level: number;
    program: string;
    set: string | null;
    enrolled_status: string;
    student_type: string;
    school_year: string | null;
    semester: string | null;
    enrolled_subjects: {
      subject_id: number;
      subject_code: string;
      descriptive_title: string;
      units: number;
    }[];
  }[];
}[];

/** GET /students/regular — students flagged AcademicStatus.REGULAR, optionally scoped to a term. */
async function listStudents(params?: { syId?: number; semId?: number }): Promise<RegularStudentRow[]> {
  const query = new URLSearchParams();
  if (params?.syId) query.set("sy_id", String(params.syId));
  if (params?.semId) query.set("sem_id", String(params.semId));
  const suffix = query.toString() ? `?${query}` : "";

  const data = await apiGet<RegularStudentsResponse>(`/students/regular${suffix}`);
  return data.map((s) => ({
    studentProfileId: s.student_profile_id,
    studentId: s.student_id,
    firstName: s.first_name,
    midName: s.mid_name,
    lastName: s.last_name,
    mobile: s.mobile,
    email: s.email,
    accountStatus: s.account_status,
    academics: s.academics.map((a) => ({
      studentAcademicId: a.student_academic_id,
      yearLevel: a.year_level,
      program: a.program,
      set: a.set,
      enrolledStatus: a.enrolled_status,
      studentType: a.student_type,
      schoolYear: a.school_year,
      semester: a.semester,
      enrolledSubjects: a.enrolled_subjects.map((es) => ({
        subjectId: es.subject_id,
        subjectCode: es.subject_code,
        descriptiveTitle: es.descriptive_title,
        units: es.units,
      })),
    })),
  }));
}

export const regularClassService = { listStudents };
