import { useState } from "react";
import { inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

export const DEFAULT_DEACTIVATE_REASONS = [
  { value: "Inactivity", label: "Inactivity" },
  { value: "Resigned", label: "Resigned" },
  { value: "Violation of terms", label: "Violation of terms" },
  { value: "Other", label: "Other" },
] as const;

export const FACULTY_DEACTIVATE_REASONS = [
  { value: "Inactivity", label: "Inactivity" },
  { value: "Resigned", label: "Resigned" },
  { value: "Contract not renewed", label: "Contract not renewed" },
  { value: "Retirement", label: "Retirement" },
  { value: "Violation of terms", label: "Violation of terms" },
  { value: "Other", label: "Other" },
] as const;

export const STUDENT_DEACTIVATE_REASONS = [
  { value: "Inactivity", label: "Inactivity" },
  { value: "Graduated", label: "Graduated" },
  { value: "Transferred", label: "Transferred" },
  { value: "Dropped out", label: "Dropped out" },
  { value: "Violation of terms", label: "Violation of terms" },
  { value: "Other", label: "Other" },
] as const;

type DeactivateReason = { value: string; label: string };

type DeactivateReasonSelectProps = {
  id: string;
  reason: string;
  onReasonChange: (value: string) => void;
  presetReasons?: readonly DeactivateReason[];
};

export function DeactivateReasonSelect({
  id,
  reason,
  onReasonChange,
  presetReasons = DEFAULT_DEACTIVATE_REASONS,
}: DeactivateReasonSelectProps) {
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customReason, setCustomReason] = useState("");

  function handlePresetChange(value: string) {
    setSelectedPreset(value);
    onReasonChange(value === "Other" ? customReason : value);
  }

  function handleCustomChange(value: string) {
    setCustomReason(value);
    onReasonChange(value);
  }

  return (
    <div className="flex flex-col gap-3">
      <Select
        items={presetReasons.map((r) => ({ value: r.value, label: r.label }))}
        value={selectedPreset}
        onValueChange={(v) => handlePresetChange(v as string)}
      >
        <SelectTrigger id={`${id}-preset`} aria-label="Select reason">
          <SelectValue>{(value) => value ?? "Select a reason"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {presetReasons.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedPreset === "Other" && (
        <Textarea
          id={`${id}-custom`}
          label="Specify reason"
          value={customReason}
          onChange={(e) => handleCustomChange(e.target.value)}
        />
      )}
    </div>
  );
}

type DeactivateConfirmInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
};

export function DeactivateConfirmInput({ id, value, onChange }: DeactivateConfirmInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-body text-sm font-medium text-navy-700 dark:text-mist-100">
        Type <span className="font-extrabold text-red-600 dark:text-red-400">DEACTIVATE</span> to confirm
      </label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
      />
    </div>
  );
}
