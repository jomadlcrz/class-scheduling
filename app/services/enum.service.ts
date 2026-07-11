import { apiGet } from "~/lib/api";

/**
 * Backend enum values (app/enums.py), fetched instead of duplicated in the
 * frontend — a pure pass-through of the options endpoint.
 */

export type EnumOptions = {
  gender: string[];
  civilStatus: string[];
  roleName: string[];
  studentType: string[];
  academicStatus: string[];
};

type EnumOptionsResponse = {
  gender: string[];
  civil_status: string[];
  role_name: string[];
  student_type: string[];
  academic_status: string[];
};

// Static per deploy, so one fetch serves the whole session.
let cached: Promise<EnumOptions> | null = null;

function getOptions(): Promise<EnumOptions> {
  cached ??= apiGet<EnumOptionsResponse>("/enums")
    .then((data) => ({
      gender: data.gender,
      civilStatus: data.civil_status,
      roleName: data.role_name,
      studentType: data.student_type,
      academicStatus: data.academic_status,
    }))
    .catch((err) => {
      cached = null; // allow a retry on the next call
      throw err;
    });
  return cached;
}

export const enumService = {
  getOptions,
};
