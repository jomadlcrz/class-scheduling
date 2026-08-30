import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Card } from "~/components/ui/card";
import { FieldChrome } from "~/components/ui/input";
import { PageHeader } from "~/layouts/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useSchoolYears } from "~/hooks/use-school-years";
import { useSemesters } from "~/hooks/use-semesters";
import { OfferingCoverageOverview, type CoverageDrillTarget } from "./offering-coverage-overview";
import { SubjectAssignmentView } from "./subject-assignment-view";

type AcademicTerm = {
  syId: number | null;
  semesterNumber: number | null;
};

function parseTerm(searchParams: URLSearchParams): { syId: number | null; semesterNumber: number | null } {
  const syId = Number(searchParams.get("sy_id"));
  const semesterNumber = Number(searchParams.get("semester_number"));
  return {
    syId: Number.isInteger(syId) && syId > 0 ? syId : null,
    semesterNumber: semesterNumber === 1 || semesterNumber === 2 ? semesterNumber : null,
  };
}

/**
 * The registrar's Subject Offering spans every department, so it is
 * overview-first: Level 1 is a college-wide coverage rollup (departments shown
 * as collapsibles, not a select), and opening a department drills into Level 2 —
 * the familiar assign view scoped to that department, reached through a
 * breadcrumb. The term picker lives here so both levels share one term.
 */
export function RegistrarSubjectOffering() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { schoolYears } = useSchoolYears();
  const { semesters, semesterLabel } = useSemesters();

  const [pageTerm, setPageTerm] = useState<AcademicTerm>(() => {
    const term = parseTerm(searchParams);
    return { syId: term.syId, semesterNumber: term.semesterNumber };
  });

  useEffect(() => {
    if (pageTerm.syId == null || pageTerm.semesterNumber == null) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get("sy_id") !== String(pageTerm.syId)) next.set("sy_id", String(pageTerm.syId));
      if (next.get("semester_number") !== String(pageTerm.semesterNumber))
        next.set("semester_number", String(pageTerm.semesterNumber));
      return next;
    });
  }, [pageTerm.syId, pageTerm.semesterNumber, setSearchParams]);

  // Adopt a term pushed into the URL by the Level 2 view, so Back lands on the
  // same term the registrar last viewed.
  useEffect(() => {
    const term = parseTerm(searchParams);
    if (term.syId == null && term.semesterNumber == null) return;
    setPageTerm((prev) =>
      prev.syId === term.syId && prev.semesterNumber === term.semesterNumber ? prev : term,
    );
  }, [searchParams]);

  const defaultTerm = useMemo(() => {
    if (pageTerm.syId != null && pageTerm.semesterNumber != null) return null;
    const current = schoolYears.find((year) => year.isCurrent) ?? schoolYears[0];
    const firstSemester =
      semesters.find((semester) => semester.semesterNumber !== 3) ?? semesters[0] ?? null;
    if (!current || !firstSemester) return null;
    return { syId: current.id, semesterNumber: firstSemester.semesterNumber };
  }, [pageTerm, schoolYears, semesters]);

  useEffect(() => {
    if (defaultTerm) setPageTerm(defaultTerm);
  }, [defaultTerm]);

  const academicSemesters = useMemo(
    () => semesters.filter((semester) => semester.semesterNumber !== 3),
    [semesters],
  );

  const selected = useMemo<CoverageDrillTarget | null>(() => {
    const id = Number(searchParams.get("department_id"));
    if (!Number.isInteger(id) || id <= 0) return null;
    return {
      id,
      name: searchParams.get("department_name")?.trim() || `Department ${id}`,
      abbrev: searchParams.get("department_abbrev")?.trim() || "",
    };
  }, [searchParams]);

  const syncTerm = (syId: number, semesterNumber: number) => {
    setPageTerm({ syId, semesterNumber });
  };

  const openDepartment = (target: CoverageDrillTarget) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("department_id", String(target.id));
      next.set("department_name", target.name);
      next.set("department_abbrev", target.abbrev);
      if (pageTerm.syId != null) next.set("sy_id", String(pageTerm.syId));
      if (pageTerm.semesterNumber != null) next.set("semester_number", String(pageTerm.semesterNumber));
      return next;
    });
  };

  // Level 2 — one department's scoped assign view, seeded with the chosen term.
  // The breadcrumb back to the overview lives inside the view, as on other routes.
  if (selected) {
    return (
      <SubjectAssignmentView
        departmentName={selected.name}
        departmentAbbrev={selected.abbrev}
        hideDepartmentSelect
        showOfferingOverview
      />
    );
  }

  // Level 1 — college-wide coverage overview.
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader title="Subject Offering" />
      <Card className="mt-4 grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4">
        <FieldChrome id="registrar-subject-offering-sy" label="School Year">
          <Select
            items={schoolYears.map((year) => ({ value: String(year.id), label: year.schoolYear }))}
            value={pageTerm.syId != null ? String(pageTerm.syId) : ""}
            onValueChange={(value) => {
              const syId = Number(value);
              if (value && Number.isInteger(syId) && syId > 0 && pageTerm.semesterNumber != null) {
                syncTerm(syId, pageTerm.semesterNumber);
              }
            }}
          >
            <SelectTrigger id="registrar-subject-offering-sy">
              <SelectValue placeholder="Select school year" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((year) => (
                <SelectItem key={year.id} value={String(year.id)}>
                  {year.schoolYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>

        <FieldChrome id="registrar-subject-offering-semester" label="Semester">
          <Select
            items={academicSemesters.map((semester) => ({
              value: String(semester.semesterNumber),
              label: semesterLabel(semester.semesterNumber),
            }))}
            value={pageTerm.semesterNumber != null ? String(pageTerm.semesterNumber) : ""}
            onValueChange={(value) => {
              const semesterNumber = Number(value);
              if (value && (semesterNumber === 1 || semesterNumber === 2) && pageTerm.syId != null) {
                syncTerm(pageTerm.syId, semesterNumber);
              }
            }}
          >
            <SelectTrigger id="registrar-subject-offering-semester">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {academicSemesters.map((semester) => (
                <SelectItem key={semester.semesterNumber} value={String(semester.semesterNumber)}>
                  {semesterLabel(semester.semesterNumber)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      </Card>

      <div className="mt-4">
        <OfferingCoverageOverview
          syId={pageTerm.syId}
          semesterNumber={pageTerm.semesterNumber}
          onDrillIn={openDepartment}
        />
      </div>
    </div>
  );
}