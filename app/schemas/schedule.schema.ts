import { z } from "zod";

export const scheduleSchema = z
  .object({
    subjectId: z.string().min(1, "Select a subject."),
    setId: z.string().min(1, "Select a set."),
    facultyId: z.string().min(1, "Select a faculty member."),
    roomId: z.string().min(1, "Select a room."),
    mode: z.enum(["F2F", "Online"]),
    day: z.string().min(1, "Select a day."),
    startTime: z.string().min(1, "Select start and end times."),
    endTime: z.string().min(1, "Select start and end times."),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });
