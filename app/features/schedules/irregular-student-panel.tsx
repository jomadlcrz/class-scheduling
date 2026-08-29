import { useState } from "react";
import { ImageViewer } from "~/components/ui/image-viewer";
import { ProfileAvatar } from "~/components/ui/profile-avatar";
import type { IrregularStudent } from "~/services/irregular-class.service";

type IrregularStudentPanelProps = {
  student: IrregularStudent | null;
};

export function IrregularStudentPanel({ student }: IrregularStudentPanelProps) {
  const subjects = student?.subjectsEnrolled ?? [];
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <h3 className="shrink-0 font-display text-sm tracking-wide text-navy-700 dark:text-mist-100">
        Selected Student
      </h3>

      <div className="shrink-0 flex items-center gap-3 rounded-xl border border-slate-300 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        {student?.profilePhotoUrl ? (
          <button
            type="button"
            onClick={() => setViewerSrc(student.profilePhotoUrl)}
            className="shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            aria-label="View profile photo"
          >
            <img
              src={student.profilePhotoUrl}
              alt={student.studentName}
              className="size-10 rounded-full object-cover"
            />
          </button>
        ) : student ? (
          <ProfileAvatar className="size-10" />
        ) : (
          <span
            aria-hidden="true"
            className="size-10 shrink-0 rounded-full bg-slate-100 dark:bg-white/10"
          />
        )}
        {student ? (
          <div className="flex flex-col">
            <span className="font-body text-sm font-semibold text-navy-800 dark:text-mist-100">
              {student.studentName}
            </span>
            <span className="font-body text-xs text-slate-500 dark:text-slate-400">
              {student.studentId ? `${student.studentId} · ` : ""}
              {student.programTaken || "—"}
            </span>
          </div>
        ) : (
          <p className="font-body text-sm text-slate-400 dark:text-slate-500">No student selected.</p>
        )}
      </div>

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="shrink-0 flex items-center justify-between">
          <h4 className="font-body text-sm font-semibold text-navy-700 dark:text-mist-100">
            Enrolled Subjects
          </h4>
          {subjects.length > 0 && (
            <span className="font-body text-xs text-slate-500 dark:text-slate-400">
              {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {!student ? (
          <p className="px-1 py-4 font-body text-sm text-slate-400 dark:text-slate-500">
            Select a student to view subjects.
          </p>
        ) : subjects.length === 0 ? (
          <p className="px-1 py-4 font-body text-sm text-slate-400 dark:text-slate-500">
            No enrolled subjects found for this student.
          </p>
        ) : (
          <ul className="scrollbar-none flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {subjects.map((s) => (
              <li
                key={s.subjectId}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-col">
                  <span className="font-body text-sm font-medium text-navy-800 dark:text-mist-100">
                    {s.subjectCode}
                  </span>
                  <span className="font-body text-xs text-slate-500 dark:text-slate-400">
                    {s.descTitle}
                  </span>
                </div>
                <span className="font-body text-xs text-slate-500 dark:text-slate-400">{s.units}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {viewerSrc && (
        <ImageViewer
          open={viewerSrc !== null}
          onClose={() => setViewerSrc(null)}
          src={viewerSrc}
          alt={student?.studentName ?? "Profile photo"}
        />
      )}
    </div>
  );
}
