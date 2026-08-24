import { enumService } from "~/services/enum.service";
import { useCachedData } from "~/hooks/use-cached-data";

type UseSessionModesResult = {
  sessionModes: string[];
  loading: boolean;
};

/** Allowed session identities, supplied by the backend's GET /enums endpoint. */
export function useSessionModes(): UseSessionModesResult {
  const { data } = useCachedData("enums", () => enumService.getOptions());
  return { sessionModes: data?.sessionMode ?? [], loading: data === null };
}
