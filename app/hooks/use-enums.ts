import { enumService, type EnumOptions } from "~/services/enum.service";
import { useCachedData } from "~/hooks/use-cached-data";

type UseEnumsResult = {
  enums: EnumOptions | null;
  loading: boolean;
};

/**
 * Hook to consume the full backend Enums dictionary (GET /enums)
 * cached across the application session.
 */
export function useEnums(): UseEnumsResult {
  const { data } = useCachedData("enums", () => enumService.getOptions());
  return { enums: data ?? null, loading: data === null };
}
