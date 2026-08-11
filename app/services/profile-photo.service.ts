import { apiDelete, apiGet, apiUpload } from "~/lib/api";
import type { Role } from "~/types/user";
import type { AddressData } from "~/types/student";

type ProfileEndpointMap = {
  base: string;
  address: string | null;
};

const ENDPOINTS: Record<Role, ProfileEndpointMap> = {
  admin: { base: "/super-admin/profile-photo", address: null },
  registrar: { base: "/registrar/profile-photo", address: "/registrar/me/address" },
  dean: { base: "/deans/profile-photo", address: "/deans/me/address" },
  faculty: { base: "/instructors/profile-photo", address: "/instructors/me/address" },
  student: { base: "/students/me/profile-photo", address: "/students/me/address" },
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

async function getPhoto(role: Role): Promise<ProfilePhotoData> {
  const raw = await apiGet<RawPhotoData>(endpoint(role));
  return toProfilePhotoData(raw);
}

async function uploadPhoto(role: Role, file: File): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append("photo", file);
  const data = await apiUpload<{ message?: string; profile_photo_url: string }>(
    endpoint(role),
    formData,
  );
  return { url: data.profile_photo_url, message: data.message ?? "" };
}

async function removePhoto(role: Role): Promise<string> {
  const data = await apiDelete<{ message?: string }>(endpoint(role));
  return data.message ?? "";
}

async function getAddress(role: Role): Promise<AddressData | null> {
  const addr = ENDPOINTS[role].address;
  if (!addr) return null;
  const raw = await apiGet<{ address: AddressData | null }>(addr);
  return raw.address ?? null;
}

export const profilePhotoService = { getPhoto, uploadPhoto, removePhoto, getAddress };
