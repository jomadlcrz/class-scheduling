import { FilterDropdown } from "~/components/ui/dropdown-menu";

type DepartmentFilterSelectProps = {
  id: string;
  departmentCodes: string[];
  value: string;
  onValueChange: (value: string) => void;
};

/** "All departments" + one option per code — the department filter shared by the faculty and deans lists. */
export function DepartmentFilterSelect({ id, departmentCodes, value, onValueChange }: DepartmentFilterSelectProps) {
  return (
    <FilterDropdown
      id={id}
      label="Department"
      allLabel="All departments"
      options={departmentCodes.map((code) => ({ value: code, label: code }))}
      value={value}
      onChange={onValueChange}
    />
  );
}
