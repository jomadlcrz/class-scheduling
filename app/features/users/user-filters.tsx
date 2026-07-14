import { FieldChrome, Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { Role, UserStatus } from "~/types/user";
import { ROLE_LABELS } from "~/features/users/role-badge";

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

      <FieldChrome id="user-role-filter" label="Role">
        <Select
          items={[
            { value: "all", label: "All roles" },
            ...Object.entries(ROLE_LABELS).map(([role, label]) => ({ value: role, label })),
          ]}
          value={value.role}
          onValueChange={(v) => onChange({ ...value, role: v as UserFiltersValue["role"] })}
        >
          <SelectTrigger id="user-role-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <SelectItem key={role} value={role}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldChrome>

      <FieldChrome id="user-status-filter" label="Status">
        <Select
          items={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          value={value.status}
          onValueChange={(v) => onChange({ ...value, status: v as UserFiltersValue["status"] })}
        >
          <SelectTrigger id="user-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FieldChrome>
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
