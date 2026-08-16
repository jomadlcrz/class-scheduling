import { ProfileAvatar } from "~/components/ui/profile-avatar";

type StudentAvatarProps = {
  firstName?: string;
  lastName?: string;
  /** Local blob/object URL or remote profile photo URL. */
  photoUrl?: string | null;
  gender?: string | null;
  size?: "md" | "lg";
};

/** Avatar with optional photo preview; falls back to the gender silhouette. */
export function StudentAvatar({ photoUrl, gender, size = "lg" }: StudentAvatarProps) {
  const dim = size === "lg" ? "size-24" : "size-14";
  return <ProfileAvatar src={photoUrl} gender={gender} className={`${dim} ring-4 ring-slate-100 dark:ring-white/10`} />;
}
