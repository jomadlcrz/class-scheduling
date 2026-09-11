import { Menu } from "@base-ui/react/menu";
import { CheckIcon, ChevronDownIcon } from "~/components/ui/icons";
import { FieldChrome } from "~/components/ui/input";
import type { Program } from "~/types/program";

type RoomProgramAccessFieldProps = {
  id: string;
  roomType: string;
  programIds: number[];
  programs: Program[];
  onChange: (programIds: number[]) => void;
  /** False = a teaching space college may not schedule into (e.g. an SHS
   *  classroom). Omit to hide the option entirely. */
  isCollegeRoom?: boolean;
  onCollegeRoomChange?: (isCollegeRoom: boolean) => void;
};

/**
 * Shared room access picker.
 *
 * An empty Lecture Room list is the backend's durable "All programs"
 * wildcard. Laboratories deliberately have no wildcard and must name at least
 * one program before the facility can be saved.
 *
 * "Not a college room" is a THIRD state, not an empty list. Selecting no
 * programs cannot mean "nobody may use this", because for a Lecture Room that
 * is precisely the wildcard that means the opposite — so a room the college
 * does not own (an SHS classroom in the SHS Building) needs a fact of its own.
 * It is stored on the room, outranks the access list, and is what keeps the
 * room out of every generator's pool.
 */
export function RoomProgramAccessField({
  id,
  roomType,
  programIds,
  programs,
  onChange,
  isCollegeRoom = true,
  onCollegeRoomChange,
}: RoomProgramAccessFieldProps) {
  if (roomType !== "Lecture Room" && roomType !== "Laboratory") return null;

  const usesAllProgramsWildcard =
    isCollegeRoom && roomType === "Lecture Room" && programIds.length === 0;
  const hasEveryProgram =
    programs.length > 0 && programs.every((program) => programIds.includes(program.id));
  const allProgramsSelected = usesAllProgramsWildcard || hasEveryProgram;
  const selectedLabel = !isCollegeRoom
    ? "None — not a college room"
    : allProgramsSelected
    ? "All programs"
    : programIds.length === 0
      ? "Select programs"
      : programs
          .filter((program) => programIds.includes(program.id))
          .map((program) => program.abbrev)
          .join(", ");

  function toggleProgram(programId: number) {
    if (usesAllProgramsWildcard) {
      onChange([programId]);
      return;
    }
    onChange(
      programIds.includes(programId)
        ? programIds.filter((id) => id !== programId)
        : [...programIds, programId],
    );
  }

  function selectAllPrograms() {
    onChange(
      roomType === "Lecture Room"
        ? []
        : programs.map((program) => program.id),
    );
  }

  return (
    <div className="mt-3">
      <FieldChrome
        id={id}
        label="Allowed Programs"
        hint={
          !isCollegeRoom
            ? "No college program may be scheduled here — auto-generation skips this room entirely."
            : roomType === "Lecture Room"
              ? "All programs are allowed by default. Select specific programs to restrict this room."
              : "A laboratory must have at least one explicitly selected program."
        }
      >
        <Menu.Root modal={false}>
          <Menu.Trigger
            id={id}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left font-body text-sm text-gray-900 outline-none transition-colors duration-150 focus-visible:border-gold-400 focus-visible:ring-2 focus-visible:ring-gold-400 data-popup-open:border-gold-400 data-popup-open:ring-2 data-popup-open:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-mist-100 dark:focus-visible:border-gold-400 dark:data-popup-open:border-gold-400"
          >
            <span className="min-w-0 truncate">{selectedLabel}</span>
            <span className="shrink-0 text-slate-400 dark:text-slate-500">
              <ChevronDownIcon />
            </span>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              sideOffset={6}
              align="start"
              collisionPadding={8}
              className="z-50 outline-none"
            >
              <Menu.Popup className="max-h-64 min-w-(--anchor-width) overflow-x-hidden overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none dark:border-white/10 dark:bg-surface-raised">
                {onCollegeRoomChange ? (
                  <>
                    <Menu.CheckboxItem
                      checked={!isCollegeRoom}
                      onCheckedChange={(checked) => onCollegeRoomChange(!checked)}
                      closeOnClick
                      className="relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 font-body text-sm font-semibold text-gray-900 outline-none data-highlighted:bg-slate-100 dark:text-mist-100 dark:data-highlighted:bg-white/10"
                    >
                      <span>None — not a college room</span>
                      <Menu.CheckboxItemIndicator className="shrink-0 text-blue-700 dark:text-blue-400">
                        <CheckIcon />
                      </Menu.CheckboxItemIndicator>
                    </Menu.CheckboxItem>
                    <div className="my-1 h-px bg-slate-200 dark:bg-white/10" />
                  </>
                ) : null}
                {roomType === "Lecture Room" || programs.length > 0 ? (
                  <Menu.CheckboxItem
                    checked={allProgramsSelected}
                    onCheckedChange={() => {
                      onCollegeRoomChange?.(true);
                      selectAllPrograms();
                    }}
                    closeOnClick
                    className="relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 font-body text-sm font-semibold text-gray-900 outline-none data-highlighted:bg-slate-100 dark:text-mist-100 dark:data-highlighted:bg-white/10"
                  >
                    <span>All programs</span>
                    <Menu.CheckboxItemIndicator className="shrink-0 text-blue-700 dark:text-blue-400">
                      <CheckIcon />
                    </Menu.CheckboxItemIndicator>
                  </Menu.CheckboxItem>
                ) : null}

                {programs.length === 0 ? (
                  <p className="px-3 py-2 font-body text-sm text-slate-400">
                    No programs available.
                  </p>
                ) : (
                  programs.map((program) => (
                    <Menu.CheckboxItem
                      key={program.id}
                      checked={
                        isCollegeRoom &&
                        !usesAllProgramsWildcard &&
                        programIds.includes(program.id)
                      }
                      onCheckedChange={() => {
                        onCollegeRoomChange?.(true);
                        toggleProgram(program.id);
                      }}
                      closeOnClick={false}
                      className="relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 font-body text-sm text-gray-900 outline-none data-highlighted:bg-slate-100 dark:text-mist-100 dark:data-highlighted:bg-white/10"
                    >
                      <span className="min-w-0 truncate">
                        {program.abbrev} — {program.name}
                      </span>
                      <Menu.CheckboxItemIndicator className="shrink-0 text-blue-700 dark:text-blue-400">
                        <CheckIcon />
                      </Menu.CheckboxItemIndicator>
                    </Menu.CheckboxItem>
                  ))
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </FieldChrome>
    </div>
  );
}
