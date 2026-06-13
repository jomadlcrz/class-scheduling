import { useEffect, useMemo, useState } from "react";
import { Pagination } from "../../components/ui/pagination";
import { usePagination } from "../../hooks/use-pagination";
import { RoleGuard } from "../../auth/role-guard";
import { EmptyState } from "../../components/ui/empty-state";
import { Button } from "../../components/ui/button";
import { PlusIcon } from "../../components/ui/icons";
import { Modal } from "../../components/ui/modal";
import { Spinner } from "../../components/ui/spinner";
import { ActivateUserDialog } from "../../features/users/activate-user-dialog";
import { DeactivateUserDialog } from "../../features/users/deactivate-user-dialog";
import { ResetPasswordDialog } from "../../features/users/reset-password-dialog";
import {
  applyUserFilters,
  EMPTY_FILTERS,
  UserFilters,
  type UserFiltersValue,
} from "../../features/users/user-filters";
import { UserForm } from "../../features/users/user-form";
import { UserTable } from "../../features/users/user-table";
import { useAuth } from "../../hooks/use-auth";
import { PageHeader } from "../../layouts/page-header";
import { userService } from "../../services/user.service";
import type { CreateUserInput, User } from "../../types/user";

export function meta() {
  return [
    { title: "Users — GWC Class Scheduling" },
    {
      name: "description",
      content: "Manage GWC Class Scheduling user accounts.",
    },
  ];
}

export default function Users() {
  return (
    <RoleGuard allow={["admin"]}>
      <UsersPage />
    </RoleGuard>
  );
}

function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);
  const [filters, setFilters] = useState<UserFiltersValue>(EMPTY_FILTERS);

  // One open dialog at a time: the form (create/edit) or a confirm action.
  const [formTarget, setFormTarget] = useState<User | "new" | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [activateTarget, setActivateTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  useEffect(() => {
    userService.list().then(setUsers);
  }, []);

  const visibleUsers = useMemo(
    () => (users ? applyUserFilters(users, filters) : []),
    [users, filters],
  );

  const pagination = usePagination(visibleUsers, JSON.stringify(filters));

  function replaceUser(updated: User) {
    setUsers((current) => current!.map((u) => (u.id === updated.id ? updated : u)));
  }

  async function handleFormSubmit(input: CreateUserInput) {
    if (formTarget === "new") {
      const created = await userService.create(input);
      setUsers((current) => [...current!, created]);
    } else if (formTarget) {
      replaceUser(await userService.update(formTarget.id, input));
    }
    setFormTarget(null);
  }

  async function handleSetStatus(target: User, status: User["status"]) {
    replaceUser(await userService.setStatus(target.id, status));
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage accounts, roles, and access."
        actions={
          <Button type="button" block={false} onClick={() => setFormTarget("new")}>
            <PlusIcon />
            New User
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-4">
        <UserFilters value={filters} onChange={setFilters} />

        {users === null ? (
          <div
            role="status"
            aria-label="Loading users"
            className="grid place-items-center py-12 text-navy-700 dark:text-slate-200"
          >
            <Spinner />
          </div>
        ) : visibleUsers.length === 0 ? (
          <EmptyState title="No users found">
            No users match the current filters. Adjust the search or filters and try again.
          </EmptyState>
        ) : (
          <>
            <UserTable
              users={pagination.pageItems}
              currentUserId={currentUser?.id}
              onEdit={(user) => setFormTarget(user)}
              onToggleStatus={(user) =>
                user.status === "active" ? setDeactivateTarget(user) : setActivateTarget(user)
              }
              onResetPassword={(user) => setResetTarget(user)}
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </div>

      <Modal
        open={formTarget !== null}
        onClose={() => setFormTarget(null)}
        title={formTarget === "new" ? "New User" : "Edit User"}
      >
        <UserForm
          user={formTarget === "new" ? undefined : (formTarget ?? undefined)}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormTarget(null)}
        />
      </Modal>

      <DeactivateUserDialog
        user={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={(user) => handleSetStatus(user, "inactive")}
      />
      <ActivateUserDialog
        user={activateTarget}
        onClose={() => setActivateTarget(null)}
        onConfirm={(user) => handleSetStatus(user, "active")}
      />
      <ResetPasswordDialog
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={(user) => userService.resetPassword(user.id)}
      />
    </>
  );
}
