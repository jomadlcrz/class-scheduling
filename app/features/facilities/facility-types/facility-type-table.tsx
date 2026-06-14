import { Badge } from "../../../components/ui/badge";
import { ROOM_TYPE_LABELS } from "../../../types/room";

const BUILT_IN_TYPES = [
  { type: "lecture", description: "Standard lecture classroom." },
  { type: "laboratory", description: "Computer or science laboratory." },
  { type: "office", description: "Administrative or faculty office." },
] as const;

export function FacilityTypeTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/3">
      <table className="w-full font-sans text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/8">
            <th className="px-5 py-3 text-left font-medium text-slate-400 dark:text-slate-500">
              Type
            </th>
            <th className="px-5 py-3 text-left font-medium text-slate-400 dark:text-slate-500">
              Description
            </th>
            <th className="px-5 py-3 text-left font-medium text-slate-400 dark:text-slate-500">
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {BUILT_IN_TYPES.map((item) => (
            <tr
              key={item.type}
              className="border-b border-slate-50 last:border-0 dark:border-white/5"
            >
              <td className="px-5 py-3 font-medium text-navy-700 dark:text-slate-200">
                {ROOM_TYPE_LABELS[item.type]}
              </td>
              <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.description}</td>
              <td className="px-5 py-3">
                <Badge tone="slate">Built-in</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
