import { EditIcon, TrashIcon } from "~/components/ui/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { RolePermission } from "~/types/permission";

type PermissionCatalogTableProps = {
  catalog: RolePermission[];
  onEdit: (permission: RolePermission) => void;
  onDelete: (permission: RolePermission) => void;
};

const actionButtonClassName =
  "grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-200/60 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white";

/** Every permission slug that exists (granted or not) — create/edit/delete the catalog itself, separate from the role-grant matrix above. */
export function PermissionCatalogTable({ catalog, onEdit, onDelete }: PermissionCatalogTableProps) {
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
                <button
                  type="button"
                  onClick={() => onEdit(permission)}
                  aria-label={`Edit ${permission.slug}`}
                  title="Edit"
                  className={actionButtonClassName}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(permission)}
                  aria-label={`Delete ${permission.slug}`}
                  title="Delete"
                  className={actionButtonClassName}
                >
                  <TrashIcon />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
