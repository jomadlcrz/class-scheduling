import { ApiError, apiDelete, apiGet, apiMessage, apiPatch, apiPost, apiPut, apiUpload } from "~/lib/api";
import type {
  AcademicDepartmentDetail,
  CreateDepartmentInput,
  Department,
  DepartmentDeletePreview,
  DepartmentOverview,
  OfficeStaffPayload,
  ProgramSummary,
  UpdateDepartmentInput,
} from "~/types/department";

/** Departments CRUD against the facilities module (registrar_admin). */

type DepartmentsResponse = {
  departments: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
    department_type: string;
    building_name: string;
    programs: { program_abbrev: string; program_name: string }[];
    logo_url: string | null;
  }[];
};

function mapDepartments(data: DepartmentsResponse): Department[] {
  return data.departments.map((d) => ({
    id: d.department_id,
    abbrev: d.department_abbrev,
    name: d.department_name,
    buildingName: d.building_name,
    departmentType: d.department_type,
    programs: (d.programs ?? []).map((p) => ({ abbrev: p.program_abbrev, name: p.program_name })),
    logoUrl: d.logo_url,
  }));
}

/** GET /departments — every active department, administrative offices included.
 * The backend answers an empty table with 404. */
async function list(): Promise<Department[]> {
  try {
    return mapDepartments(await apiGet<DepartmentsResponse>("/departments/"));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

/** GET /departments/academic — same shape as list(), minus administrative offices
 * (e.g. OCR, MIS) that own no programs. Use this for pickers assigning academic
 * data (like a program) to a college. */
async function listAcademic(): Promise<Department[]> {
  try {
    return mapDepartments(await apiGet<DepartmentsResponse>("/departments/academic"));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

/** POST /departments/ — create one department, with an optional logo.
 * Plain JSON when no logo is given; multipart/form-data (same camelCase fields, plus
 * a `logo` file) when one is — the backend accepts either body for this endpoint.
 * Returns the backend message. */
async function create(input: CreateDepartmentInput, logoFile?: File | null): Promise<string> {
  if (logoFile) {
    const formData = new FormData();
    formData.append("departmentAbbrev", input.abbrev);
    formData.append("departmentName", input.name);
    formData.append("buildingId", String(input.buildingId));
    if (input.departmentType !== undefined) formData.append("departmentType", input.departmentType);
    formData.append("logo", logoFile);
    const data = await apiUpload<{ message?: string }>("/departments/", formData);
    return apiMessage(data);
  }

  const data = await apiPost<{ message?: string }>("/departments/", {
    departmentAbbrev: input.abbrev,
    departmentName: input.name,
    buildingId: input.buildingId,
    ...(input.departmentType !== undefined && { departmentType: input.departmentType }),
  });
  return apiMessage(data);
}

/** PUT /departments/:id — abbrev, name, building, and type are updatable. Returns the backend message. */
async function update(id: number, input: UpdateDepartmentInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/departments/${id}`, {
    ...(input.abbrev !== undefined && { departmentAbbrev: input.abbrev }),
    ...(input.name !== undefined && { departmentName: input.name }),
    ...(input.buildingId !== undefined && { buildingId: input.buildingId }),
    ...(input.departmentType !== undefined && { departmentType: input.departmentType }),
  });
  return apiMessage(data);
}

/** POST /departments/:id/logo — replace the department logo. Field name `logo`. */
async function uploadLogo(id: number, file: File): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append("logo", file);
  const data = await apiUpload<{ message?: string; logo_url: string }>(`/departments/${id}/logo`, formData);
  return { url: data.logo_url, message: data.message ?? "" };
}

/** DELETE /departments/:id/logo — remove the current logo, if any. Returns the backend message. */
async function removeLogo(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/departments/${id}/logo`);
  return apiMessage(data);
}

/** DELETE /departments/:id — cascades through its programs after the caller echoes the department's abbreviation (uppercase-normalized). Returns the backend message. */
async function remove(id: number, confirmCode: string): Promise<string> {
  const data = await apiPatch<{ message?: string }>(`/departments/${id}/archive`, { confirm: confirmCode });
  return apiMessage(data);
}

type ProgramSummaryResponse = {
  program_id: number;
  program_abbrev: string;
  program_name: string;
  program_type: string;
  program_length: number | null;
  program_description: string | null;
};

function mapProgramSummary(p: ProgramSummaryResponse): ProgramSummary {
  return {
    id: p.program_id,
    abbrev: p.program_abbrev,
    name: p.program_name,
    programType: p.program_type,
    length: p.program_length,
    description: p.program_description,
  };
}

type DepartmentOverviewResponse = {
  department_id: number;
  department_abbrev: string;
  department_name: string;
  department_type: string;
  building_id: number | null;
  building_name: string | null;
  logo_url: string | null;
  total_programs: number;
  programs: ProgramSummaryResponse[];
};

/** GET /departments/:id/overview — detail-page header, building, and nested programs. */
async function getOverview(id: number): Promise<DepartmentOverview> {
  const d = await apiGet<DepartmentOverviewResponse>(`/departments/${id}/overview`);
  return {
    id: d.department_id,
    abbrev: d.department_abbrev,
    name: d.department_name,
    departmentType: d.department_type,
    buildingId: d.building_id,
    buildingName: d.building_name,
    logoUrl: d.logo_url,
    totalPrograms: d.total_programs,
    programs: d.programs.map(mapProgramSummary),
  };
}

type OfficeStaffResponse = {
  department_id: number;
  department_abbrev: string;
  staff: {
    key: string;
    first_name: string;
    mid_name: string | null;
    last_name: string;
    role_name: string;
    email: string | null;
    mobile: string | null;
  }[];
};

/** GET /departments/:id/office-staff — staff directory for administrative departments. */
async function getOfficeStaff(id: number): Promise<OfficeStaffPayload> {
  const d = await apiGet<OfficeStaffResponse>(`/departments/${id}/office-staff`);
  return {
    departmentId: d.department_id,
    departmentAbbrev: d.department_abbrev,
    staff: d.staff.map((m) => ({
      key: m.key,
      firstName: m.first_name,
      midName: m.mid_name,
      lastName: m.last_name,
      roleName: m.role_name,
      email: m.email,
      mobile: m.mobile,
    })),
  };
}

type AcademicDetailResponse = Omit<DepartmentOverviewResponse, "programs"> & {
  dean: {
    dean_profile_id: number;
    full_name: string;
    email: string | null;
    mobile: string | null;
  } | null;
  total_students: number;
  programs: (ProgramSummaryResponse & { total_sets: number })[];
  students: {
    student_profile_id: number;
    student_id: string;
    full_name: string;
    program_id: number;
    program_abbrev: string;
    program_name: string;
    year_level: number;
    set: string | null;
    enrolled_status: string;
    student_type: string | null;
    email: string | null;
    mobile: string | null;
  }[];
};

/** GET /departments/:id/academic-detail — dean, programs with set counts, and enrolled students. */
async function getAcademicDetail(id: number): Promise<AcademicDepartmentDetail> {
  const d = await apiGet<AcademicDetailResponse>(`/departments/${id}/academic-detail`);
  return {
    departmentId: d.department_id,
    departmentAbbrev: d.department_abbrev,
    departmentName: d.department_name,
    departmentType: d.department_type,
    buildingId: d.building_id,
    buildingName: d.building_name,
    logoUrl: d.logo_url,
    dean: d.dean
      ? {
          deanProfileId: d.dean.dean_profile_id,
          fullName: d.dean.full_name,
          email: d.dean.email,
          mobile: d.dean.mobile,
        }
      : null,
    totalPrograms: d.total_programs,
    totalStudents: d.total_students,
    programs: d.programs.map((p) => ({ ...mapProgramSummary(p), totalSets: p.total_sets })),
    students: d.students.map((s) => ({
      studentProfileId: s.student_profile_id,
      studentId: s.student_id,
      fullName: s.full_name,
      programId: s.program_id,
      programAbbrev: s.program_abbrev,
      programName: s.program_name,
      yearLevel: s.year_level,
      set: s.set,
      enrolledStatus: s.enrolled_status,
      studentType: s.student_type,
      email: s.email,
      mobile: s.mobile,
    })),
  };
}

/** GET /departments/:id/delete-preview — read-only breakdown of what the delete would affect. */
async function getDeletePreview(id: number): Promise<DepartmentDeletePreview> {
  const data = await apiGet<{
    department: DepartmentDeletePreview["department"];
    archivable: boolean;
    blockers: DepartmentDeletePreview["blockers"];
    willArchive: DepartmentDeletePreview["will_delete"];
  }>(`/departments/${id}/archive-preview`);
  return {
    department: data.department,
    deletable: data.archivable,
    blockers: data.blockers,
    will_delete: data.willArchive,
  };
}

export const departmentService = {
  list,
  listAcademic,
  create,
  update,
  uploadLogo,
  removeLogo,
  remove,
  getDeletePreview,
  getOverview,
  getOfficeStaff,
  getAcademicDetail,
};
