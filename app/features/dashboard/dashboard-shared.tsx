import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { schoolYearService } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const staggerSections = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export const staggerWidgets = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const fadeSlideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const popCard = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

export function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export type TermOption = { id: number; schoolYear: string };
export type SemOption = { id: number; semester: string; semesterNumber: number };

/** Loads school years + semesters, defaults to the current term, then fetches
 * the given analytics payload whenever the term selectors change. The fetch
 * callback may be recreated every render; a ref keeps the latest while the
 * effect only watches the selected term. */
export function useTermData<T>(fetch: (syId: number, semId: number) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [syId, setSyId] = useState<number>(0);
  const [semId, setSemId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [years, setYears] = useState<TermOption[]>([]);
  const [sems, setSems] = useState<SemOption[]>([]);

  const fetchRef = useRef(fetch);
  const dataRef = useRef<T | null>(null);
  fetchRef.current = fetch;

  const fetchTerms = useCallback(async () => {
    try {
      const [y, s] = await Promise.all([
        schoolYearService.list(),
        semesterService.list(),
      ]);
      setYears(y);
      setSems(s);
      const current = y.at(0);
      const first = s.find((sem) => sem.semesterNumber !== 3) ?? s.at(0);
      if (current) setSyId(current.id);
      if (first) setSemId(first.id);
    } catch {
      setYears([]);
      setSems([]);
    }
  }, []);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  useEffect(() => {
    if (!syId || !semId) return;
    let cancelled = false;
    const isInitial = !dataRef.current;
    if (!isInitial) setRefreshing(true);
    if (isInitial) setLoading(true);
    setError(null);
    fetchRef
      .current(syId, semId)
      .then((d) => {
        if (!cancelled) {
          dataRef.current = d;
          setData(d);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [syId, semId]);

  return { data, syId, semId, setSyId, setSemId, loading, error, refreshing, years, sems };
}

export function TermSelectors({
  years,
  sems,
  syId,
  semId,
  onSyId,
  onSemId,
}: {
  years: TermOption[];
  sems: SemOption[];
  syId: number;
  semId: number;
  onSyId: (id: number) => void;
  onSemId: (id: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="flex shrink-0 gap-3"
    >
      <div className="w-44">
        <Select
          items={years.map((y) => ({ value: String(y.id), label: y.schoolYear }))}
          value={syId ? String(syId) : ""}
          onValueChange={(v) => {
            if (v) onSyId(Number(v));
          }}
        >
          <SelectTrigger id="dashboard-sy">
            <SelectValue placeholder="School year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y.id} value={String(y.id)}>
                {y.schoolYear}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-44">
        <Select
          items={sems.map((s) => ({ value: String(s.id), label: s.semester }))}
          value={semId ? String(semId) : ""}
          onValueChange={(v) => {
            if (v) onSemId(Number(v));
          }}
        >
          <SelectTrigger id="dashboard-sem">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            {sems.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900">
            <Skeleton className="mb-3 h-3 w-1/3" />
            <Skeleton className="mb-2 h-8 w-1/2" />
            <Skeleton className="mb-3 h-3 w-1/4" />
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

export function UpdateIndicator({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-navy-800 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-navy-600"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="size-3 rounded-full border-2 border-white border-t-transparent"
          />
          Updating…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
