import { FieldChrome } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

type DepartmentFilterSelectProps = {
  id: string;
  departmentCodes: string[];
  value: string;
  onValueChange: (value: string) => void;
};

/** "All departments" + one option per code — the department filter shared by the faculty and deans lists. */
export function DepartmentFilterSelect({ id, departmentCodes, value, onValueChange }: DepartmentFilterSelectProps) {
  return (
    <FieldChrome id={id} label="Department">
      <Select
        items={[
          { value: "all", label: "All departments" },
          ...departmentCodes.map((code) => ({ value: code, label: code })),
        ]}
        value={value}
        onValueChange={(v) => onValueChange(v as string)}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All departments</SelectItem>
          {departmentCodes.map((code) => (
            <SelectItem key={code} value={code}>
              {code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldChrome>
  );
}
