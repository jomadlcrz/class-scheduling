import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { useCachedData } from "~/hooks/use-cached-data";
import { peekCache } from "~/lib/data-cache";
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

export type TermOption = { id: number; schoolYear: string };
export type SemOption = { id: number; semester: string; semesterNumber: number };

/** Loads school years + semesters, defaults to the current term, then fetches
 * the given analytics payload whenever the term selectors change. Term lists and
 * the per-term payload are cached (keyed by `cacheKey` + term), so revisiting a
 * dashboard or reloading the page shows it instantly and revalidates in the
 * background. `loading` covers the cold state; `refreshing` the background one. */
export function useTermData<T>(
  cacheKey: string,
  fetch: (syId: number, semesterNumber: number) => Promise<T>,
) {
  // Seed the default term synchronously from the cached lists so a cached
  // dashboard renders data on first paint instead of flashing the skeleton.
  const [syId, setSyId] = useState<number>(
    () => peekCache<TermOption[]>("school-years")?.at(0)?.id ?? 0,
  );
  const [semesterNumber, setSemesterNumber] = useState<number>(() => {
    const cachedSems = peekCache<SemOption[]>("semesters");
    const first = cachedSems?.find((s) => s.semesterNumber !== 3) ?? cachedSems?.at(0);
    return first?.semesterNumber ?? 0;
  });

  const { data: yearsData } = useCachedData("school-years", () => schoolYearService.list());
  const { data: semsData } = useCachedData("semesters", () => semesterService.list());
  const years: TermOption[] = useMemo(() => yearsData ?? [], [yearsData]);
  const sems: SemOption[] = useMemo(() => semsData ?? [], [semsData]);

  // Default the term selectors once the lists load (cold case).
  useEffect(() => {
    if (syId || years.length === 0) return;
    const current = years.at(0);
    if (current) setSyId(current.id);
  }, [years, syId]);
  useEffect(() => {
    if (semesterNumber || sems.length === 0) return;
    const first = sems.find((s) => s.semesterNumber !== 3) ?? sems.at(0);
    if (first) setSemesterNumber(first.semesterNumber);
  }, [sems, semesterNumber]);

  const termReady = Boolean(syId && semesterNumber);
  const dataKey = `${cacheKey}:${syId || "none"}:${semesterNumber || "none"}`;
  const { data, error, isValidating } = useCachedData(
    dataKey,
    () => fetch(syId, semesterNumber),
    { enabled: termReady },
  );

  const loading = !termReady || (data === null && !error);
  const refreshing = isValidating && data !== null;

  return { data, syId, semesterNumber, setSyId, setSemesterNumber, loading, error, refreshing, years, sems };
}

export function TermSelectors({
  years,
  sems,
  syId,
  semesterNumber,
  onSyId,
  onSemesterNumber,
}: {
  years: TermOption[];
  sems: SemOption[];
  syId: number;
  semesterNumber: number;
  onSyId: (id: number) => void;
  onSemesterNumber: (semesterNumber: number) => void;
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
          items={sems.map((s) => ({ value: String(s.semesterNumber), label: s.semester }))}
          value={semesterNumber ? String(semesterNumber) : ""}
          onValueChange={(v) => {
            if (v) onSemesterNumber(Number(v));
          }}
        >
          <SelectTrigger id="dashboard-sem">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            {sems.map((s) => (
              <SelectItem key={s.semesterNumber} value={String(s.semesterNumber)}>
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
