/** Decorative mini schedule grid for the login branding panel. */
export function SchedulePreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  type Block = { day: number; row: number; label: string; gold: boolean };
  const blocks: Block[] = [
    { day: 0, row: 0, label: "CS 101", gold: true },
    { day: 1, row: 1, label: "MATH 2", gold: false },
    { day: 2, row: 0, label: "ENG 3", gold: true },
    { day: 3, row: 2, label: "PE 1", gold: false },
    { day: 4, row: 1, label: "HIS 4", gold: true },
    { day: 0, row: 2, label: "FIL 1", gold: false },
    { day: 2, row: 2, label: "SCI 2", gold: false },
    { day: 4, row: 0, label: "IT 3", gold: false },
  ];

  return (
    <div className="select-none text-left">
      <div className="mb-2 grid grid-cols-5 gap-1.5">
        {days.map((d) => (
          <div key={d} className="text-center font-body text-[10px] font-medium text-white/40">
            {d}
          </div>
        ))}
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="mb-1.5 grid grid-cols-5 gap-1.5">
          {days.map((_, col) => {
            const block = blocks.find((b) => b.day === col && b.row === row);
            return (
              <div
                key={col}
                className={`flex h-10 items-center justify-center rounded-md border text-center font-body text-[9px] font-medium leading-tight ${
                  block
                    ? block.gold
                      ? "border-gold-400/40 bg-gold-400/15 text-gold-300"
                      : "border-navy-300/30 bg-navy-300/10 text-navy-300"
                    : "border-white/5 bg-white/3"
                }`}
              >
                {block?.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
