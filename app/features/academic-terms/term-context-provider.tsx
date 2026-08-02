import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "~/lib/api";
import { schoolYearService } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import { termClosureService, type TermContext } from "~/services/term-closure.service";

type TermContextValue = {
  context: TermContext | null;
  loading: boolean;
  error: string | null;
  selectTerm: (syId: number, semesterNumber: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const SelectedTermContext = createContext<TermContextValue | null>(null);

async function loadFallbackContext(
  params: { syId?: number; semesterNumber?: number },
): Promise<TermContext> {
  const [schoolYears, semesters] = await Promise.all([
    schoolYearService.list(),
    semesterService.list(),
  ]);
  const current = await schoolYearService.getCurrent().catch(() => null);
  const selectedSchoolYear =
    schoolYears.find((row) => row.id === params.syId) ?? current ?? schoolYears[0] ?? null;
  const selectedSemester =
    semesters.find((row) => row.semesterNumber === params.semesterNumber) ?? semesters[0] ?? null;

  return {
    schoolYears: schoolYears.map((row) => ({ id: row.id, schoolYear: row.schoolYear })),
    semesters: semesters.map((row) => ({
      semId: row.id,
      semesterNumber: row.semesterNumber,
      label: row.displayName ?? row.semester,
    })),
    selection: {
      syId: selectedSchoolYear?.id ?? null,
      semId: selectedSemester?.id ?? null,
      semesterNumber: selectedSemester?.semesterNumber ?? null,
      schoolYear: selectedSchoolYear?.schoolYear ?? null,
    },
    term: null,
    calendar: {
      academicYearStartMonth: 0,
      currentSchoolYear: current?.schoolYear ?? null,
      currentSemesterNumber: selectedSemester?.semesterNumber ?? null,
      existsForToday: current?.existsForToday ?? null,
      expectedSchoolYear: current?.expectedSchoolYear ?? null,
    },
  };
}

/** Keeps one backend-resolved school-year/semester selection for the whole app shell. */
export function TermContextProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<TermContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef<TermContext | null>(null);

  const load = useCallback(async (params: { syId?: number; semesterNumber?: number } = {}) => {
    setLoading(true);
    setError(null);
    try {
      let next: TermContext;
      try {
        next = await termClosureService.getContext(params);
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 403) throw err;
        next = await loadFallbackContext(params);
      }
      contextRef.current = next;
      setContext(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectTerm = useCallback(
    async (syId: number, semesterNumber: number) => {
      await load({ syId, semesterNumber });
    },
    [load],
  );

  const refresh = useCallback(async () => {
    const selection = contextRef.current?.selection;
    await load({
      syId: selection?.syId ?? undefined,
      semesterNumber: selection?.semesterNumber ?? undefined,
    });
  }, [load]);

  const value = useMemo(
    () => ({ context, loading, error, selectTerm, refresh }),
    [context, loading, error, selectTerm, refresh],
  );

  return <SelectedTermContext.Provider value={value}>{children}</SelectedTermContext.Provider>;
}

export function useTermContext() {
  const value = useContext(SelectedTermContext);
  if (!value) throw new Error("useTermContext must be used inside TermContextProvider.");
  return value;
}
