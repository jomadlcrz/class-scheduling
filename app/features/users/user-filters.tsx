import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import type { Role, UserStatus } from "../../types/user";
import { ROLE_LABELS } from "./role-badge";

export type UserFiltersValue = {
  search: string;
  role: Role | "all";
  status: UserStatus | "all";
};

export const EMPTY_FILTERS: UserFiltersValue = { search: "", role: "all", status: "all" };

type UserFiltersProps = {
  value: UserFiltersValue;
  onChange: (value: UserFiltersValue) => void;
};

export function UserFilters({ value, onChange }: UserFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Input
        id="user-search"
        label="Search"
        type="search"
        placeholder="Name or email…"
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
      />

      <Select
        id="user-role-filter"
        label="Role"
        value={value.role}
        onChange={(e) => onChange({ ...value, role: e.target.value as UserFiltersValue["role"] })}
      >
        <option value="all">All roles</option>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <option key={role} value={role}>
            {label}
          </option>
        ))}
      </Select>

      <Select
        id="user-status-filter"
        label="Status"
        value={value.status}
        onChange={(e) =>
          onChange({ ...value, status: e.target.value as UserFiltersValue["status"] })
        }
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>
    </div>
  );
}

/** Applies the filters client-side; the mock service returns the full list. */
export function applyUserFilters<T extends { name: string; email: string; role: Role; status: UserStatus }>(
  users: T[],
  filters: UserFiltersValue,
): T[] {
  const query = filters.search.trim().toLowerCase();
  return users.filter((user) => {
    if (filters.role !== "all" && user.role !== filters.role) return false;
    if (filters.status !== "all" && user.status !== filters.status) return false;
    if (
      query &&
      !user.name.toLowerCase().includes(query) &&
      !user.email.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });
}
