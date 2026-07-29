import { useState } from "react";
import { Button } from "~/components/ui/button";
import { inputClassName } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";

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
  onAdd: (name: string, facultyId: string, department: string) => void;
};

export function AddInstructorModal({ open, onClose, onAdd }: AddInstructorModalProps) {
  const [name, setName] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [department, setDepartment] = useState("Computer Studies");

  const handleAdd = () => {
    if (!name.trim() || !facultyId.trim()) return;
    onAdd(name, facultyId, department);
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
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={inputClassName}
          >
            <option value="Computer Studies">Computer Studies</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Engineering">Engineering</option>
          </select>
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

export type AddProgramModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (abbrev: string, name: string) => void;
};

export function AddProgramModal({ open, onClose, onAdd }: AddProgramModalProps) {
  const [abbrev, setAbbrev] = useState("BSCS");
  const [name, setName] = useState("Bachelor of Science in Computer Science");

  const handleAdd = () => {
    if (!abbrev.trim() || !name.trim()) return;
    onAdd(abbrev, name);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Existing Program">
      <div className="space-y-4 font-body text-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Program Code / Abbreviation
          </label>
          <input
            type="text"
            value={abbrev}
            onChange={(e) => setAbbrev(e.target.value)}
            placeholder="e.g. BSCS"
            className={inputClassName}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Full Program Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bachelor of Science in Computer Science"
            className={inputClassName}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" block={false} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" block={false} onClick={handleAdd}>
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
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Subject to Assign
          </label>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className={inputClassName}
          >
            {availableSubjects.map((s) => (
              <option key={s.subjectCode} value={s.subjectCode}>
                {s.subjectCode} - {s.descriptiveTitle} ({s.weeklyHours} hrs)
              </option>
            ))}
          </select>
        </div>
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
