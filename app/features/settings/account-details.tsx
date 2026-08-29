import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { CropDialog } from "~/components/ui/crop-dialog";
import { FileChooser } from "~/components/ui/file-chooser";
import { ImageViewer } from "~/components/ui/image-viewer";
import { Input, PasswordInput } from "~/components/ui/input";
import { Modal, ModalActions, ConfirmDialog } from "~/components/ui/modal";
import { ProfileAvatar } from "~/components/ui/profile-avatar";
import { SettingsRow } from "~/components/ui/settings-row";
import { Skeleton } from "~/components/ui/skeleton";
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
  const [cropSrc, setCropSrc] = useState("");
  const [removing, setRemoving] = useState(false);
  const [photoRemoveOpen, setPhotoRemoveOpen] = useState(false);
  const [fullViewOpen, setFullViewOpen] = useState(false);
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

  const photoUrl = profile?.profilePhotoUrl ?? null;
  const isCropping = cropSrc !== "";

  async function handleUpload(file: File) {
    const result = await profilePhotoService.uploadPhoto(user!.role, file);
    await reloadPhoto();
    window.dispatchEvent(new CustomEvent("profile-photo-changed"));
    setCropSrc("");
    if (result.message) toast.success(result.message);
    setProfilePictureModalOpen(false);
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const message = await profilePhotoService.removePhoto(user!.role);
      await reloadPhoto();
      window.dispatchEvent(new CustomEvent("profile-photo-changed"));
      setProfilePictureModalOpen(false);
      if (message) toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setRemoving(false);
    }
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
                  <ProfileAvatar
                    src={profile?.profilePhotoUrl}
                    alt="Profile"
                    className="size-full transition-opacity duration-150 group-hover:opacity-90"
                  />
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
          <Modal
            open={profilePictureModalOpen && !isCropping}
            onClose={() => { setCropSrc(""); setProfilePictureModalOpen(false); }}
            title="Profile Picture"
          >
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                {photoUrl ? (
                  <button
                    type="button"
                    onClick={() => setFullViewOpen(true)}
                    className="cursor-pointer rounded-full transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
                  >
                    <img src={photoUrl} alt="Profile" className="size-24 rounded-full object-cover" />
                  </button>
                ) : <ProfileAvatar className="size-24" />}
              </div>

              {photoUrl && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Click the image to see full view.
                </p>
              )}

              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Upload new custom profile picture:
                </p>
                <FileChooser
                  id="profile-picture-file"
                  accept="image/jpeg,image/png,image/webp"
                  hint="It is recommended that you use an image that is at least 400×400 pixels."
                  onChange={(file) => setCropSrc(URL.createObjectURL(file))}
                />
              </div>

              <ModalActions>
                <Button type="button" variant="outline" block={false} onClick={() => setProfilePictureModalOpen(false)} disabled={removing}>
                  Cancel
                </Button>
                {photoUrl && (
                  <Button type="button" variant="danger" block={false} disabled={removing} onClick={() => setPhotoRemoveOpen(true)}>
                    Delete
                  </Button>
                )}
              </ModalActions>
            </div>
          </Modal>

          <ConfirmDialog
            open={photoRemoveOpen}
            onClose={() => setPhotoRemoveOpen(false)}
            title="Remove profile picture"
            confirmLabel="Remove"
            loadingLabel="Removing…"
            confirmVariant="danger"
            onConfirm={async () => {
              await handleRemove();
              setPhotoRemoveOpen(false);
            }}
          >
            <p className="font-body text-sm text-slate-600 dark:text-slate-300">
              This will permanently delete your custom profile picture.
            </p>
          </ConfirmDialog>

          <CropDialog
            open={profilePictureModalOpen && isCropping}
            imageSrc={cropSrc}
            aspect={1}
            cropShape="round"
            showGrid={false}
            title="Adjust Profile Photo"
            saveLabel="Save Photo"
            hint="Drag the image to position it, then click Save Photo."
            previewClassName="relative aspect-square w-80 overflow-hidden rounded-full"
            onClose={() => { setCropSrc(""); setProfilePictureModalOpen(false); }}
            onBack={() => setCropSrc("")}
            onSave={handleUpload}
          />

          {photoUrl && (
            <ImageViewer open={fullViewOpen} onClose={() => setFullViewOpen(false)} src={photoUrl} alt="Profile picture full view" />
          )}

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
                <Button type="button" variant="outline" block={false} onClick={() => setEmailModalOpen(false)}>
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
