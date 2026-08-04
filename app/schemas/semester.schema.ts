import { z } from "zod";

/** Matches backend SEMESTER_NAME_TO_NUMBER validation. */
export const SEMESTER_NAME_TO_NUMBER: Record<string, 1 | 2> = {
  "1st Semester": 1,
  "2nd Semester": 2,
  "First Semester": 1,
  "Second Semester": 2,
  "first semester": 1,
  "1st semester": 1,
  "second semester": 2,
  "2nd semester": 2,
};

export const SEMESTER_NUMBER_TO_NAME: Record<1 | 2, string> = {
  1: "1st Semester",
  2: "2nd Semester",
};

export const semesterWriteSchema = z
  .object({
    semester: z.string().min(1, "Enter a semester name.").max(20, "Keep it under 20 characters."),
    semesterNumber: z.union([z.literal(1), z.literal(2)]),
    semesterName: z.string().min(1, "Enter a semester name.").max(20, "Keep it under 20 characters."),
  })
  .superRefine((data, ctx) => {
    const mapped = SEMESTER_NAME_TO_NUMBER[data.semesterName];
    if (mapped != null && mapped !== data.semesterNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `semesterName "${data.semesterName}" does not match semesterNumber ${data.semesterNumber}.`,
        path: ["semesterName"],
      });
    }
  });

/** @deprecated use semesterWriteSchema */
export const semesterSchema = semesterWriteSchema;
