import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "../../auth/role-guard";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { PlusIcon } from "../../components/ui/icons";
import { Select } from "../../components/ui/select";
import { ConfirmDialog, Modal } from "../../components/ui/modal";
import { Spinner } from "../../components/ui/spinner";
import { OfferingForm } from "../../features/subject-offerings/offering-form";
import { OfferingTable } from "../../features/subject-offerings/offering-table";
import { PageHeader } from "../../layouts/page-header";
import { academicYearService } from "../../services/academic-year.service";
import { semesterService } from "../../services/semester.service";
import { subjectOfferingService } from "../../services/subject-offering.service";
import { subjectService } from "../../services/subject.service";
import type { AcademicYear } from "../../types/academic-year";
import type { AcademicSemester } from "../../types/semester";
import type { Subject } from "../../types/subject";
import { SEMESTER_LABELS } from "../../types/subject";
import type { CreateSubjectOfferingInput, SubjectOffering } from "../../types/subject-offering";

export function meta() {
  return [
    { title: "Subject Offerings — GWC Class Scheduling" },
    { name: "description", content: "Manage subject offerings per semester." },
  ];
}

export default function SubjectOfferings() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <SubjectOfferingsPage />
    </RoleGuard>
  );
}

function SubjectOfferingsPage() {
  const [years, setYears] = useState<AcademicYear[] | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string>("");

  const [allSemesters, setAllSemesters] = useState<AcademicSemester[]>([]);
  const [selectedSemId, setSelectedSemId] = useState<string>("");

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [offerings, setOfferings] = useState<SubjectOffering[] | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubjectOffering | null>(null);

  useEffect(() => {
    Promise.all([
      academicYearService.list(),
      semesterService.list(),
      subjectService.list(),
    ]).then(([ys, sems, subjs]) => {
      const sorted = ys.sort((a, b) => b.label.localeCompare(a.label));
      setYears(sorted);
      setAllSemesters(sems);
      setAllSubjects(subjs);

      const activeYear = sorted.find((y) => y.status === "active") ?? sorted[0];
      if (activeYear) {
        setSelectedYearId(activeYear.id);
        const activeSem = sems.find(
          (s) => s.academicYearId === activeYear.id && s.status === "active",
        ) ?? sems.find((s) => s.academicYearId === activeYear.id);
        if (activeSem) setSelectedSemId(activeSem.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedSemId) {
      setOfferings([]);
      return;
    }
    setOfferings(null);
    subjectOfferingService.list(selectedSemId).then((data) => {
      setOfferings(data.sort((a, b) => a.program.localeCompare(b.program) || a.yearLevel - b.yearLevel || a.subjectCode.localeCompare(b.subjectCode)));
    });
  }, [selectedSemId]);

  const semestersForYear = useMemo(
    () =>
      allSemesters
        .filter((s) => s.academicYearId === selectedYearId)
        .sort((a, b) => a.semester - b.semester),
    [allSemesters, selectedYearId],
  );

  function handleYearChange(yearId: string) {
    setSelectedYearId(yearId);
    const firstSem = allSemesters.find((s) => s.academicYearId === yearId);
    setSelectedSemId(firstSem?.id ?? "");
  }

  const selectedSemester = useMemo(
    () => allSemesters.find((s) => s.id === selectedSemId) ?? null,
    [allSemesters, selectedSemId],
  );

  async function handleAdd(input: CreateSubjectOfferingInput) {
    const created = await subjectOfferingService.create(input);
    setOfferings((curr) =>
      [...(curr ?? []), created].sort(
        (a, b) =>
          a.program.localeCompare(b.program) ||
          a.yearLevel - b.yearLevel ||
          a.subjectCode.localeCompare(b.subjectCode),
      ),
    );
    setAddOpen(false);
  }

  async function handleDelete(target: SubjectOffering) {
    await subjectOfferingService.remove(target.id);
    setOfferings((curr) => curr!.filter((o) => o.id !== target.id));
  }

  return (
    <>
      <PageHeader
        title="Subject Offerings"
        description="Subjects offered in a given semester."
        actions={
          <Button
            type="button"
            block={false}
            onClick={() => setAddOpen(true)}
            disabled={!selectedSemester}
          >
            <PlusIcon />
            Add Offering
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            id="off-year"
            label="Academic Year"
            value={selectedYearId}
            onChange={(e) => handleYearChange(e.target.value)}
            disabled={years === null}
          >
            {(years ?? []).map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </Select>

          <Select
            id="off-semester"
            label="Semester"
            value={selectedSemId}
            onChange={(e) => setSelectedSemId(e.target.value)}
            disabled={semestersForYear.length === 0}
          >
            {semestersForYear.length === 0 ? (
              <option value="">No semesters</option>
            ) : (
              semestersForYear.map((s) => (
                <option key={s.id} value={s.id}>
                  {SEMESTER_LABELS[s.semester]}
                </option>
              ))
            )}
          </Select>
        </div>

        {/* Offerings table */}
        {offerings === null ? (
          <div className="grid place-items-center py-12 text-navy-700 dark:text-slate-200">
            <Spinner />
          </div>
        ) : offerings.length === 0 ? (
          <EmptyState title="No offerings">
            {selectedSemester
              ? `No subjects offered for ${selectedSemester.academicYearLabel} — ${SEMESTER_LABELS[selectedSemester.semester]} yet.`
              : "Select an academic year and semester to view offerings."}
          </EmptyState>
        ) : (
          <OfferingTable offerings={offerings} onDelete={(o) => setDeleteTarget(o)} />
        )}
      </div>

      {selectedSemester && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Subject Offering">
          <OfferingForm
            semester={selectedSemester}
            subjects={allSubjects}
            onSubmit={handleAdd}
            onCancel={() => setAddOpen(false)}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Remove offering"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={() => handleDelete(deleteTarget!)}
      >
        Remove{" "}
        <span className="font-medium text-navy-700 dark:text-white">
          {deleteTarget?.subjectCode} — {deleteTarget?.subjectTitle}
        </span>{" "}
        from this semester?
      </ConfirmDialog>
    </>
  );
}
