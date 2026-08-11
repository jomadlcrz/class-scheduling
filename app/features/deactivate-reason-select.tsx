import { useState } from "react";
import { inputClassName } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

const PRESET_REASONS = [
  { value: "Inactivity", label: "Inactivity" },
  { value: "Resigned", label: "Resigned" },
  { value: "Violation of terms", label: "Violation of terms" },
  { value: "Other", label: "Other" },
];

type DeactivateReasonSelectProps = {
  id: string;
  reason: string;
  onReasonChange: (value: string) => void;
};

export function DeactivateReasonSelect({ id, reason, onReasonChange }: DeactivateReasonSelectProps) {
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
        items={PRESET_REASONS.map((r) => ({ value: r.value, label: r.label }))}
        value={selectedPreset}
        onValueChange={(v) => handlePresetChange(v as string)}
      >
        <SelectTrigger id={`${id}-preset`} aria-label="Select reason">
          <SelectValue placeholder="Select a reason" />
        </SelectTrigger>
        <SelectContent>
          {PRESET_REASONS.map((r) => (
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
          placeholder="Provide a specific reason"
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
        placeholder="DEACTIVATE"
        className={inputClassName}
      />
    </div>
  );
}
