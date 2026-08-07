import { Fragment, useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { DepartmentInstructor } from "~/services/dean.service";
import { formatInstructorName } from "~/lib/faculty-load";

type Subject = {
  curriculumDetailId?: number;
  subjectId?: number;
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
  lecHours: number;
  labHours: number;
  weeklyHours: number;
  yearLevel?: number;
  semesterCategory?: number;
};

type SubjectGroup = {
  yearLevel: number;
  semesterCategory: number;
  subjects: Subject[];
};

const semesterLabel = (semester: number) => {
  if (semester === 1) return "1st Semester";
  if (semester === 2) return "2nd Semester";
  if (semester === 3) return "Summer";
  return `Semester ${semester}`;
};

export type AddInstructorModalProps = {
  open: boolean;
  onClose: () => void;
  availableInstructors: DepartmentInstructor[];
  onAdd: (instructor: DepartmentInstructor) => void;
};

export function AddInstructorModal({ open, onClose, availableInstructors, onAdd }: AddInstructorModalProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) {
      setValue("");
    }
  }, [open]);

  const selectedInstructor = value
    ? availableInstructors.find((inst) => `${inst.firstName}|${inst.lastName}` === value)
    : undefined;

  const handleAdd = () => {
    if (!selectedInstructor) return;
    onAdd(selectedInstructor);
    setValue("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Existing Instructor">
      <div className="space-y-4 font-body text-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Instructor
          </label>
          {availableInstructors.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              No available instructors to add
            </div>
          ) : (
            <Select
              items={availableInstructors.map((inst) => ({
                value: `${inst.firstName}|${inst.lastName}`,
                label: formatInstructorName(inst),
              }))}
              value={value}
              onValueChange={(v) => setValue(v ?? "")}
            >
              <SelectTrigger id="add-instructor">
                <SelectValue placeholder="Choose an instructor..." />
              </SelectTrigger>
              <SelectContent>
                {availableInstructors.map((inst) => (
                  <SelectItem key={`${inst.firstName}|${inst.lastName}`} value={`${inst.firstName}|${inst.lastName}`}>
                    <span className="font-semibold">{formatInstructorName(inst)}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">{inst.department}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" block={false} disabled={!selectedInstructor} onClick={handleAdd}>
            Add Instructor
          </Button>
        </div>
      </div>
    </Modal>
  );
}

type ProgramOption = { abbrev: string; name: string };

export type AddProgramModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (abbrev: string, name: string) => void;
  programOptions: ProgramOption[];
};

export function AddProgramModal({ open, onClose, onAdd, programOptions }: AddProgramModalProps) {
  const [value, setValue] = useState("");

  const selected = programOptions.find((p) => p.abbrev === value);

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected.abbrev, selected.name);
    setValue("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Existing Program">
      <div className="space-y-4 font-body text-sm">
        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Select Program
        </label>
        <Select
          items={programOptions.map((p) => ({ value: p.abbrev, label: `${p.abbrev} — ${p.name}` }))}
          value={value}
          onValueChange={(v) => setValue(v ?? "")}
        >
          <SelectTrigger id="add-program">
            <SelectValue placeholder="Choose a program..." />
          </SelectTrigger>
          <SelectContent>
            {programOptions.map((prog) => (
              <SelectItem key={prog.abbrev} value={prog.abbrev}>
                <span className="font-semibold">{prog.abbrev}</span>
                <span className="ml-2 text-slate-500 dark:text-slate-400">{prog.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" block={false} disabled={!value} onClick={handleAdd}>
            Add Program
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export type AssignSubjectModalProps = {
  open: boolean;
  availableSubjects: Subject[];
  assignedSubjectCodes: Set<string>;
  instructorName?: string;
  onClose: () => void;
  onAssign: (subjectCodes: string[]) => void;
};

export function AssignSubjectModal({
  open,
  availableSubjects,
  assignedSubjectCodes,
  instructorName,
  onClose,
  onAssign,
}: AssignSubjectModalProps) {
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedCodes(new Set());
      setSearch("");
    }
  }, [open]);

  const toggle = (code: string) => {
    if (assignedSubjectCodes.has(code)) return;
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleAssign = () => {
    if (selectedCodes.size === 0) return;
    onAssign(Array.from(selectedCodes));
    setSelectedCodes(new Set());
    setSearch("");
    onClose();
  };

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return availableSubjects.filter(
      (subject) =>
        !normalizedSearch ||
        subject.subjectCode.toLowerCase().includes(normalizedSearch) ||
        subject.descriptiveTitle.toLowerCase().includes(normalizedSearch),
    );
  }, [availableSubjects, search]);

  const groupedSubjects = useMemo(() => {
    const groups = new Map<string, SubjectGroup>();

    for (const subject of filtered) {
      const yearLevel = subject.yearLevel ?? 0;
      const semesterCategory = subject.semesterCategory ?? 0;
      const key = `${yearLevel}-${semesterCategory}`;
      const group = groups.get(key) ?? { yearLevel, semesterCategory, subjects: [] };
      group.subjects.push(subject);
      groups.set(key, group);
    }

    return Array.from(groups.values())
      .sort((a, b) => a.yearLevel - b.yearLevel || a.semesterCategory - b.semesterCategory)
      .map((group) => ({
        ...group,
        subjects: group.subjects.sort(
          (a, b) =>
            (b.curriculumDetailId ?? b.subjectId ?? 0) - (a.curriculumDetailId ?? a.subjectId ?? 0),
        ),
      }));
  }, [filtered]);

  const selectable = filtered.filter((s) => !assignedSubjectCodes.has(s.subjectCode));
  const allChecked = selectable.length > 0 && selectable.every((s) => selectedCodes.has(s.subjectCode));
  const toggleAll = () => {
    if (allChecked) {
      setSelectedCodes((prev) => {
        const next = new Set(prev);
        for (const s of selectable) next.delete(s.subjectCode);
        return next;
      });
    } else {
      setSelectedCodes((prev) => {
        const next = new Set(prev);
        for (const s of selectable) next.add(s.subjectCode);
        return next;
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={instructorName ? `Assign Existing Subject — ${instructorName}` : "Assign Existing Subject"} wide>
      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or title…"
          className={inputClassName}
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Grouped by year level and semester. Recently added subjects appear first in each section.
        </p>
      </div>
      <div className="scrollbar-thin max-h-80 overflow-auto rounded-xl border border-slate-300 bg-white pr-1 dark:border-white/10 dark:bg-white/5">
        <table className="w-full table-fixed border-separate border-spacing-0 text-left font-body text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 w-10 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 align-middle text-xs font-bold uppercase leading-none tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400">
                <Checkbox
                  id="select-all"
                  label=""
                  ariaLabel="Select all"
                  checked={allChecked}
                  onChange={toggleAll}
                />
              </th>
              <th className="sticky top-0 z-10 w-24 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 align-middle text-xs font-bold uppercase leading-none tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400">
                Code
              </th>
              <th className="sticky top-0 z-10 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 align-middle text-xs font-bold uppercase leading-none tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400">
                Descriptive Title
              </th>
              <th className="sticky top-0 z-10 w-16 border-b-2 border-slate-300 bg-slate-50 px-3 py-2 align-middle text-right text-xs font-bold uppercase leading-none tracking-wider text-slate-500 dark:border-white/10 dark:bg-surface-raised dark:text-slate-400">
                Units
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">
                  No subjects match your search.
                </td>
              </tr>
            ) : (
              groupedSubjects.map((group) => (
                <Fragment key={`${group.yearLevel}-${group.semesterCategory}`}>
                  <tr>
                    <th
                      colSpan={4}
                      className="border-b border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-transparent"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <span
                          aria-hidden
                          className="h-px min-w-8 flex-1 bg-linear-to-r from-transparent to-slate-300 dark:to-white/15"
                        />
                        <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-navy-200/70 bg-navy-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-navy-800 dark:border-navy-700/50 dark:bg-navy-900/40 dark:text-slate-200">
                          <span>
                            {group.yearLevel > 0 ? `Year Level ${group.yearLevel}` : "Other"}
                            {group.semesterCategory > 0 ? ` · ${semesterLabel(group.semesterCategory)}` : ""}
                          </span>
                          <span className="font-medium normal-case tracking-normal text-slate-500 dark:text-slate-400">
                            ({group.subjects.length} subject{group.subjects.length !== 1 ? "s" : ""})
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className="h-px min-w-8 flex-1 bg-linear-to-l from-transparent to-slate-300 dark:to-white/15"
                        />
                      </div>
                    </th>
                  </tr>
                  {group.subjects.map((s) => {
                    const isAssigned = assignedSubjectCodes.has(s.subjectCode);
                    return (
                      <tr
                        key={s.curriculumDetailId ?? s.subjectCode}
                        className={`transition-colors duration-150 ${
                          isAssigned
                            ? "opacity-50"
                            : "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                        onClick={() => toggle(s.subjectCode)}
                      >
                        <td className="w-10 px-3 py-2 align-middle leading-none text-gray-700 dark:text-slate-300">
                          {isAssigned ? (
                            <Checkbox
                              id={`subj-${s.subjectCode}`}
                              label=""
                              ariaLabel={`${s.subjectCode} already assigned`}
                              checked
                              onChange={() => {}}
                            />
                          ) : (
                            <Checkbox
                              id={`subj-${s.subjectCode}`}
                              label=""
                              ariaLabel={`Select ${s.subjectCode}`}
                              checked={selectedCodes.has(s.subjectCode)}
                              onChange={() => {}}
                            />
                          )}
                        </td>
                        <td className="w-24 px-3 py-2 align-middle leading-none font-semibold text-navy-800 dark:text-white">
                          {s.subjectCode}
                        </td>
                        <td className="px-3 py-2 align-middle leading-none text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-2">
                            {s.descriptiveTitle}
                            {isAssigned && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                Assigned
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="w-16 px-3 py-2 align-middle text-right leading-none text-slate-400 dark:text-slate-500">
                          {s.units}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" block={false} onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" block={false} disabled={selectedCodes.size === 0} onClick={handleAssign}>
          Assign ({selectedCodes.size}) Subject{selectedCodes.size !== 1 ? "s" : ""}
        </Button>
      </div>
    </Modal>
  );
}
