import { EmptyState } from "~/components/feedback/empty-state";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { AccountRoleBadge } from "~/features/accounts/account-role-badge";
import { ImageViewer } from "~/components/ui/image-viewer";
import { ProfileAvatar } from "~/components/ui/profile-avatar";
import type { OfficeStaffMember } from "~/types/department";

function displayName(member: OfficeStaffMember) {
  const parts = [member.firstName, member.midName].filter(Boolean).join(" ");
  return parts ? `${member.lastName}, ${parts}` : member.lastName;
}

export function OfficeStaffDirectory({ staff }: { staff: OfficeStaffMember[] }) {
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  if (staff.length === 0) {
    return (
      <EmptyState title="No office staff">
        No staff members are assigned to this office yet.
      </EmptyState>
    );
  }

  return (
    <>
    <Table>
      <TableHead>
        <TableHeader>Name</TableHeader>
        <TableHeader className="hidden sm:table-cell">Role</TableHeader>
        <TableHeader className="hidden md:table-cell">Email</TableHeader>
        <TableHeader className="hidden md:table-cell">Mobile</TableHeader>
      </TableHead>
      <TableBody>
        {staff.map((member) => (
          <TableRow key={member.key}>
            <TableCell>
              <div className="flex items-center gap-3">
                {member.profilePhotoUrl ? (
                  <img
                    src={member.profilePhotoUrl}
                    alt=""
                    className="size-8 shrink-0 cursor-pointer rounded-full object-cover"
                    onClick={() => setViewerSrc(member.profilePhotoUrl!)}
                  />
                  ) : <ProfileAvatar className="size-8" />}
                <span className="font-medium text-navy-700 dark:text-mist-100">
                  {displayName(member)}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <AccountRoleBadge role={member.roleName} />
            </TableCell>
            <TableCell className="hidden text-slate-500 dark:text-slate-400 md:table-cell">
              {member.email ? <a href={`mailto:${member.email}`} className="hover:underline">{member.email}</a> : "—"}
            </TableCell>
            <TableCell className="hidden text-slate-500 dark:text-slate-400 md:table-cell">
              {member.mobile ? <a href={`tel:${member.mobile}`} className="hover:underline">{member.mobile}</a> : "—"}
            </TableCell>
          </TableRow>
        ))}
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
