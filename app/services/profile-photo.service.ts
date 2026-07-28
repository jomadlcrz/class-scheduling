import { apiDelete, apiGet, apiUpload } from "~/lib/api";
import type { Role } from "~/types/user";

type PhotoEndpoint = {
  base: string;
};

const ENDPOINTS: Record<Role, PhotoEndpoint> = {
  admin: { base: "/super-admin/profile-photo" },
  registrar: { base: "/registrar/profile-photo" },
  dean: { base: "/deans/profile-photo" },
  faculty: { base: "/instructors/profile-photo" },
  student: { base: "/students/me/profile-photo" },
};

/** Raw snake_case shape returned by the backend's serialize_photo(). */
type RawPhotoData = {
  profile_id: number;
  first_name: string | null;
  mid_name: string | null;
  last_name: string | null;
  profile_photo_url: string | null;
  has_photo: boolean;
};

export type ProfilePhotoData = {
  profileId: number;
  firstName: string | null;
  midName: string | null;
  lastName: string | null;
  profilePhotoUrl: string | null;
  hasPhoto: boolean;
};

function toProfilePhotoData(raw: RawPhotoData): ProfilePhotoData {
  return {
    profileId: raw.profile_id,
    firstName: raw.first_name,
    midName: raw.mid_name,
    lastName: raw.last_name,
    profilePhotoUrl: raw.profile_photo_url,
    hasPhoto: raw.has_photo,
  };
}

function endpoint(role: Role): string {
  return ENDPOINTS[role].base;
}

export async function getPhoto(role: Role): Promise<ProfilePhotoData> {
  const raw = await apiGet<RawPhotoData>(endpoint(role));
  return toProfilePhotoData(raw);
}

export async function uploadPhoto(role: Role, file: File): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append("photo", file);
  const data = await apiUpload<{ message?: string; profile_photo_url: string }>(
    endpoint(role),
    formData,
  );
  return { url: data.profile_photo_url, message: data.message ?? "" };
}

export async function removePhoto(role: Role): Promise<string> {
  const data = await apiDelete<{ message?: string }>(endpoint(role));
  return data.message ?? "";
}

export const profilePhotoService = { getPhoto, uploadPhoto, removePhoto };
