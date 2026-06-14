import { Link } from "react-router";
import { PlusIcon } from "../../components/ui/icons";

type CurriculumFormProps = {
  programCode: string;
};

export function CurriculumForm({ programCode }: CurriculumFormProps) {
  return (
    <Link
      to={`/subjects/new?program=${programCode}`}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-sans text-sm font-medium text-navy-700 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
    >
      <PlusIcon />
      Add Subject
    </Link>
  );
}
