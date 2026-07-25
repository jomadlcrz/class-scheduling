import { SearchIcon } from "~/components/ui/icons";
import { Card } from "~/components/ui/card";
import { FieldChrome, inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { Semester } from "~/types/semester";

type SubjectAssignmentToolbarProps = {
  schoolYears: SchoolYearOption[];
  selectedSchoolYearId: string;
  onSchoolYearChange: (value: string) => void;
  semesters: Semester[];
  selectedSemesterId: string;
  semesterLabel: (semesterNumber: number) => string;
  onSemesterChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function SubjectAssignmentToolbar({
  schoolYears,
  selectedSchoolYearId,
  onSchoolYearChange,
  semesters,
  selectedSemesterId,
  semesterLabel,
  onSemesterChange,
  search,
  onSearchChange,
}: SubjectAssignmentToolbarProps) {
  const academicSemesters = semesters.filter((semester) => semester.semesterNumber !== 3);

  return (
    <Card className="mt-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(11rem,.8fr)_minmax(11rem,.8fr)_minmax(17rem,1.5fr)]">
      <FieldChrome id="subject-assignment-school-year" label="School Year">
        <Select items={schoolYears.map((year) => ({ value: String(year.id), label: year.schoolYear }))} value={selectedSchoolYearId} onValueChange={(value) => onSchoolYearChange(value ?? "")}>
          <SelectTrigger id="subject-assignment-school-year"><SelectValue placeholder="Select school year" /></SelectTrigger>
          <SelectContent>{schoolYears.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.schoolYear}</SelectItem>)}</SelectContent>
        </Select>
      </FieldChrome>
      <FieldChrome id="subject-assignment-semester" label="Semester">
        <Select items={academicSemesters.map((semester) => ({ value: String(semester.id), label: semesterLabel(semester.semesterNumber) }))} value={selectedSemesterId} onValueChange={(value) => onSemesterChange(value ?? "")}>
          <SelectTrigger id="subject-assignment-semester"><SelectValue placeholder="Select semester" /></SelectTrigger>
          <SelectContent>{academicSemesters.map((semester) => <SelectItem key={semester.id} value={String(semester.id)}>{semesterLabel(semester.semesterNumber)}</SelectItem>)}</SelectContent>
        </Select>
      </FieldChrome>
      <FieldChrome id="subject-assignment-search" label="Search Instructor">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500"><SearchIcon size={18} /></span>
          <input id="subject-assignment-search" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search instructor name" className={`${inputClassName} pl-10`} />
        </div>
      </FieldChrome>
    </Card>
  );
}
