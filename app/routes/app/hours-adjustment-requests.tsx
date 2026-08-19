import { useState } from "react";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { FormError } from "~/components/forms/form-error";
import { DataLoadAlert } from "~/components/feedback/data-load-alert";
import { EmptyState } from "~/components/feedback/empty-state";
import { Badge, type BadgeTone } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { ChevronDownIcon } from "~/components/ui/icons";
import { FieldChrome, Input, inputClassName } from "~/components/ui/input";
import { Modal, ModalActions } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useSemesters } from "~/hooks/use-semesters";
import { PageHeader } from "~/layouts/page-header";
import { authorityWorkflowService } from "~/services/authority-workflow.service";
import { deanService } from "~/services/dean.service";
import type { HoursAdjustmentRequest } from "~/types/authority-workflow";

export function meta() {
  return [{ title: "Hours Adjustment Requests — GWC Class Scheduling" }];
}

const STATUS_TONES: Record<string, BadgeTone> = {
  pending: "gold",
  applied: "emerald",
  approved: "emerald",
  rejected: "red",
};

function HoursAdjustmentRequestsPage() {
  const { user } = useAuth();
  const { semesterLabel } = useSemesters();
  const [status, setStatus] = useState("all");
  const [requestOpen, setRequestOpen] = useState(false);
  const [teachingTermPickerOpen, setTeachingTermPickerOpen] = useState(false);
  const [teachingTermId, setTeachingTermId] = useState(0);
  const [requestedHours, setRequestedHours] = useState("");
  const [decisionTarget, setDecisionTarget] = useState<{ request: HoursAdjustmentRequest; decision: "approved" | "rejected" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { data, error, reload } = useCachedData(
    `hours-adjustment-requests:${status}`,
    () => authorityWorkflowService.listHoursAdjustmentRequests(status === "all" ? {} : { status }),
    { cache: false },
  );
  const { data: teachingTerms, error: teachingTermsError, reload: reloadTeachingTerms } = useCachedData(
    "hours-adjustment-teaching-terms",
    () => deanService.listTeachingTerms(),
    { enabled: user?.role === "registrar" },
  );
  const selectedTeachingTerm = (teachingTerms ?? []).find((term) => term.id === teachingTermId);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSaving(true);
    setFormError(null);
    try {
      const result = await authorityWorkflowService.requestHoursAdjustment(
        teachingTermId,
        Number(requestedHours),
        String(values.get("reason") ?? ""),
      );
      if (result.message) toast.success(result.message);
      setRequestOpen(false);
      setTeachingTermId(0);
      setRequestedHours("");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  }

  async function submitDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decisionTarget) return;
    const values = new FormData(event.currentTarget);
    setSaving(true);
    setFormError(null);
    try {
      const result = await authorityWorkflowService.decideHoursAdjustment(
        decisionTarget.request.id,
        decisionTarget.decision,
        String(values.get("message") ?? "") || undefined,
      );
      if (result.message) toast.success(result.message);
      setDecisionTarget(null);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <PageHeader
        title="Hours Adjustment Requests"
        actions={user?.role === "registrar" ? <Button type="button" block={false} onClick={() => { setFormError(null); setTeachingTermId(0); setRequestedHours(""); setRequestOpen(true); }}>New Request</Button> : undefined}
      />
      <div className="mt-4 w-52">
        <FieldChrome id="adjustment-status" label="Status">
          <Select items={[{ value: "all", label: "All requests" }, { value: "pending", label: "Pending" }, { value: "applied", label: "Applied" }, { value: "rejected", label: "Rejected" }]} value={status} onValueChange={(value) => setStatus(value ?? "all")}>
            <SelectTrigger id="adjustment-status"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All requests</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="applied">Applied</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent>
          </Select>
        </FieldChrome>
      </div>
      <div className="mt-4">
        {error && data === null ? (
          <EmptyState title="Couldn't load adjustment requests">{error}</EmptyState>
        ) : data === null ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : data.length === 0 ? (
          <EmptyState title={status === "all" ? "No adjustment requests yet" : "No adjustment requests found"}>
            {status === "all" ? "No adjustment requests have been submitted yet." : "No requests match the selected status."}
          </EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableHeader>Instructor</TableHeader>
              <TableHeader>Hours</TableHeader>
              <TableHeader className="hidden md:table-cell">Reason</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader className="hidden lg:table-cell">Requested by</TableHeader>
              {user?.role === "dean" && <TableHeader><span className="sr-only">Actions</span></TableHeader>}
            </TableHead>
            <TableBody>
              {data.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <span className="font-semibold text-navy-700 dark:text-mist-100">{request.instructor.full_name}</span>
                    <span className="block text-xs text-slate-400">{request.instructor.department_abbrev ?? "—"}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{request.previous_hours ?? "—"} → {request.requested_hours}h</TableCell>
                  <TableCell className="hidden max-w-md md:table-cell">{request.reason}</TableCell>
                  <TableCell><Badge tone={STATUS_TONES[request.status] ?? "slate"}>{request.status}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell">{request.requested_by.name ?? request.requested_by.email ?? "—"}</TableCell>
                  {user?.role === "dean" && (
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button type="button" block={false} onClick={() => { setFormError(null); setDecisionTarget({ request, decision: "approved" }); }}>Approve</Button>
                          <Button type="button" variant="danger" block={false} onClick={() => { setFormError(null); setDecisionTarget({ request, decision: "rejected" }); }}>Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request Hours Adjustment">
        <form onSubmit={submitRequest} className="space-y-4">
          <FormError message={formError} />
          {teachingTermsError && <DataLoadAlert title="Teaching terms unavailable" message={teachingTermsError} onRetry={reloadTeachingTerms} permission={teachingTermsError.toLowerCase().includes("permission")} />}
          <FieldChrome id="adjustment-teaching-term" label="Teaching term" required>
            <button id="adjustment-teaching-term" type="button" disabled={Boolean(teachingTermsError)} onClick={() => setTeachingTermPickerOpen(true)} className={`${inputClassName} flex items-center justify-between gap-3 text-left`}>
              <span className={selectedTeachingTerm ? "truncate" : "truncate text-slate-400 dark:text-slate-500"}>{selectedTeachingTerm ? `${selectedTeachingTerm.instructorName} · ${semesterLabel(selectedTeachingTerm.semesterNumber)}` : "Select an instructor term"}</span>
              <span className="shrink-0 text-slate-400"><ChevronDownIcon /></span>
            </button>
          </FieldChrome>
          <Input id="requestedHours" label="Requested max weekly hours" type="number" min="0" max="60" step="0.5" required value={requestedHours} onChange={(event) => setRequestedHours(event.target.value)} />
          <Textarea id="reason" name="reason" label="Reason" required />
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button type="submit" block={false} isLoading={saving} loadingLabel="Sending…" disabled={Boolean(teachingTermsError) || !teachingTermId || requestedHours === ""}>Send Request</Button>
          </ModalActions>
        </form>
      </Modal>

      <CommandDialog open={teachingTermPickerOpen} onOpenChange={setTeachingTermPickerOpen} title="Select Teaching Term" description="Search by instructor, employee ID, department, or semester.">
        <CommandInput placeholder="Search teaching terms…" autoFocus />
        <CommandList>
          <CommandEmpty>No teaching terms found.</CommandEmpty>
          <CommandGroup heading="Instructor teaching terms">
            {(teachingTerms ?? []).map((term) => (
              <CommandItem key={term.id} value={`${term.instructorName} ${term.employeeId ?? ""} ${term.department ?? ""} ${semesterLabel(term.semesterNumber)}`} onSelect={() => { setTeachingTermId(term.id); setTeachingTermPickerOpen(false); setFormError(null); }}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{term.instructorName}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{term.employeeId ?? "No employee ID"}{term.department ? ` · ${term.department}` : ""}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">{semesterLabel(term.semesterNumber)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Modal open={decisionTarget !== null} onClose={() => setDecisionTarget(null)} title={`${decisionTarget?.decision === "approved" ? "Approve" : "Reject"} Hours Adjustment`}>
        <form onSubmit={submitDecision} className="space-y-4">
          <FormError message={formError} />
          <p className="font-body text-sm text-slate-500 dark:text-slate-400">
            {decisionTarget?.request.instructor.full_name}: {decisionTarget?.request.previous_hours ?? "—"} → {decisionTarget?.request.requested_hours} hours.
          </p>
          <Textarea id="message" name="message" label="Decision note" />
          <ModalActions>
            <Button type="button" variant="outline" block={false} onClick={() => setDecisionTarget(null)}>Cancel</Button>
            <Button type="submit" variant={decisionTarget?.decision === "rejected" ? "danger" : "primary"} block={false} isLoading={saving} loadingLabel="Saving…">Confirm</Button>
          </ModalActions>
        </form>
      </Modal>
    </div>
  );
}

export default function HoursAdjustmentRequestsRoute() {
  return <RoleGuard allow={["dean", "registrar"]}><HoursAdjustmentRequestsPage /></RoleGuard>;
}
