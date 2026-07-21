import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EmptyState } from "~/components/feedback/empty-state";
import { PlusIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { Spinner } from "~/components/ui/spinner";
import { SchoolYearForm } from "~/features/academic-year/school-year-form";
import { SemesterForm } from "~/features/academic-year/semester-form";
import { PageHeader } from "~/layouts/page-header";
import { schoolYearService, type SchoolYearOption } from "~/services/school-year.service";
import { semesterService } from "~/services/semester.service";
import type { CreateSemesterInput, Semester } from "~/types/semester";

export function AcademicYearPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Academic Year"
        description="Manage school years and semesters used across scheduling."
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SchoolYearsSection />
        <SemestersSection />
      </div>
    </div>
  );
}

function SchoolYearsSection() {
  const [schoolYears, setSchoolYears] = useState<SchoolYearOption[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  function refresh() {
    schoolYearService.list().then(setSchoolYears).catch(() => setSchoolYears([]));
  }

  useEffect(refresh, []);

  async function handleAdd(schoolYear: string) {
    const message = await schoolYearService.create(schoolYear);
    if (message) toast.success(message);
    refresh();
    setAddOpen(false);
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-body text-base font-semibold text-navy-700 dark:text-mist-100">
          School Years
        </h2>
        <Button type="button" block={false} onClick={() => setAddOpen(true)}>
          <PlusIcon />
          Add
        </Button>
      </div>

      {schoolYears === null ? (
        <div
          role="status"
          aria-label="Loading school years"
          className="grid place-items-center py-8 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : schoolYears.length === 0 ? (
        <EmptyState title="No school years yet">Add the first school year to get started.</EmptyState>
      ) : (
        <div className="flex flex-wrap gap-2">
          {schoolYears.map((sy) => (
            <Badge key={sy.id} tone="navy">
              {sy.schoolYear}
            </Badge>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add School Year">
        <SchoolYearForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>
    </Card>
  );
}

function SemestersSection() {
  const [semesters, setSemesters] = useState<Semester[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  function refresh() {
    semesterService.list().then(setSemesters).catch(() => setSemesters([]));
  }

  useEffect(refresh, []);

  async function handleAdd(input: CreateSemesterInput) {
    const message = await semesterService.create(input);
    if (message) toast.success(message);
    refresh();
    setAddOpen(false);
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-body text-base font-semibold text-navy-700 dark:text-mist-100">
          Semesters
        </h2>
        <Button type="button" block={false} onClick={() => setAddOpen(true)}>
          <PlusIcon />
          Add
        </Button>
      </div>

      {semesters === null ? (
        <div
          role="status"
          aria-label="Loading semesters"
          className="grid place-items-center py-8 text-navy-700 dark:text-slate-200"
        >
          <Spinner />
        </div>
      ) : semesters.length === 0 ? (
        <EmptyState title="No semesters yet">Add the first semester to get started.</EmptyState>
      ) : (
        <div className="flex flex-wrap gap-2">
          {semesters
            .slice()
            .sort((a, b) => a.semesterNumber - b.semesterNumber)
            .map((s) => (
              <Badge key={s.id} tone="navy">
                {s.semester}
              </Badge>
            ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Semester">
        <SemesterForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
      </Modal>
    </Card>
  );
}
