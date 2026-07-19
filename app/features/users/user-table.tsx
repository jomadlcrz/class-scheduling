import { Badge } from "~/components/ui/badge";
import { EditIcon, KeyIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { User } from "~/types/user";
import { RoleBadge } from "~/features/users/role-badge";

type UserTableProps = {
  users: User[];
  /** The signed-in admin — they can't deactivate themselves. */
  currentUserId?: string;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

export function UserTable({
  users,
  currentUserId,
  onEdit,
  onToggleStatus,
  onResetPassword,
}: UserTableProps) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader>Role</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-navy-700 dark:text-mist-100">{user.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
              </div>
            </TableCell>
            <TableCell>
              <RoleBadge role={user.role} />
            </TableCell>
            <TableCell>
              {user.status === "active" ? (
                <Badge tone="emerald">Active</Badge>
              ) : (
                <Badge tone="red">Inactive</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(user)}
                  aria-label={`Edit ${user.name}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onResetPassword(user)}
                  aria-label={`Reset password for ${user.name}`}
                  title="Reset password"
                  className={actionButtonClassName}
                >
                  <KeyIcon />
                </button>
                {user.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(user)}
                    aria-label={
                      user.status === "active"
                        ? `Deactivate ${user.name}`
                        : `Activate ${user.name}`
                    }
                    title={user.status === "active" ? "Deactivate" : "Activate"}
                    className={actionButtonClassName}
                  >
                    {user.status === "active" ? <UserOffIcon /> : <UserCheckIcon />}
                  </button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
