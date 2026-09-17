import { Badge } from "~/components/ui/badge";
import { departmentLogoUrl, onDepartmentLogoError } from "~/lib/department-logo";
import { ImageViewer } from "~/components/ui/image-viewer";
import { ProfileAvatar } from "~/components/ui/profile-avatar";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { IconButton } from "~/components/ui/icon-button";
import { EditIcon, UserCheckIcon, UserOffIcon } from "~/components/ui/icons";
import { AccountRoleBadge } from "~/features/accounts/account-role-badge";
import type { Faculty } from "~/types/faculty";

function displayName(member: Faculty) {
  const parts = [member.firstName, member.midName].filter(Boolean).join(" ");
  const base = parts ? `${member.lastName}, ${parts}` : member.lastName;
  return member.prefixHonorific ? `${member.prefixHonorific} ${base}` : base;
}

type FacultyTableProps = {
  faculty: Faculty[];
  /** Per-row login status from GET /super-admin/faculty-accounts/<id> (the list
   * endpoint doesn't include it); `true`/`false` = has a login, `null` = no login,
   * `undefined` while still loading. */
  accountActiveById: Record<number, boolean | null | undefined>;
  onEdit: (member: Faculty) => void;
  onDeactivate: (member: Faculty) => void;
  onReactivate: (member: Faculty) => void;
};

export function FacultyTable({ faculty, accountActiveById, onEdit, onDeactivate, onReactivate }: FacultyTableProps) {
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  return (
    <>
    <Table>
      <TableHead>
        <TableHeader>Faculty</TableHeader>
        <TableHeader>Department</TableHeader>
        <TableHeader>Role</TableHeader>
        <TableHeader>Status</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {faculty.map((member) => {
          const isActive = accountActiveById[member.id] ?? member.accountActive ?? (member.hasAccount ? true : null);
          return (
          <TableRow key={member.id} className="group">
            <TableCell>
              <div className="flex min-w-0 items-center gap-3">
                {member.profilePhotoUrl ? (
                  <img
                    src={member.profilePhotoUrl}
                    alt=""
                    className="size-8 shrink-0 cursor-pointer rounded-full object-cover"
                    onClick={() => setViewerSrc(member.profilePhotoUrl)}
                  />
                  ) : <ProfileAvatar className="size-8" />}
                <div className="min-w-0">
                  <span className="block truncate font-medium text-navy-700 dark:text-mist-100">
                    {displayName(member)}
                  </span>
                  <div className="flex items-center gap-1.5 truncate text-xs text-slate-400 dark:text-slate-500">
                    {member.academicRank && <span>{member.academicRank}</span>}
                    {member.academicRank && member.email && <span>·</span>}
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="truncate hover:text-slate-600 dark:hover:text-slate-300">
                        {member.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <img
                  src={departmentLogoUrl(member.departmentCode)}
                  alt={`${member.departmentCode} logo`}
                  onError={onDepartmentLogoError}
                  className="size-8 rounded-lg object-contain"
                />
                <span className="text-slate-600 dark:text-slate-300">{member.departmentCode}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {member.roles.map((r) => (
                  <AccountRoleBadge key={r.id} role={r.name} />
                ))}
              </div>
            </TableCell>
            <TableCell>
              {isActive === undefined ? (
                <span className="text-xs text-slate-400 dark:text-slate-500">…</span>
              ) : isActive === null ? (
                <Badge tone="slate">No account</Badge>
              ) : isActive ? (
                <Badge tone="emerald">Active</Badge>
              ) : (
                <Badge tone="red">Deactivated</Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1 lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                <IconButton
                  onClick={() => onEdit(member)}
                  label={`Edit ${member.firstName} ${member.lastName}`}
                  title="Edit"
                >
                  <EditIcon />
                </IconButton>
                {isActive === undefined ? (
                  <span className="grid size-8 place-items-center text-slate-300 dark:text-slate-600">…</span>
                ) : isActive === null ? null : isActive ? (
                  <IconButton
                    variant="dangerSoft"
                    onClick={() => onDeactivate(member)}
                    label={`Deactivate ${member.firstName} ${member.lastName}`}
                    title="Deactivate"
                  >
                    <UserOffIcon />
                  </IconButton>
                ) : (
                  <IconButton
                    variant="emerald"
                    onClick={() => onReactivate(member)}
                    label={`Reactivate ${member.firstName} ${member.lastName}`}
                    title="Reactivate"
                  >
                    <UserCheckIcon />
                  </IconButton>
                )}
              </div>
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
    {viewerSrc && (
      <ImageViewer
        open={viewerSrc !== null}
        onClose={() => setViewerSrc(null)}
        src={viewerSrc}
        alt="Profile photo"
      />
    )}
    </>
  );
}
