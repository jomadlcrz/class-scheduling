import { IconButton } from "~/components/ui/icon-button";
import { ArchiveIcon, EditIcon } from "~/components/ui/icons";
import { archiveActionButtonClassName } from "~/features/archive/archive-icon-styles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { RolePermission } from "~/types/permission";

type PermissionCatalogTableProps = {
  catalog: RolePermission[];
  onEdit: (permission: RolePermission) => void;
  onArchive: (permission: RolePermission) => void;
};

/** Every permission slug that exists (granted or not) — create/edit/delete the catalog itself, separate from the role-grant matrix above. */
export function PermissionCatalogTable({ catalog, onEdit, onArchive }: PermissionCatalogTableProps) {
  const sorted = [...catalog].sort((a, b) => a.slug.localeCompare(b.slug));

  return (
    <Table>
      <TableHead>
        <TableHeader>Slug</TableHeader>
        <TableHeader>Description</TableHeader>
        <TableHeader>
          <span className="sr-only">Actions</span>
        </TableHeader>
      </TableHead>
      <TableBody>
        {sorted.map((permission) => (
          <TableRow key={permission.id}>
            <TableCell>
              <span className="font-medium text-navy-700 dark:text-mist-100">{permission.slug}</span>
            </TableCell>
            <TableCell>{permission.description || "—"}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <IconButton
                  onClick={() => onEdit(permission)}
                  label={`Edit ${permission.slug}`}
                  title="Edit"
                >
                  <EditIcon />
                </IconButton>
                <button
                  type="button"
                  onClick={() => onArchive(permission)}
                  aria-label={`Archive ${permission.slug}`}
                  title="Archive"
                  className={archiveActionButtonClassName}
                >
                  <ArchiveIcon />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
