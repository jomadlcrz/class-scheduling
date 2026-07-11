import { useEffect, useState } from "react";
import { RoleGuard } from "~/auth/role-guard";
import { EmptyState } from "~/components/ui/empty-state";
import { PrinterIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { ResultState } from "~/components/feedback/result-state";
import { Tooltip } from "~/components/ui/tooltip";
import { CurriculumForm } from "~/features/curriculum/curriculum-form";
import { CurriculumHeader } from "~/features/curriculum/curriculum-header";
import { CurriculumTable } from "~/features/curriculum/curriculum-table";
import { openCurriculumPrint } from "~/features/curriculum/print-curriculum";
import { PageHeader } from "~/layouts/page-header";
import { curriculumService } from "~/services/curriculum.service";
import type { ProgramCurriculum } from "~/types/curriculum";
import type { Program } from "~/types/program";

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
  const [search, setSearch] = useState("");

  // useEffect(() => {
  //   curriculumService.listPrograms().then((list) => {
  //     setPrograms(list);
  //     if (list.length > 0) setSelectedCode(list[0].code);
  //   });
  // }, []);

  // useEffect(() => {
  //   if (!selectedCode) {
  //     setCurriculum(null);
  //     return;
  //   }
  //   setCurriculum("loading");
  //   curriculumService.getByProgram(selectedCode).then(setCurriculum);
  // }, [selectedCode]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Curriculum"
        description="Subjects assigned to each program by year level and semester."
        actions={
          selectedCode ? <CurriculumForm programCode={selectedCode} /> : undefined
        }
      />

      <div className="mt-6 flex flex-col gap-5">
        <CurriculumHeader
          programs={programs ?? []}
          selected={selectedCode}
          onChange={setSelectedCode}
          curriculum={curriculum}
        />

        <ResultState tone="error" title="Not available">
          This feature is not connected to the backend yet.
        </ResultState>
      </div>
    </div>
  );
}
