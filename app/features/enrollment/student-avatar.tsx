import { ProfileAvatar } from "~/components/ui/profile-avatar";

type StudentAvatarProps = {
  firstName?: string;
  lastName?: string;
  /** Local blob/object URL or remote profile photo URL. */
  photoUrl?: string | null;
  size?: "md" | "lg";
};

/** Avatar with optional photo preview; falls back to default silhouette. */
export function StudentAvatar({ photoUrl, size = "lg" }: StudentAvatarProps) {
  const dim = size === "lg" ? "size-24" : "size-14";
  return <ProfileAvatar src={photoUrl} className={`${dim} ring-4 ring-slate-100 dark:ring-white/10`} />;
}
