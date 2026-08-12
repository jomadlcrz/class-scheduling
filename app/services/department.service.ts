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
  total_departments: number;
  departments: {
    department_id: number;
    department_abbrev: string;
    department_name: string;
    department_type: string;
    building_id: number | null;
    building_name: string;
    description: string | null;
    programs: { program_abbrev: string; program_name: string }[];
    logo_url: string | null;
    cover_image_url: string | null;
  }[];
};

function mapDepartments(data: DepartmentsResponse): Department[] {
  return data.departments.map((d) => ({
    id: d.department_id,
    abbrev: d.department_abbrev,
    name: d.department_name,
    buildingId: d.building_id,
    buildingName: d.building_name,
    departmentType: d.department_type,
    description: d.description,
    programs: (d.programs ?? []).map((p) => ({ abbrev: p.program_abbrev, name: p.program_name })),
    logoUrl: d.logo_url,
    coverImageUrl: d.cover_image_url,
  }));
}

/** GET /departments — every active department, administrative offices included.
 *  The backend answers an empty table with 404. */
async function list(): Promise<Department[]> {
  try {
    return mapDepartments(await apiGet<DepartmentsResponse>("/departments/"));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

/** GET /departments/academic — same shape as list(), minus administrative offices
 *  (e.g. OCR, MIS) that own no programs. Use this for pickers assigning academic
 *  data (like a program) to a college. */
async function listAcademic(): Promise<Department[]> {
  try {
    return mapDepartments(await apiGet<DepartmentsResponse>("/departments/academic"));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

/** POST /departments/ — create one department, with an optional logo.
 *  Plain JSON when no logo is given; multipart/form-data (same camelCase fields, plus
 *  a `logo` file) when one is — the backend accepts either body for this endpoint.
 *  Returns the backend message. */
async function create(input: CreateDepartmentInput, logoFile?: File | null): Promise<string> {
  if (logoFile) {
    const formData = new FormData();
    formData.append("departmentAbbrev", input.abbrev);
    formData.append("departmentName", input.name);
    if (input.buildingId != null) formData.append("buildingId", String(input.buildingId));
    if (input.departmentType !== undefined) formData.append("departmentType", input.departmentType);
    if (input.description !== undefined) formData.append("description", input.description);
    formData.append("logo", logoFile);
    const data = await apiUpload<{ message?: string }>("/departments/", formData);
    return apiMessage(data);
  }

  const data = await apiPost<{ message?: string }>("/departments/", {
    departmentAbbrev: input.abbrev,
    departmentName: input.name,
    ...(input.buildingId != null && { buildingId: input.buildingId }),
    ...(input.departmentType !== undefined && { departmentType: input.departmentType }),
    ...(input.description !== undefined && { description: input.description }),
  });
  return apiMessage(data);
}

/** PUT /departments/:id — abbrev, name, building, type, and description are updatable.
 *  Returns the backend message. */
async function update(id: number, input: UpdateDepartmentInput): Promise<string> {
  const data = await apiPut<{ message?: string }>(`/departments/${id}`, {
    ...(input.abbrev !== undefined && { departmentAbbrev: input.abbrev }),
    ...(input.name !== undefined && { departmentName: input.name }),
    ...(input.buildingId !== undefined && { buildingId: input.buildingId }),
    ...(input.departmentType !== undefined && { departmentType: input.departmentType }),
    ...(input.description !== undefined && { description: input.description }),
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

/** POST /departments/:id/cover — replace the department cover image. Field name `cover`. */
async function uploadCover(
  id: number,
  file: File,
  originalFile?: File | null,
): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append("cover", file);
  if (originalFile) formData.append("coverOriginal", originalFile);
  const data = await apiUpload<{ message?: string; cover_image_url: string }>(`/departments/${id}/cover`, formData);
  return { url: data.cover_image_url, message: data.message ?? "" };
}

/** DELETE /departments/:id/cover — remove the current cover image, if any. Returns the backend message. */
async function removeCover(id: number): Promise<string> {
  const data = await apiDelete<{ message?: string }>(`/departments/${id}/cover`);
  return apiMessage(data);
}

/** DELETE /departments/:id — cascades through its programs after the caller echoes the
 *  department's abbreviation (uppercase-normalized). Returns the backend message. */
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
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  total_programs: number;
  programs: ProgramSummaryResponse[];
};

/** GET /departments/:id/overview — detail-page header, building, and nested programs. */
async function getOverview(id: number, fresh = false): Promise<DepartmentOverview> {
  const suffix = fresh ? `?refresh=${Date.now()}` : "";
  const d = await apiGet<DepartmentOverviewResponse>(`/departments/${id}/overview${suffix}`);
  return {
    id: d.department_id,
    abbrev: d.department_abbrev,
    name: d.department_name,
    departmentType: d.department_type,
    buildingId: d.building_id,
    buildingName: d.building_name,
    description: d.description,
    logoUrl: d.logo_url,
    coverImageUrl: d.cover_image_url,
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
    profile_photo_url: string | null;
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
      profilePhotoUrl: m.profile_photo_url,
    })),
  };
}

type AcademicDetailResponse = Omit<DepartmentOverviewResponse, "programs"> & {
  dean: {
    dean_profile_id: number;
    full_name: string;
    email: string | null;
    mobile: string | null;
    profile_photo_url: string | null;
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
    profile_photo_url: string | null;
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
    description: d.description,
    logoUrl: d.logo_url,
    coverImageUrl: d.cover_image_url,
    dean: d.dean
      ? {
          deanProfileId: d.dean.dean_profile_id,
          fullName: d.dean.full_name,
          email: d.dean.email,
          mobile: d.dean.mobile,
          profilePhotoUrl: d.dean.profile_photo_url,
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
      profilePhotoUrl: s.profile_photo_url,
    })),
  };
}

/** GET /departments/:id/archive-preview — read-only breakdown of what the archive would affect. */
async function getDeletePreview(id: number): Promise<DepartmentDeletePreview> {
  const data = await apiGet<{
    department: { department_id: number; department_name: string; department_abbrev: string };
    archivable: boolean;
    blockers: { staff: number };
    willArchive: { programs: { program_id: number; program_abbrev: string }[] };
  }>(`/departments/${id}/archive-preview`);
  return {
    department: {
      departmentId: data.department.department_id,
      departmentName: data.department.department_name,
      departmentAbbrev: data.department.department_abbrev,
    },
    deletable: data.archivable,
    blockers: data.blockers,
    willDelete: {
      programs: data.willArchive.programs.map((p) => ({
        programId: p.program_id,
        programAbbrev: p.program_abbrev,
      })),
    },
  };
}

export const departmentService = {
  list,
  listAcademic,
  create,
  update,
  uploadLogo,
  removeLogo,
  uploadCover,
  removeCover,
  remove,
  getDeletePreview,
  getOverview,
  getOfficeStaff,
  getAcademicDetail,
};
