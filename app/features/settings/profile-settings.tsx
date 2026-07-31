import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input, inputClassName, PasswordInput } from "~/components/ui/input";
import { Modal } from "~/components/ui/modal";
import { SettingsRow } from "~/components/ui/settings-row";
import { ProfilePictureModal } from "~/features/settings/photo-crop-modal";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { useAuth } from "~/hooks/use-auth";
import { profilePhotoService } from "~/services/profile-photo.service";

export function ProfileSettings() {
  const { user } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(true);

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

  const initials = `${user.firstName[0] ?? ""}`.toUpperCase();

  async function handleUpload(file: File): Promise<{ url: string; message: string }> {
    if (!user) throw new Error("Not logged in.");
    const result = await profilePhotoService.uploadPhoto(user.role, file);
    setPhotoUrl(result.url);
    return result;
  }

  async function handleRemove(): Promise<string> {
    if (!user) throw new Error("Not logged in.");
    const message = await profilePhotoService.removePhoto(user.role);
    setPhotoUrl(null);
    return message;
  }

  return (
    <div>
      <SettingsPageHeader title="Profile" />

      <div className="mt-6 flex flex-col divide-y divide-slate-200 dark:divide-white/10">
        <SettingsRow label="Profile Picture">
          <div className="h-20 w-20">
            <button
              type="button"
              aria-label="Change profile picture"
              onClick={() => setProfilePictureModalOpen(true)}
              className="group relative inline-flex size-20 cursor-pointer overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface"
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="size-full rounded-full object-cover transition-opacity duration-150 group-hover:opacity-90"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-full items-center justify-center rounded-full bg-navy-800 font-body text-2xl font-medium text-white transition-opacity duration-150 group-hover:opacity-90 dark:bg-white dark:text-navy-900"
                >
                  {photoLoading ? "…" : initials}
                </span>
              )}
            </button>
          </div>
          <p className="mt-3 font-body text-xs text-slate-400 dark:text-slate-500">
            Click the image to change your profile picture.
          </p>
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

      <ProfilePictureModal
        open={profilePictureModalOpen}
        onClose={() => setProfilePictureModalOpen(false)}
        photoUrl={photoUrl}
        initials={initials}
        onChanged={fetchPhoto}
        uploadPhoto={handleUpload}
        removePhoto={handleRemove}
      />

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
