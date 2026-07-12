import { useEffect, useState } from "react";
import { enumService } from "~/services/enum.service";

type useClassModesResult = {
  classModes: string[];
  loading: boolean;
};

export function useClassModes(): useClassModesResult {
  const [classModes, setClassModes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enumService
      .getOptions()
      .then((opts) => setClassModes(opts.classMode ?? []))
      .catch(() => setClassModes([]))
      .finally(() => setLoading(false));
  }, []);

  return { classModes, loading };
}
