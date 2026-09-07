import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { RoleGuard } from "~/auth/role-guard";
import { BottomSheet } from "~/components/ui/bottom-sheet";
import { CropDialog } from "~/components/ui/crop-dialog";
import {
  CameraIcon,
  ChevronRightIcon,
  ImageIcon,
  LockIcon,
  LogoutIcon,
  TrashIcon,
} from "~/components/ui/icons";
import { ConfirmDialog } from "~/components/ui/modal";
import { ProfileAvatar } from "~/components/ui/profile-avatar";
import { useTermContext } from "~/features/academic-terms/term-context-provider";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { useYearLevels } from "~/hooks/use-year-levels";
import { PageHeader } from "~/layouts/page-header";
import { ScreenHeader } from "~/components/ui/screen-header";
import { SectionHeader } from "~/components/ui/section-header";
import { profilePhotoService, type ProfilePhotoData } from "~/services/profile-photo.service";
import { studentService } from "~/services/student.service";
import type { RegistrationData } from "~/types/registration";
import type { AddressData } from "~/types/student";

export function meta() {
  return [
    { title: "Student Profile — GWC Class Scheduling" },
    { name: "description", content: "Student profile, credentials, and account settings." },
  ];
}

export default function ProfileRoute() {
  return (
    <RoleGuard allow={["student"]}>
      <StudentProfilePage />
    </RoleGuard>
  );
}

function StudentProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { yearLevelLabel } = useYearLevels();
  const { context: termContext } = useTermContext();
  const selectedTerm = termContext?.selection;

  const [editPhotoSheetOpen, setEditPhotoSheetOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [removing, setRemoving] = useState(false);
  const [photoRemoveOpen, setPhotoRemoveOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [address, setAddress] = useState<AddressData | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, reload: reloadPhoto } = useCachedData<ProfilePhotoData>(
    "profile-photo",
    () => profilePhotoService.getPhoto("student"),
    { enabled: !!user },
  );

  const { data: registration } = useCachedData<RegistrationData>(
    `student-profile-registration:${selectedTerm?.syId}:${selectedTerm?.semesterNumber}`,
    () =>
      studentService.getMyRegistration({
        syId: selectedTerm?.syId ?? undefined,
        semesterNumber: selectedTerm?.semesterNumber ?? undefined,
      }),
    { enabled: !!user },
  );

  useEffect(() => {
    profilePhotoService.getAddress("student").then(setAddress).catch(() => setAddress(null));
  }, []);

  if (!user) return null;

  const photoUrl = profile?.profilePhotoUrl ?? null;
  const isCropping = cropSrc !== "";

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCropSrc(URL.createObjectURL(file));
      setEditPhotoSheetOpen(false);
    }
    e.target.value = "";
  }

  async function handleUpload(file: File) {
    try {
      const result = await profilePhotoService.uploadPhoto("student", file);
      await reloadPhoto();
      window.dispatchEvent(new CustomEvent("profile-photo-changed"));
      setCropSrc("");
      setEditPhotoSheetOpen(false);
      if (result.message) toast.success(result.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload photo.";
      toast.error(msg);
    }
  }

  async function handleRemovePhoto() {
    setRemoving(true);
    try {
      const msg = await profilePhotoService.removePhoto("student");
      await reloadPhoto();
      window.dispatchEvent(new CustomEvent("profile-photo-changed"));
      setPhotoRemoveOpen(false);
      setEditPhotoSheetOpen(false);
      if (msg) toast.success(msg);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete photo.";
      toast.error(msg);
    } finally {
      setRemoving(false);
    }
  }

  async function handleConfirmLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch {
      setLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  }

  const meta = registration?.meta;
  const studentName =
    user.name ||
    meta?.full_name ||
    meta?.student_name ||
    registration?.student_name ||
    "Student";
  const rawStudentNo = (meta?.student_id || registration?.student_id)?.trim();
  const studentNo =
    rawStudentNo && rawStudentNo !== "-" && rawStudentNo !== "—"
      ? rawStudentNo
      : "No ID";
  const program =
    meta?.program_name ||
    registration?.program_name ||
    meta?.program_abbrev ||
    "—";
  const rawYear = meta?.year_level ?? registration?.year_level;
  const rawYearName = meta?.year_level_name;
  const resolvedYearLevel = (() => {
    if (rawYearName && rawYearName.trim() && rawYearName !== "-" && rawYearName !== "—") {
      return rawYearName.trim();
    }
    if (typeof rawYear === "number" && rawYear > 0) {
      return yearLevelLabel(rawYear);
    }
    return "—";
  })();

  const section = meta?.set_name || registration?.section || "";
  const status = meta?.enrolled_status || registration?.academic_status || "Enrolled";

  const yearAndSection = section && section !== "—" && section !== "-"
    ? section
    : resolvedYearLevel !== "—"
    ? resolvedYearLevel
    : "-";

  return (
    <div className="flex w-full flex-col">
      <ScreenHeader title="Profile" className="lg:hidden" />
      <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
        <div className="mb-6 hidden lg:block">
          <PageHeader title="Profile & Account" />
        </div>

      <div className="space-y-4">
        {/* Profile Hero Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 text-center shadow-xs dark:border-white/10 dark:bg-surface">
          <div className="flex flex-col items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setEditPhotoSheetOpen(true)}
                aria-label="Change profile photo"
                className="group relative block cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <ProfileAvatar
                  src={photoUrl}
                  alt={studentName}
                  className="size-20"
                />
                <span className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-gwc-blue text-white shadow-xs transition-transform group-hover:scale-105 dark:border-surface dark:bg-gwc-blue-bright">
                  <CameraIcon size={13} />
                </span>
              </button>
            </div>

            <div className="mt-3">
              <h2 className="font-heading text-xl font-bold tracking-tight text-navy-700 dark:text-mist-100">
                {studentName}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {user.email || "student@gwc.edu.ph"}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-gold-600 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-gold-300">
                  Verified student
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-gwc-blue dark:border-blue-900/40 dark:bg-gwc-blue-deep/60 dark:text-gwc-blue-soft">
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Details Section */}
        <div>
          <SectionHeader title="Academic Details" />
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-surface">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Student number
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {studentNo}
                </span>
              </div>

              <div className="h-px bg-slate-100 dark:bg-white/5" />

              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Program
                </span>
                <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {program}
                </span>
              </div>

              <div className="h-px bg-slate-100 dark:bg-white/5" />

              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Year & section
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {yearAndSection}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Address Section */}
        <div>
          <SectionHeader title="Registered Address" />
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-white/10 dark:bg-surface">
            {address ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Street address
                  </span>
                  <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {address.street || "N/A"}
                  </span>
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/5" />

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Barangay & city
                  </span>
                  <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {[address.barangay, address.cityMunicipality].filter(Boolean).join(", ") || "N/A"}
                  </span>
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/5" />

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    Province & postal
                  </span>
                  <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {[address.province, address.zipCode].filter(Boolean).join(", ") || "N/A"}
                  </span>
                </div>

                {address.region && (
                  <>
                    <div className="h-px bg-slate-100 dark:bg-white/5" />
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        Region
                      </span>
                      <span className="max-w-[65%] text-right text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {address.region}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                No home address on record. Contact the Registrar to update your records.
              </p>
            )}
          </div>
        </div>

        {/* Account & Security Section */}
        <div>
          <SectionHeader title="Account & Security" />
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white divide-y divide-slate-100 shadow-xs dark:border-white/10 dark:bg-surface dark:divide-white/5">
          <Link
            to="/settings/change-password"
            className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-gwc-blue dark:bg-gwc-blue-deep/60 dark:text-gwc-blue-soft">
                <LockIcon size={14} />
              </span>
              <div>
                <p className="text-sm font-bold text-navy-700 dark:text-mist-100">
                  Change Password
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Update your student portal account password
                </p>
              </div>
            </div>
            <ChevronRightIcon />
          </Link>

          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <LogoutIcon />
              </span>
              <div>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  Log Out
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sign out of your student session on this device
                </p>
              </div>
            </div>
            <ChevronRightIcon />
          </button>
        </div>
        </div>
      </div>

      {/* Edit Photo Bottom Sheet */}
      <BottomSheet
        open={editPhotoSheetOpen}
        onClose={() => setEditPhotoSheetOpen(false)}
        title="Profile Photo"
      >
        <div className="space-y-1 pt-1 pb-4">
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileSelected}
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={handleFileSelected}
          />

          {/* Take photo */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center gap-3.5 rounded-2xl p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 dark:active:bg-white/10"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-gwc-blue dark:bg-gwc-blue-deep/60 dark:text-gwc-blue-soft">
              <CameraIcon size={20} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy-950 dark:text-mist-100">
                Take photo
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Use your device camera
              </p>
            </div>
          </button>

          {/* Choose from library */}
          <button
            type="button"
            onClick={() => libraryInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center gap-3.5 rounded-2xl p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 dark:active:bg-white/10"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-gwc-blue dark:bg-gwc-blue-deep/60 dark:text-gwc-blue-soft">
              <ImageIcon size={20} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy-950 dark:text-mist-100">
                Choose from library
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Select an image from device
              </p>
            </div>
          </button>

          {/* Remove current photo */}
          {photoUrl ? (
            <button
              type="button"
              onClick={() => {
                setEditPhotoSheetOpen(false);
                setPhotoRemoveOpen(true);
              }}
              className="flex w-full cursor-pointer items-center gap-3.5 rounded-2xl p-3 text-left transition-colors hover:bg-rose-50/60 dark:hover:bg-rose-950/20 active:bg-rose-100/60 dark:active:bg-rose-950/30"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <TrashIcon size={20} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  Remove current photo
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Revert to initials avatar
                </p>
              </div>
            </button>
          ) : null}
        </div>
      </BottomSheet>

      {/* Crop Dialog */}
      <CropDialog
        open={isCropping}
        imageSrc={cropSrc}
        aspect={1}
        cropShape="round"
        showGrid={false}
        title="Adjust Profile Photo"
        saveLabel="Save photo"
        hint="Drag the image to position it, then click Save photo."
        previewClassName="relative aspect-square w-72 overflow-hidden rounded-full mx-auto"
        onClose={() => setCropSrc("")}
        onBack={() => {
          setCropSrc("");
          setEditPhotoSheetOpen(true);
        }}
        onSave={handleUpload}
      />

      {/* Confirm Remove Photo */}
      <ConfirmDialog
        open={photoRemoveOpen}
        onClose={() => setPhotoRemoveOpen(false)}
        title="Remove Profile Photo"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={handleRemovePhoto}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to remove your profile photo? Your initials will be displayed instead.
        </p>
      </ConfirmDialog>

      {/* Confirm Logout */}
      <ConfirmDialog
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="Log out of student portal"
        confirmLabel={loggingOut ? "Signing out…" : "Log out"}
        loadingLabel="Signing out…"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to end your active student session?
        </p>
      </ConfirmDialog>
      </div>
    </div>
  );
}
