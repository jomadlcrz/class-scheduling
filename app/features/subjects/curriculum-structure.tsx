import type { CreateSubjectInput } from "~/types/subject";

export type PendingEntry = CreateSubjectInput & { tempId: string };
