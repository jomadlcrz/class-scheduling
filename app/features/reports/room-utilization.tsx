import type { RoomUtilizationRow } from "~/services/report.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export function RoomUtilization({ rows }: { rows: RoomUtilizationRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center font-body text-sm text-slate-400">
        No room schedule data for this period.
      </p>
    );
  }

  const maxHours = Math.max(...rows.map((r) => r.totalHours), 1);

  return (
    <Table>
      <TableHead>
        <TableHeader>Room</TableHeader>
        <TableHeader className="text-center">Sessions</TableHeader>
        <TableHeader className="text-right">Total Hours</TableHeader>
        <TableHeader>Usage</TableHeader>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.roomId}>
            <TableCell>
              <p className="font-medium text-slate-800 dark:text-slate-100">{row.roomName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{row.buildingCode}</p>
            </TableCell>
            <TableCell className="text-center">{row.scheduledCount}</TableCell>
            <TableCell className="text-right font-medium text-navy-700 dark:text-mist-100">
              {row.totalHours.toFixed(1)} hrs
            </TableCell>
            <TableCell>
              <div className="h-2 w-30 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-2 rounded-full bg-gold-500 dark:bg-gold-400"
                  style={{ width: `${(row.totalHours / maxHours) * 100}%` }}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
