import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input, PasswordInput } from "~/components/ui/input";
import { Modal, ModalActions } from "~/components/ui/modal";
import { SettingsRow } from "~/components/ui/settings-row";
import { Skeleton } from "~/components/ui/skeleton";
import { ProfilePictureModal } from "~/features/settings/photo-crop-modal";
import { SettingsPageHeader } from "~/features/settings/settings-page-header";
import { useAuth } from "~/hooks/use-auth";
import { useCachedData } from "~/hooks/use-cached-data";
import { profilePhotoService, type ProfilePhotoData } from "~/services/profile-photo.service";
import type { AddressData } from "~/types/student";

function ReadOnlySkeleton() {
  return <Skeleton className="h-5 w-32" />;
}

function readOnlyField(value: string | null | undefined) {
  return value ? (
    <p className="font-body text-sm text-navy-700 sm:pt-2 dark:text-mist-100">{value}</p>
  ) : (
    <p className="font-body text-sm text-slate-400 sm:pt-2 dark:text-slate-500">&mdash;</p>
  );
}

export function AccountDetails() {
  const { user } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
  const { data: profile, reload: reloadPhoto } = useCachedData<ProfilePhotoData>(
    "profile-photo",
    () => profilePhotoService.getPhoto(user!.role),
    { enabled: !!user },
  );
  const photoLoading = !user || (profile === null);
  const [address, setAddress] = useState<AddressData | null>(null);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    profilePhotoService.getAddress(user.role).then(setAddress).catch(() => setAddress(null));
  }, [user]);

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}`.toUpperCase();

  async function handleUpload(file: File): Promise<{ url: string; message: string }> {
    if (!user) throw new Error("Not logged in.");
    const result = await profilePhotoService.uploadPhoto(user.role, file);
    await reloadPhoto();
    window.dispatchEvent(new CustomEvent("profile-photo-changed"));
    return result;
  }

  async function handleRemove(): Promise<string> {
    if (!user) throw new Error("Not logged in.");
    const message = await profilePhotoService.removePhoto(user.role);
    await reloadPhoto();
    window.dispatchEvent(new CustomEvent("profile-photo-changed"));
    return message;
  }

  return (
    <div>
      <SettingsPageHeader title="Account Details" />

      <div className="mt-6 flex flex-col divide-y divide-slate-200 dark:divide-white/10">
        <SettingsRow label="Profile Picture">
          {photoLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="size-20 rounded-full" />
              <Skeleton className="h-3 w-48" />
            </div>
          ) : (
            <>
              <div className="h-20 w-20">
                <button
                  type="button"
                  aria-label="Change profile picture"
                  onClick={() => setProfilePictureModalOpen(true)}
                  className="group relative inline-flex size-20 cursor-pointer overflow-hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface"
                >
                  {profile?.profilePhotoUrl ? (
                    <img
                      src={profile.profilePhotoUrl}
                      alt="Profile"
                      className="size-full rounded-full object-cover transition-opacity duration-150 group-hover:opacity-90"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex size-full items-center justify-center rounded-full bg-navy-800 font-body text-2xl font-medium text-mist-100 transition-opacity duration-150 group-hover:opacity-90 dark:bg-white dark:text-navy-800"
                    >
                      {initials}
                    </span>
                  )}
                </button>
              </div>
              <p className="mt-3 font-body text-xs text-slate-400 dark:text-slate-500">
                Click the image to change your profile picture.
              </p>
            </>
          )}
        </SettingsRow>

        <SettingsRow label="First Name">
          {photoLoading ? (
            <ReadOnlySkeleton />
          ) : (
            readOnlyField(user.firstName)
          )}
        </SettingsRow>

        <SettingsRow label="Middle Name">
          {photoLoading ? (
            <ReadOnlySkeleton />
          ) : (
            readOnlyField(profile?.midName ?? null)
          )}
        </SettingsRow>

        <SettingsRow label="Last Name">
          {photoLoading ? (
            <ReadOnlySkeleton />
          ) : (
            readOnlyField(user.lastName)
          )}
        </SettingsRow>

        {user.role !== "admin" && (
          <SettingsRow label="Address">
            {address ? (
              <p className="font-body text-sm text-navy-700 sm:pt-2 dark:text-mist-100">
                {[address.street, address.barangay, address.cityMunicipality, address.province].filter(Boolean).join(", ")}
              </p>
            ) : (
              <p className="font-body text-sm text-slate-400 sm:pt-2 dark:text-slate-500">&mdash;</p>
            )}
          </SettingsRow>
        )}

        <SettingsRow label="Email Address">
          {photoLoading ? (
            <div className="flex items-center gap-3">
              <ReadOnlySkeleton />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <p className="min-w-0 truncate font-body text-sm text-navy-700 sm:pt-2 dark:text-mist-100">
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
          )}
        </SettingsRow>
      </div>

      {!photoLoading && (
        <>
          <ProfilePictureModal
            open={profilePictureModalOpen}
            onClose={() => setProfilePictureModalOpen(false)}
            photoUrl={profile?.profilePhotoUrl ?? null}
            initials={initials}
            onChanged={reloadPhoto}
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
                hint="If you change your email, you may need to reconfirm your account."
              />
              <PasswordInput
                id="change-email-password"
                label="Current Password"
                autoComplete="current-password"
              />
              <ModalActions>
                <Button
                  type="button"
                  variant="outline"
                  block={false}
                  onClick={() => setEmailModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" block={false}>Change Email</Button>
              </ModalActions>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
