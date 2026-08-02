import { apiMessage, apiPost } from "~/lib/api";
import type { CreateFacilitiesInput } from "~/types/facility";

/** POST /create-facilities — atomically creates one building and all nested rooms. */
async function create(input: CreateFacilitiesInput): Promise<string> {
  const data = await apiPost<{ message?: string }>("/create-facilities", input);
  return apiMessage(data);
}

export const facilityService = { create };
