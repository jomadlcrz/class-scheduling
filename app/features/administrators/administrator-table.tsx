import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { ImageViewer } from "~/components/ui/image-viewer";
import { ProfileAvatar } from "~/components/ui/profile-avatar";
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
import { AdministratorRoleBadge } from "~/features/administrators/role-badge";
import type { Administrator } from "~/types/administrator";

function displayName(admin: Administrator) {
  const parts = [admin.firstName, admin.midName].filter(Boolean).join(" ");
  return parts ? `${admin.lastName}, ${parts}` : admin.lastName;
}

type AdministratorTableProps = {
  administrators: Administrator[];
  /** Per-row login status resolved from GET /super-admin/accounts by email. */
  accountActiveById: Record<number, boolean | undefined>;
  onEdit: (admin: Administrator) => void;
  onDeactivate: (admin: Administrator) => void;
  onReactivate: (admin: Administrator) => void;
};

export function AdministratorTable({
  administrators,
  accountActiveById,
  onEdit,
  onDeactivate,
  onReactivate,
}: AdministratorTableProps) {
  const [viewer, setViewer] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <Table>
        <TableHead>
          <TableHeader>Administrator</TableHeader>
          <TableHeader>Department</TableHeader>
          <TableHeader>Role</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader>
            <span className="sr-only">Actions</span>
          </TableHeader>
        </TableHead>
        <TableBody>
          {administrators.map((admin) => {
            const isActive = accountActiveById[admin.id] ?? admin.accountActive ?? true;
            return (
              <TableRow key={admin.id} className="group">
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2.5">
                    {admin.profilePhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewer({ src: admin.profilePhotoUrl!, alt: displayName(admin) })}
                        className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                        aria-label={`View ${displayName(admin)} profile photo`}
                      >
                        <img src={admin.profilePhotoUrl} alt="" className="size-9 rounded-full object-cover" />
                      </button>
                    ) : (
                      <ProfileAvatar gender={admin.gender} className="size-9" />
                    )}
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-navy-700 dark:text-mist-100">
                        {displayName(admin)}
                      </span>
                      {admin.email && (
                        <a
                          href={`mailto:${admin.email}`}
                          className="block truncate text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        >
                          {admin.email}
                        </a>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-300">
                  {admin.departmentCode || "—"}
                </TableCell>
                <TableCell>
                  <AdministratorRoleBadge role={admin.roleName} />
                </TableCell>
                <TableCell>
                  {isActive ? (
                    <Badge tone="emerald">Active</Badge>
                  ) : (
                    <Badge tone="red">Deactivated</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1 lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                    <IconButton
                      onClick={() => onEdit(admin)}
                      label={`Edit ${admin.firstName} ${admin.lastName}`}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    {admin.roleName !== "Super Admin" &&
                      (isActive ? (
                        <IconButton
                          variant="dangerSoft"
                          onClick={() => onDeactivate(admin)}
                          label={`Deactivate ${admin.firstName} ${admin.lastName}`}
                          title="Deactivate"
                        >
                          <UserOffIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          variant="emerald"
                          onClick={() => onReactivate(admin)}
                          label={`Reactivate ${admin.firstName} ${admin.lastName}`}
                          title="Reactivate"
                        >
                          <UserCheckIcon />
                        </IconButton>
                      ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {viewer && <ImageViewer open onClose={() => setViewer(null)} src={viewer.src} alt={viewer.alt} />}
    </>
  );
}
