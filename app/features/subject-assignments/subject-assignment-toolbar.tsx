import { SearchIcon } from "~/components/ui/icons";
import { Card } from "~/components/ui/card";
import { FieldChrome, inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { Department } from "~/types/department";
import type { SchoolYearOption } from "~/services/school-year.service";
import type { Semester } from "~/types/semester";

type SubjectAssignmentToolbarProps = {
  departments?: Department[];
  selectedDepartmentId?: string;
  onDepartmentChange?: (value: string) => void;
  schoolYears: SchoolYearOption[];
  selectedSchoolYearId: string;
  onSchoolYearChange: (value: string) => void;
  semesters: Semester[];
  selectedSemesterNumber: string;
  semesterLabel: (semesterNumber: number) => string;
  onSemesterChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export function SubjectAssignmentToolbar({
  departments,
  selectedDepartmentId,
  onDepartmentChange,
  schoolYears,
  selectedSchoolYearId,
  onSchoolYearChange,
  semesters,
  selectedSemesterNumber,
  semesterLabel,
  onSemesterChange,
  search,
  onSearchChange,
}: SubjectAssignmentToolbarProps) {
  const academicSemesters = semesters.filter((semester) => semester.semesterNumber !== 3);
  const showDepartments = Boolean(departments && departments.length > 0 && onDepartmentChange);

  return (
    <Card
      className={`mt-4 grid gap-3 p-3 sm:gap-4 sm:p-4 sm:grid-cols-2 ${
        showDepartments
          ? "lg:grid-cols-[minmax(13rem,1fr)_minmax(10rem,.8fr)_minmax(10rem,.8fr)_minmax(14rem,1.2fr)]"
          : "lg:grid-cols-[minmax(11rem,.8fr)_minmax(11rem,.8fr)_minmax(17rem,1.5fr)]"
      }`}
    >
      {showDepartments && (
        <FieldChrome id="subject-assignment-department" label="Department">
          <Select
            items={(departments ?? []).map((dept) => ({
              value: String(dept.id),
              label: `${dept.abbrev} — ${dept.name}`,
            }))}
            value={selectedDepartmentId ?? ""}
            onValueChange={(value) => onDepartmentChange?.(value ?? "")}
          >
            <SelectTrigger id="subject-assignment-department">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {(departments ?? []).map((dept) => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {dept.abbrev} — {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
      )}

      <FieldChrome id="subject-assignment-school-year" label="School Year">
        <Select
          items={schoolYears.map((year) => ({ value: String(year.id), label: year.schoolYear }))}
          value={selectedSchoolYearId}
          onValueChange={(value) => onSchoolYearChange(value ?? "")}
        >
          <SelectTrigger id="subject-assignment-school-year">
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

      <FieldChrome id="subject-assignment-semester" label="Semester">
        <Select
          items={academicSemesters.map((semester) => ({
            value: String(semester.semesterNumber),
            label: semesterLabel(semester.semesterNumber),
          }))}
          value={selectedSemesterNumber}
          onValueChange={(value) => onSemesterChange(value ?? "")}
        >
          <SelectTrigger id="subject-assignment-semester">
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

      <div className={showDepartments ? "" : "sm:col-span-2 lg:col-span-1"}>
        <FieldChrome id="subject-assignment-search" label="Search">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
              <SearchIcon size={18} />
            </span>
            <input
              id="subject-assignment-search"
              type="search"
              placeholder="Search subjects, programs, or instructors"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className={`${inputClassName} pl-10`}
            />
          </div>
        </FieldChrome>
      </div>
    </Card>
  );
}
