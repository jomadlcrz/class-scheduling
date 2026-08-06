import { apiGet } from "~/lib/api";
import { termScopeQuery } from "~/lib/term-scope";
import { semesterService } from "~/services/semester.service";
import type { RegularStudentRow } from "~/types/student";

/** Regular students and their academic records (registrar_admin students module). */

type RegularStudentsResponse = {
  student_profile_id: number;
  student_id: string | null;
  student_full_name: string;
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
    enrollment_state: string;
    school_year: string | null;
    /** EnrollmentService._serialize_enrollment sends the raw number, not a display label. */
    semester_number: number | null;
    enrolled_subjects: {
      subject_id: number;
      subject_code: string;
      descriptive_title: string;
      units: number;
    }[];
  }[];
}[];

/** GET /enrollments/regular — regular students enrolled in the selected term. */
async function listStudents(syId: number, semesterNumber: number): Promise<RegularStudentRow[]> {
  const [data, semesters] = await Promise.all([
    apiGet<RegularStudentsResponse>(`/enrollments/regular${termScopeQuery(syId, semesterNumber)}`),
    semesterService.list(),
  ]);
  const semesterLabels = new Map(
    semesters.map((semester) => [semester.semesterNumber, semester.displayName ?? semester.semester]),
  );
  return data.map((s) => ({
    studentProfileId: s.student_profile_id,
    studentId: s.student_id,
    firstName: "",
    midName: null,
    lastName: "",
    studentName: s.student_full_name,
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
      enrollmentState: a.enrollment_state,
      schoolYear: a.school_year,
      semester: a.semester_number != null ? semesterLabels.get(a.semester_number) ?? null : null,
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
