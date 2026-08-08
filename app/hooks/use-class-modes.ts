import { enumService } from "~/services/enum.service";
import { useCachedData } from "~/hooks/use-cached-data";

type useClassModesResult = {
  classModes: string[];
  loading: boolean;
};

export function useClassModes(): useClassModesResult {
  // Derived from the shared enums cache so revisits/reloads skip the loading state.
  const { data } = useCachedData("enums", () => enumService.getOptions());
  return { classModes: data?.classMode ?? [], loading: data === null };
}
