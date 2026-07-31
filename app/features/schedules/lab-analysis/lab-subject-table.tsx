import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import type { LabSubjectRow } from "./aggregate-subjects";
import { yearLevelStyle } from "./year-level-styles";

export function LabSubjectTable({ rows }: { rows: LabSubjectRow[] }) {
  return (
    <Table>
      <TableHead>
        <TableHeader>Subject</TableHeader>
        <TableHeader>Title</TableHeader>
        <TableHeader className="text-center">Yr</TableHeader>
        <TableHeader className="text-right">Sessions</TableHeader>
        <TableHeader className="text-right">Hours</TableHeader>
        <TableHeader className="text-right">Share</TableHeader>
        <TableHeader>Sets</TableHeader>
        <TableHeader>Rooms</TableHeader>
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          const style = yearLevelStyle(row.yearLevel);
          return (
            <TableRow key={row.subjectId}>
              <TableCell className="whitespace-nowrap font-semibold text-navy-700 dark:text-mist-100">
                {row.subjectCode}
              </TableCell>
              <TableCell className="max-w-xs truncate">{row.descriptiveTitle}</TableCell>
              <TableCell className="text-center">
                {row.yearLevel != null && (
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded font-body text-xs ${style.chip}`}>
                    {row.yearLevel}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.sessions}</TableCell>
              <TableCell className="text-right tabular-nums">{row.hours}</TableCell>
              <TableCell className="text-right tabular-nums">{row.sharePercent}%</TableCell>
              <TableCell className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                {row.sets.join(", ")}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                {row.rooms.join(", ")}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
