import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input, inputClassName, PasswordInput } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { ConfirmDialog } from "~/components/ui/modal";
import { SettingsRow } from "~/components/ui/settings-row";
import { PhotoCropModal } from "~/features/settings/photo-crop-modal";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { useAuth } from "~/hooks/use-auth";
import { Breadcrumb } from "~/layouts/breadcrumb";
import { profilePhotoService } from "~/services/profile-photo.service";

export function ProfileSettings() {
  const { user } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(true);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhoto = useCallback(async () => {
    if (!user) return;
    try {
      const data = await profilePhotoService.getPhoto(user.role);
      setPhotoUrl(data.profilePhotoUrl);
    } catch {
      // Photo may not exist yet — that's fine.
    } finally {
      setPhotoLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPhoto();
  }, [fetchPhoto]);

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);
    e.target.value = "";
  }

  async function handleCropComplete(croppedFile: File) {
    if (!user) return;
    setUploading(true);
    try {
      const url = await profilePhotoService.uploadPhoto(user.role, croppedFile);
      setPhotoUrl(url);
      setCropOpen(false);
      toast.success("Profile photo updated.");
      window.dispatchEvent(new CustomEvent("profile-photo-changed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(cropSrc);
      setCropSrc("");
    }
  }

  async function handleRemovePhoto() {
    if (!user) return;
    setRemoving(true);
    try {
      await profilePhotoService.removePhoto(user.role);
      setPhotoUrl(null);
      setDeleteConfirmOpen(false);
      toast.success("Profile photo removed.");
      window.dispatchEvent(new CustomEvent("profile-photo-changed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Profile" }]} />
      <SettingsPageHeader title="Profile" />

      <div className="mt-6 flex flex-col divide-y divide-slate-200 dark:divide-white/10">
        <SettingsRow label="Profile Picture" hint="Click the image to change your profile picture.">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Change profile picture"
              onClick={() => fileInputRef.current?.click()}
              className="group relative inline-flex cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface"
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="size-20 rounded-full object-cover transition-opacity duration-150 group-hover:opacity-90"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid size-20 place-items-center rounded-full bg-navy-800 font-body text-2xl font-medium text-white transition-opacity duration-150 group-hover:opacity-90 dark:bg-white dark:text-navy-900"
                >
                  {photoLoading ? "…" : initials}
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col gap-1.5">
              <Button
                type="button"
                variant="outline"
                block={false}
                isLoading={uploading}
                loadingLabel="Uploading…"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoUrl ? "Change Photo" : "Upload Photo"}
              </Button>
              {photoUrl && (
                <Button
                  type="button"
                  variant="danger"
                  block={false}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Remove Photo
                </Button>
              )}
            </div>
          </div>
        </SettingsRow>

        <SettingsRow label="First Name" htmlFor="profile-first-name">
          <input
            id="profile-first-name"
            name="profile-first-name"
            type="text"
            defaultValue={user.firstName}
            className={inputClassName}
          />
        </SettingsRow>

        <SettingsRow label="Last Name" htmlFor="profile-last-name">
          <input
            id="profile-last-name"
            name="profile-last-name"
            type="text"
            defaultValue={user.lastName}
            className={inputClassName}
          />
        </SettingsRow>

        <SettingsRow label="Email Address">
          <div className="flex items-center gap-3">
            <p className="min-w-0 truncate font-body text-sm text-navy-700 dark:text-mist-100">
              {user.email}
            </p>
            <Button
              type="button"
              variant="outline"
              block={false}
              onClick={() => setEmailModalOpen(true)}
            >
              Change
            </Button>
          </div>
        </SettingsRow>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="button" block={false}>
          Update Profile
        </Button>
      </div>

      <PhotoCropModal
        open={cropOpen}
        onClose={() => {
          setCropOpen(false);
          URL.revokeObjectURL(cropSrc);
          setCropSrc("");
        }}
        imageSrc={cropSrc}
        onCropComplete={handleCropComplete}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Remove profile photo"
        confirmLabel="Remove"
        loadingLabel="Removing…"
        confirmVariant="danger"
        onConfirm={handleRemovePhoto}
      >
        Are you sure you want to remove your profile photo? Your initials will be shown instead.
      </ConfirmDialog>

      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Change Email">
        <div className="flex flex-col gap-4">
          <Input
            id="change-email-address"
            label="New Email Address"
            type="email"
            autoComplete="email"
            placeholder={user.email}
            hint="If you change your email, you may need to reconfirm your account."
          />
          <PasswordInput
            id="change-email-password"
            label="Current Password"
            autoComplete="current-password"
          />
          <Button type="button">Change Email</Button>
        </div>
      </Modal>
    </div>
  );
}
