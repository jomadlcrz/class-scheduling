import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/ui/icons";

type CurriculumFormProps = {
  programCode: string;
};

export function CurriculumForm({ programCode }: CurriculumFormProps) {
  const navigate = useNavigate();

  return (
    <Button
      type="button"
      block={false}
      onClick={() => navigate(`/subjects/new?program=${programCode}`)}
    >
      <PlusIcon />
      Add Subject
    </Button>
  );
}
