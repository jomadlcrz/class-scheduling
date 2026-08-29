type ProfileAvatarProps = {
  src?: string | null;
  alt?: string;
  className?: string;
};

/**
 * Standard neutral default profile avatar (similar to Facebook/Instagram),
 * rendering the user's photo when available or a clean neutral silhouette fallback.
 */
export function ProfileAvatar({ src, alt = "", className = "size-9" }: ProfileAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-400 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-[85%] translate-y-[12%]"
        aria-hidden="true"
      >
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}
