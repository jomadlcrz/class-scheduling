import { useEffect, useState } from "react";
import { RoleGuard } from "../../auth/role-guard";
import { EmptyState } from "../../components/ui/empty-state";
import { Spinner } from "../../components/ui/spinner";
import { CurriculumForm } from "../../features/curriculum/curriculum-form";
import { CurriculumPrograms } from "../../features/curriculum/curriculum-programs";
import { CurriculumTable } from "../../features/curriculum/curriculum-table";
import { CurriculumVersion } from "../../features/curriculum/curriculum-version";
import { PageHeader } from "../../layouts/page-header";
import { curriculumService } from "../../services/curriculum.service";
import type { ProgramCurriculum } from "../../types/curriculum";
import type { Program } from "../../types/program";

export function meta() {
  return [
    { title: "Curriculum — GWC Class Scheduling" },
    { name: "description", content: "View and manage academic program curricula." },
  ];
}

export default function CurriculumRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <CurriculumPage />
    </RoleGuard>
  );
}

function CurriculumPage() {
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [curriculum, setCurriculum] = useState<ProgramCurriculum | null | "loading">(null);

  useEffect(() => {
    curriculumService.listPrograms().then((list) => {
      setPrograms(list);
      if (list.length > 0) setSelectedCode(list[0].code);
    });
  }, []);

  useEffect(() => {
    if (!selectedCode) {
      setCurriculum(null);
      return;
    }
    setCurriculum("loading");
    curriculumService.getByProgram(selectedCode).then(setCurriculum);
  }, [selectedCode]);

  return (
    <>
      <PageHeader
        title="Curriculum"
        description="Subjects assigned to each program by year level and semester."
        actions={
          selectedCode ? <CurriculumForm programCode={selectedCode} /> : undefined
        }
      />

      <div className="mt-4 flex flex-col gap-4">
        <CurriculumPrograms
          programs={programs ?? []}
          selected={selectedCode}
          onChange={setSelectedCode}
        />

        {curriculum === "loading" ? (
          <div
            role="status"
            aria-label="Loading curriculum"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : curriculum === null ? (
          <EmptyState title="No program selected">
            Select a program above to view its curriculum.
          </EmptyState>
        ) : curriculum.groups.length === 0 ? (
          <EmptyState title="No subjects yet">
            {curriculum.programName} has no subjects in the curriculum yet. Add subjects to get started.
          </EmptyState>
        ) : (
          <>
            <CurriculumVersion curriculum={curriculum} />
            <CurriculumTable curriculum={curriculum} />
          </>
        )}
      </div>
    </>
  );
}
