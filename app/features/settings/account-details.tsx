import { useCallback, useEffect, useState } from "react";
import { inputClassName } from "~/components/ui/input";
import { SettingsRow } from "~/components/ui/settings-row";
import { ProfilePictureModal } from "~/features/settings/photo-crop-modal";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { useAuth } from "~/hooks/use-auth";
import { profilePhotoService } from "~/services/profile-photo.service";

export function AccountDetails() {
  const { user } = useAuth();
  const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(true);
  const [dbFirstName, setDbFirstName] = useState<string | null>(null);
  const [dbLastName, setDbLastName] = useState<string | null>(null);

  const fetchPhoto = useCallback(async () => {
    if (!user) return;
    try {
      const data = await profilePhotoService.getPhoto(user.role);
      setPhotoUrl(data.profilePhotoUrl);
      setDbFirstName(data.firstName);
      setDbLastName(data.lastName);
    } catch {
      // photo may not exist yet
    } finally {
      setPhotoLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPhoto();
  }, [fetchPhoto]);

  if (!user) return null;

  const displayFirstName = dbFirstName ?? user.firstName;
  const displayLastName = dbLastName ?? user.lastName;
  const initials = `${displayFirstName[0] ?? ""}${displayLastName[0] ?? ""}`.toUpperCase();

  async function handleUpload(file: File): Promise<{ url: string; message: string }> {
    const result = await profilePhotoService.uploadPhoto(user!.role, file);
    setPhotoUrl(result.url);
    return result;
  }

  async function handleRemove(): Promise<string> {
    const message = await profilePhotoService.removePhoto(user!.role);
    setPhotoUrl(null);
    return message;
  }

  return (
    <div>
      <SettingsPageHeader title="Account Details" />

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
                  className="flex size-full items-center justify-center rounded-full bg-navy-800 font-body text-2xl font-medium text-mist-100 transition-opacity duration-150 group-hover:opacity-90 dark:bg-white dark:text-navy-800"
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
            type="text"
            readOnly
            defaultValue={displayFirstName}
            className={inputClassName}
          />
        </SettingsRow>

        <SettingsRow label="Last Name" htmlFor="profile-last-name">
          <input
            id="profile-last-name"
            type="text"
            readOnly
            defaultValue={displayLastName}
            className={inputClassName}
          />
        </SettingsRow>

        <SettingsRow label="Email Address">
          <p className="min-w-0 truncate font-body text-sm text-navy-700 dark:text-mist-100">
            {user.email}
          </p>
        </SettingsRow>

        <SettingsRow label="Role">
          <span className="font-body text-sm capitalize text-navy-700 dark:text-mist-100">
            {user.role}
          </span>
        </SettingsRow>
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
    </div>
  );
}
