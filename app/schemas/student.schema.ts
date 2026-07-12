import { z } from "zod";

export const studentAccountSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const studentSchema = z.object({
  studentId: z.string().max(50, "Student ID must be at most 50 characters."),
  firstName: z
    .string()
    .min(1, "Enter the first name.")
    .max(100, "First name must be at most 100 characters."),
  midName: z.string().max(100, "Middle name must be at most 100 characters."),
  lastName: z
    .string()
    .min(1, "Enter the last name.")
    .max(100, "Last name must be at most 100 characters."),
  mobile: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/, "Enter a valid mobile number (7-15 digits, optional leading +)."),
  email: z.email("Enter a valid email address."),
  programId: z.coerce.number().int().positive("Select a program."),
  yearLevel: z.coerce.number().int().min(1, "Select a year level.").max(6),
  setId: z.coerce.number().int().positive("Select a set."),
  studentType: z.string().min(1, "Select a student type."),
  enrolledStatus: z.string().min(1, "Select an enrolled status."),
  syId: z.coerce.number().int().positive("Select a school year."),
  semId: z.coerce.number().int().positive("Select a semester."),
  subjectIds: z.array(z.number()).min(1, "Select at least one subject."),
});
