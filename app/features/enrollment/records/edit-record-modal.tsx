import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldChrome, Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { DatePicker } from "~/components/ui/date-picker";
import { Modal } from "~/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { enrollmentService } from "~/services/enrollment.service";
import { studentService } from "~/services/student.service";
import { normalizePhoneNumber } from "~/lib/phone-number";
import type { EnrollmentRow } from "~/types/enrollment";
import type { AddressInput, StudentProfileDetail } from "~/types/student";

type Props = {
  open: boolean;
  studentProfileId: number;
  enrollment: EnrollmentRow;
  genders: string[];
  nameSuffixes: string[];
  onClose: () => void;
};

export function EditRecordModal({ open, studentProfileId, enrollment, genders, nameSuffixes, onClose }: Props) {
  const [profile, setProfile] = useState<StudentProfileDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [suffix, setSuffix] = useState("");
  const [gender, setGender] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressBarangay, setAddressBarangay] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressProvince, setAddressProvince] = useState("");
  const [addressRegion, setAddressRegion] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [prereqWarnings, setPrereqWarnings] = useState<{
    subjectId: number;
    subjectCode: string | null;
    descriptiveTitle: string | null;
    missing: { subjectId: number; subjectCode: string | null; descriptiveTitle: string | null }[];
  }[] | null>(null);
  const [checkingPrereq, setCheckingPrereq] = useState(false);

  useEffect(() => {
    if (open && studentProfileId) {
      setLoading(true);
      setEditError(null);
      setPrereqWarnings(null);
      studentService.getProfile(studentProfileId).then((p) => {
        setProfile(p);
        setSuffix(p?.suffix ?? "");
        setGender(p?.gender ?? "");
        setAddressStreet(p?.address?.street ?? "");
        setAddressBarangay(p?.address?.barangay ?? "");
        setAddressCity(p?.address?.cityMunicipality ?? "");
        setAddressProvince(p?.address?.province ?? "");
        setAddressRegion(p?.address?.region ?? "");
        setAddressZip(p?.address?.zipCode ?? "");
      }).catch(() => setProfile(null)).finally(() => setLoading(false));
    }
  }, [open, studentProfileId]);

  async function checkPrerequisites() {
    setCheckingPrereq(true);
    setPrereqWarnings(null);
    try {
      const result = await enrollmentService.checkPrerequisites({
        studentProfileId,
        syId: enrollment.syId,
        semesterNumber: enrollment.semesterNumber,
        subjectIds: enrollment.subjects.map((s) => s.subjectId),
      });
      setPrereqWarnings(result.warnings);
    } catch {
      setPrereqWarnings([]);
    } finally {
      setCheckingPrereq(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const form = new FormData(event.currentTarget);
    const middleName = String(form.get("edit-mid-name") ?? "").trim();
    const mobile = normalizePhoneNumber(String(form.get("edit-mobile") ?? ""));
    if (!mobile) {
      setEditError("Enter a valid mobile number.");
      return;
    }
    setEditError(null);
    setIsSaving(true);

    const hasAddress = addressStreet.trim() || addressBarangay.trim() || addressCity.trim();
    const addressPayload: AddressInput | undefined = hasAddress ? {
      street: addressStreet.trim() || undefined,
      barangay: addressBarangay.trim() || undefined,
      cityMunicipality: addressCity.trim() || undefined,
      province: addressProvince.trim() || undefined,
      region: addressRegion.trim() || undefined,
      zipCode: addressZip.trim() || undefined,
    } : undefined;

    try {
      const message = await studentService.updateProfile(studentProfileId, {
        firstName: String(form.get("edit-first-name") ?? "").trim(),
        midName: middleName || null,
        lastName: String(form.get("edit-last-name") ?? "").trim(),
        suffix: suffix || null,
        gender: gender || undefined,
        birthdate: String(form.get("edit-birthdate") ?? ""),
        mobile,
        email: String(form.get("edit-email") ?? "").trim(),
        address: addressPayload,
      });
      if (message) toast.success(message);
      onClose();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Student Record" wide>
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !profile ? (
        <p className="py-4 text-center font-body text-sm text-slate-500 dark:text-slate-400">
          Unable to load student profile.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <form noValidate onSubmit={handleSave} className="flex flex-col gap-6">
            <FormError message={editError} />

            <Card className="p-4">
              <h3 className="mb-3 font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                Personal Information
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id="edit-first-name"
                  label="First Name"
                  defaultValue={profile.firstName}
                  required
                  disabled={isSaving}
                />
                <Input
                  id="edit-mid-name"
                  label="Middle Name"
                  defaultValue={profile.midName ?? ""}
                  disabled={isSaving}
                />
                <Input
                  id="edit-last-name"
                  label="Last Name"
                  defaultValue={profile.lastName}
                  required
                  disabled={isSaving}
                />
                <FieldChrome id="edit-suffix" label="Suffix">
                  <Select
                    items={[{ value: "", label: "None" }, ...nameSuffixes.map((s) => ({ value: s, label: s }))]}
                    value={suffix}
                    onValueChange={(v) => setSuffix(v as string)}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="edit-suffix">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {nameSuffixes.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
                <FieldChrome id="edit-gender" label="Gender">
                  <Select
                    items={[{ value: "", label: "Select gender" }, ...genders.map((g) => ({ value: g, label: g }))]}
                    value={gender}
                    onValueChange={(v) => setGender(v as string)}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="edit-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Select gender</SelectItem>
                      {genders.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldChrome>
                <DatePicker
                  id="edit-birthdate"
                  label="Birthdate"
                  defaultValue={profile.birthdate ?? ""}
                  disabled={isSaving}
                  captionLayout="dropdown"
                  fromYear={1940}
                  toYear={new Date().getFullYear()}
                />
                <PhoneInput
                  id="edit-mobile"
                  label="Mobile"
                  defaultValue={profile.mobile ?? ""}
                  disabled={isSaving}
                />
                <Input
                  id="edit-email"
                  label="Email"
                  type="email"
                  defaultValue={profile.email ?? ""}
                  disabled={isSaving}
                />
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                Address
              </h3>
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id="edit-address-street"
                    label="Street"
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    disabled={isSaving}
                  />
                  <Input
                    id="edit-address-barangay"
                    label="Barangay"
                    value={addressBarangay}
                    onChange={(e) => setAddressBarangay(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id="edit-address-city"
                    label="City / Municipality"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    disabled={isSaving}
                  />
                  <Input
                    id="edit-address-province"
                    label="Province"
                    value={addressProvince}
                    onChange={(e) => setAddressProvince(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id="edit-address-region"
                    label="Region"
                    value={addressRegion}
                    onChange={(e) => setAddressRegion(e.target.value)}
                    disabled={isSaving}
                  />
                  <Input
                    id="edit-address-zip"
                    label="Zip Code"
                    inputMode="numeric"
                    maxLength={4}
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </Card>

            {profile.creditedSubjects.length > 0 && (
              <Card className="p-4">
                <h3 className="mb-3 font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                  Credited Subjects ({profile.creditedSubjects.length})
                </h3>
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-white/8 dark:border-white/10">
                  {profile.creditedSubjects.map((cs) => (
                    <li key={cs.subjectId} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                      <span className="min-w-0">
                        <span className="font-body text-xs font-medium text-navy-700 dark:text-mist-100">
                          {cs.subjectCode}
                        </span>
                        <span className="ml-1.5 font-body text-xs text-slate-500 dark:text-slate-400">
                          {cs.descriptiveTitle}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
                  Prerequisite Check
                </h3>
                <Button type="button" variant="outline" block={false} isLoading={checkingPrereq} loadingLabel="Checking…" onClick={checkPrerequisites}>
                  Check Prerequisites
                </Button>
              </div>
              {prereqWarnings === null ? (
                <p className="mt-3 font-body text-xs text-slate-400 dark:text-slate-500">
                  Verify prerequisites for the current enrollment subjects.
                </p>
              ) : prereqWarnings.length === 0 ? (
                <p className="mt-3 font-body text-xs text-emerald-600 dark:text-emerald-400">
                  All prerequisites satisfied.
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {prereqWarnings.map((w) => (
                    <div key={w.subjectId} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
                      <p className="font-body text-xs font-medium text-amber-800 dark:text-amber-200">
                        {w.subjectCode} — {w.descriptiveTitle}
                      </p>
                      <p className="mt-1 font-body text-xs text-amber-700 dark:text-amber-300">
                        Missing prerequisites:
                      </p>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {w.missing.map((m) => (
                          <li key={m.subjectId} className="font-body text-xs text-amber-700 dark:text-amber-300">
                            {m.subjectCode} — {m.descriptiveTitle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" block={false} onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" block={false} isLoading={isSaving} loadingLabel="Saving…">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
