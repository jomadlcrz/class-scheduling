import { useState, type ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { Drawer } from "~/components/ui/drawer";
import { InfoCircleIcon } from "~/components/ui/icons";

function Rule({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-slate-200/80 pb-5 last:border-b-0 last:pb-0 dark:border-white/10">
      <span className="grid size-8 place-items-center rounded-lg bg-gwc-blue/10 font-body text-xs font-semibold tabular-nums text-gwc-blue dark:bg-white/8 dark:text-sky-200">
        {number}
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-base tracking-wide text-navy-800 dark:text-mist-100">
          {title}
        </h3>
        <div className="mt-1.5 font-body text-sm leading-6 text-slate-600 dark:text-slate-300">
          {children}
        </div>
      </div>
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="ml-4 list-disc space-y-1.5 marker:text-gold-500">{children}</ul>;
}

export function ClassModePoliciesRulesDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        block={false}
        onClick={() => setOpen(true)}
      >
        <InfoCircleIcon size={16} />
        Rules
      </Button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Class Delivery Mode Rules"
        description="What each delivery mode means, what a policy here actually controls, and what it never touches."
      >
        <div className="flex flex-col gap-5 overscroll-contain">
          <Rule number={1} title="What this screen does">
            <List>
              <li>Say how a subject — or one section of it — is delivered: on campus, online, or a mix.</li>
              <li>The generator reads this before it builds a schedule and follows it.</li>
              <li><strong>Nothing here needs a policy.</strong> A subject with none is generated face-to-face, on campus, in a room — the same as every subject before this screen existed.</li>
            </List>
          </Rule>

          <Rule number={2} title="The delivery modes">
            <List>
              <li><strong>F2F (face-to-face)</strong> — on campus, in a room. The default.</li>
              <li><strong>Synchronous</strong> — everyone online at the same hour. Takes no room, but still takes the hour: the section and the instructor are both busy, the same as if it were in a room.</li>
              <li><strong>Asynchronous</strong> — online, in the students&rsquo; own time. Takes no room and no hour, so it never clashes with anything else on the timetable. It still counts toward the instructor&rsquo;s teaching load — preparing and marking the work is teaching, even with an empty-looking schedule.</li>
              <li><strong>Blended</strong> — partly on campus, partly online. You choose how many of the week&rsquo;s meetings run online; at least one meeting always stays in a room, or it is not really blended.</li>
            </List>
          </Rule>

          <Rule number={3} title="What a policy applies to">
            <List>
              <li><strong>One subject, one section</strong> overrides everything else for that section alone.</li>
              <li><strong>One subject</strong> covers every section taking it, for this term.</li>
              <li><strong>A subject type</strong> covers every subject of that type, for this term — the broadest reach, and the first thing to check when a section&rsquo;s mode looks unexpected.</li>
              <li>The most specific policy wins. A section-level policy always beats a subject-level one, which always beats a subject-type one.</li>
            </List>
          </Rule>

          <Rule number={4} title="A laboratory always stays on campus">
            <List>
              <li>A laboratory meeting is generated face-to-face no matter what the policy says — the lab is the equipment, and a lab session held online is a lecture about a lab.</li>
              <li>Marking a subject Synchronous, Asynchronous, or Blended only changes its <strong>lecture</strong> meetings. Its lab meetings still need a room.</li>
            </List>
          </Rule>

          <Rule number={5} title="What a policy does NOT do">
            <List>
              <li>It only shapes schedules the generator builds <strong>after</strong> the policy is saved. Meetings already saved keep the mode they were generated or saved with.</li>
              <li>It never overrides a mode a person chose by hand — a Dean&rsquo;s major-schedule meeting, or a manually edited slot, keeps the mode it was given even if a policy here later says otherwise.</li>
              <li>Deleting a policy is the same kind of change: the subject goes back to face-to-face the next time the term is generated, but nothing already saved is touched.</li>
            </List>
          </Rule>
        </div>
      </Drawer>
    </>
  );
}
