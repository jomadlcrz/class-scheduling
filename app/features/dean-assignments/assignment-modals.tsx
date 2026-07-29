import { useState } from "react";
import { Button } from "~/components/ui/button";
import { FieldChrome, inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

type Subject = {
  subjectCode: string;
  descriptiveTitle: string;
  units: number;
  lecHours: number;
  labHours: number;
  weeklyHours: number;
};

export type AddInstructorModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, facultyId: string) => void;
};

export function AddInstructorModal({ open, onClose, onAdd }: AddInstructorModalProps) {
  const [name, setName] = useState("");
  const [facultyId, setFacultyId] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !facultyId.trim()) return;
    onAdd(name, facultyId);
    setName("");
    setFacultyId("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Existing Instructor">
      <div className="space-y-4 font-body text-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Instructor Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dela Cruz, Juan"
            className={inputClassName}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Faculty ID
          </label>
          <input
            type="text"
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            placeholder="e.g. 2022-0999"
            className={inputClassName}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" block={false} onClick={handleAdd}>
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
        <FieldChrome id="add-program" label="Select Program">
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
        </FieldChrome>
        <div className="flex justify-end gap-2 pt-2">
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
  onClose: () => void;
  onAssign: (subjectCode: string) => void;
};

export function AssignSubjectModal({
  open,
  availableSubjects,
  onClose,
  onAssign,
}: AssignSubjectModalProps) {
  const [selectedCode, setSelectedCode] = useState(availableSubjects[0]?.subjectCode ?? "");

  const handleAssign = () => {
    if (!selectedCode) return;
    onAssign(selectedCode);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign Existing Subject">
      <div className="space-y-4 font-body text-sm">
        <FieldChrome id="assign-subject" label="Select Subject to Assign">
          <Select
            items={availableSubjects.map((s) => ({
              value: s.subjectCode,
              label: `${s.subjectCode} — ${s.descriptiveTitle} (${s.weeklyHours} hrs)`,
            }))}
            value={selectedCode}
            onValueChange={(v) => setSelectedCode(v ?? "")}
          >
            <SelectTrigger id="assign-subject">
              <SelectValue placeholder="Choose a subject..." />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.map((s) => (
                <SelectItem key={s.subjectCode} value={s.subjectCode}>
                  <span className="font-semibold">{s.subjectCode}</span>
                  <span className="ml-2 mr-2 text-slate-500 dark:text-slate-400">{s.descriptiveTitle}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">({s.weeklyHours} hrs)</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldChrome>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" block={false} onClick={handleAssign}>
            Assign Subject
          </Button>
        </div>
      </div>
    </Modal>
  );
}
