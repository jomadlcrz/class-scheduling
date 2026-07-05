import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { RoleGuard } from "../../auth/role-guard";
import { Card } from "../../components/ui/card";
import {
  ChevronRightIcon,
  GridIcon,
  LayoutIcon,
  ListIcon,
  UserSmallIcon,
} from "../../components/ui/icons";
import { ScheduleViewToggle } from "../../features/schedules/schedule-view-toggle";
import { PageHeader } from "../../layouts/page-header";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubjectType = "major_lab" | "major_no_lab" | "gen_ed";
type ClassroomStatus = "available" | "full";
type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

interface ClassEntry {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subjectCode: string;
  descriptiveTitle: string;
  instructor: string;
  section: string;
  type: SubjectType;
}

interface Classroom {
  id: string;
  name: string;
  status: ClassroomStatus;
  entries: ClassEntry[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_SLOTS = [
  { start: "7:00 AM",  end: "8:30 AM"  },
  { start: "8:30 AM",  end: "10:00 AM" },
  { start: "10:00 AM", end: "11:30 AM" },
  { start: "11:30 AM", end: "1:00 PM"  },
  { start: "1:00 PM",  end: "2:30 PM"  },
  { start: "2:30 PM",  end: "4:00 PM"  },
  { start: "4:00 PM",  end: "5:30 PM"  },
  { start: "4:30 PM",  end: "6:00 PM"  },
];

const DAY_STYLES: Record<DayOfWeek, { color: string; bg: string; border: string }> = {
  Monday:    { color: "text-red-600 dark:text-red-400",    bg: "bg-red-100 dark:bg-red-950/50",    border: "border-red-200 dark:border-red-900"    },
  Tuesday:   { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-900" },
  Wednesday: { color: "text-red-600 dark:text-red-400",    bg: "bg-red-100 dark:bg-red-950/50",    border: "border-red-200 dark:border-red-900"    },
  Thursday:  { color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-900" },
  Friday:    { color: "text-red-600 dark:text-red-400",    bg: "bg-red-100 dark:bg-red-950/50",    border: "border-red-200 dark:border-red-900"    },
  Saturday:  { color: "text-pink-700 dark:text-pink-400",  bg: "bg-pink-100 dark:bg-pink-950/50",  border: "border-pink-200 dark:border-pink-900"  },
};

const TYPE_STYLES: Record<SubjectType, { card: string; border: string; code: string; tableCode: string; dot: string }> = {
  major_lab:    { card: "bg-blue-100 dark:bg-blue-950/60",    border: "border-l-blue-500",    code: "text-blue-800 dark:text-blue-300",    tableCode: "text-blue-600 dark:text-blue-400",    dot: "bg-blue-500"    },
  major_no_lab: { card: "bg-green-100 dark:bg-green-950/60",  border: "border-l-green-500",   code: "text-green-800 dark:text-green-300",  tableCode: "text-green-600 dark:text-green-400",  dot: "bg-green-500"   },
  gen_ed:       { card: "bg-violet-100 dark:bg-violet-950/60", border: "border-l-violet-600", code: "text-violet-800 dark:text-violet-300", tableCode: "text-violet-600 dark:text-violet-400", dot: "bg-violet-600"  },
};

const SCHOOL_YEARS = ["2024 – 2025", "2023 – 2024", "2022 – 2023"];
const SEMESTERS    = ["1st Semester", "2nd Semester", "Summer"];
const BUILDINGS    = ["All Buildings", "Science Building", "Main Building", "Engineering Hall"];

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_CLASSROOMS: Classroom[] = [
  {
    id: "cl-101",
    name: "CL-101",
    status: "available",
    entries: [
      { day: "Monday",    startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "IT101",   descriptiveTitle: "Introduction to Computing",     instructor: "Beltran",    section: "BSIT 1–A",  type: "major_lab"    },
      { day: "Monday",    startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "CS201",   descriptiveTitle: "Data Structures",               instructor: "Dela Cruz",  section: "BSCS 2–A",  type: "major_lab"    },
      { day: "Monday",    startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "MATH101", descriptiveTitle: "College Algebra",               instructor: "Santos",     section: "BSIT 1–A",  type: "gen_ed"       },
      { day: "Monday",    startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "HUM101",  descriptiveTitle: "Humanities & the Arts",         instructor: "Aquino",     section: "BSIT 1–A",  type: "gen_ed"       },
      { day: "Monday",    startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "ENG101",  descriptiveTitle: "English Communication",         instructor: "Reyes",      section: "BSIT 1–A",  type: "gen_ed"       },
      { day: "Monday",    startTime: "2:30 PM",  endTime: "4:00 PM",  subjectCode: "PHYS101", descriptiveTitle: "General Physics",               instructor: "Villanueva", section: "BSIT 1–A",  type: "major_no_lab" },
      { day: "Monday",    startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "CS205",   descriptiveTitle: "Data Structures Lab",           instructor: "Dela Cruz",  section: "BSCS 2–B",  type: "major_lab"    },
      { day: "Tuesday",   startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "IT102",   descriptiveTitle: "Computer Programming",          instructor: "Manuel",     section: "BSIT 1–B",  type: "major_lab"    },
      { day: "Tuesday",   startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "MATH102", descriptiveTitle: "Pre-Calculus",                  instructor: "Lapid",      section: "BSIT 1–B",  type: "gen_ed"       },
      { day: "Tuesday",   startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "STS101",  descriptiveTitle: "Science, Technology & Society", instructor: "Reyes",      section: "BSIT 1–B",  type: "gen_ed"       },
      { day: "Tuesday",   startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "IT103",   descriptiveTitle: "Database Systems",              instructor: "Ramos",      section: "BSIT 2–A",  type: "major_no_lab" },
      { day: "Tuesday",   startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "IT108",   descriptiveTitle: "Web Systems & Tech Lab",        instructor: "Beltran",    section: "BSIT 2–A",  type: "major_lab"    },
      { day: "Wednesday", startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "CS202",   descriptiveTitle: "Discrete Structures",           instructor: "Ramos",      section: "BSCS 2–A",  type: "major_no_lab" },
      { day: "Wednesday", startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "ENG102",  descriptiveTitle: "Technical Writing",             instructor: "Dela Cruz",  section: "BSIT 1–A",  type: "gen_ed"       },
      { day: "Wednesday", startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "PHYS101", descriptiveTitle: "General Physics",               instructor: "Villanueva", section: "BSIT 1–A",  type: "major_no_lab" },
      { day: "Wednesday", startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "IT106",   descriptiveTitle: "Data Communications",           instructor: "Beltran",    section: "BSIT 2–A",  type: "major_no_lab" },
      { day: "Wednesday", startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "MATH101", descriptiveTitle: "College Algebra",               instructor: "Santos",     section: "BSIT 1–A",  type: "gen_ed"       },
      { day: "Wednesday", startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "CS206",   descriptiveTitle: "Numerical Methods",             instructor: "Santos",     section: "BSCS 2–B",  type: "major_no_lab" },
      { day: "Thursday",  startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "IT104",   descriptiveTitle: "Web Development",               instructor: "Beltran",    section: "BSIT 2–A",  type: "major_lab"    },
      { day: "Thursday",  startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "CS203",   descriptiveTitle: "Algorithms & Complexity",       instructor: "Dela Cruz",  section: "BSCS 2–A",  type: "major_no_lab" },
      { day: "Thursday",  startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "CS204",   descriptiveTitle: "Logic Design",                  instructor: "Dela Cruz",  section: "BSCS 2–A",  type: "major_lab"    },
      { day: "Thursday",  startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "SOC101",  descriptiveTitle: "Sociology",                     instructor: "Rangel",     section: "BSIT 1–A",  type: "gen_ed"       },
      { day: "Thursday",  startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "MATH104", descriptiveTitle: "Linear Algebra",                instructor: "Lapid",      section: "BSCS 2–A",  type: "gen_ed"       },
      { day: "Friday",    startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "MATH103", descriptiveTitle: "Statistics",                    instructor: "Lapid",      section: "BSIT 2–B",  type: "gen_ed"       },
      { day: "Friday",    startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "IT105",   descriptiveTitle: "Network Fundamentals",          instructor: "Manuel",     section: "BSIT 2–B",  type: "major_no_lab" },
      { day: "Friday",    startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "GE107",   descriptiveTitle: "Life & Works of Rizal",         instructor: "Santos",     section: "BSIT 2–B",  type: "gen_ed"       },
      { day: "Friday",    startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "PE101",   descriptiveTitle: "Physical Education",            instructor: "Cabrera",    section: "BSIT 1–A",  type: "gen_ed"       },
      { day: "Friday",    startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "IT109",   descriptiveTitle: "Software Design Patterns",      instructor: "Ramos",      section: "BSIT 3–B",  type: "major_no_lab" },
      { day: "Saturday",  startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "IT107",   descriptiveTitle: "Systems Integration",           instructor: "Manuel",     section: "BSIT 3–A",  type: "major_no_lab" },
      { day: "Saturday",  startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "IT110",   descriptiveTitle: "IT Elective I",                 instructor: "Manuel",     section: "BSIT 3–A",  type: "major_no_lab" },
    ],
  },
  {
    id: "cl-102",
    name: "CL-102",
    status: "full",
    entries: [
      { day: "Monday",    startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "CS301",   descriptiveTitle: "Operating Systems",              instructor: "Cruz",       section: "BSCS 3–A",  type: "major_no_lab" },
      { day: "Monday",    startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "IT201",   descriptiveTitle: "Object-Oriented Programming",    instructor: "Santos",     section: "BSIT 2–A",  type: "major_lab"    },
      { day: "Monday",    startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "GE101",   descriptiveTitle: "Ethics & Values",                instructor: "Reyes",      section: "BSIT 2–B",  type: "gen_ed"       },
      { day: "Monday",    startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "CS312",   descriptiveTitle: "Parallel Computing",             instructor: "Lim",        section: "BSCS 4–A",  type: "major_no_lab" },
      { day: "Monday",    startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "CS302",   descriptiveTitle: "Computer Architecture",          instructor: "Lim",        section: "BSCS 3–A",  type: "major_no_lab" },
      { day: "Monday",    startTime: "2:30 PM",  endTime: "4:00 PM",  subjectCode: "MATH201", descriptiveTitle: "Calculus I",                     instructor: "Gomez",      section: "BSCS 2–B",  type: "gen_ed"       },
      { day: "Monday",    startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "CS315",   descriptiveTitle: "Advanced Algorithms",            instructor: "Lim",        section: "BSCS 4–B",  type: "major_no_lab" },
      { day: "Monday",    startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "CS318",   descriptiveTitle: "Research Methods in CS",         instructor: "Lim",        section: "BSCS 3–A",  type: "major_no_lab" },
      { day: "Tuesday",   startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "IT202",   descriptiveTitle: "System Analysis & Design",       instructor: "Villanueva", section: "BSIT 3–A",  type: "major_no_lab" },
      { day: "Tuesday",   startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "CS303",   descriptiveTitle: "Software Engineering",           instructor: "Dela Cruz",  section: "BSCS 3–B",  type: "major_no_lab" },
      { day: "Tuesday",   startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "GE102",   descriptiveTitle: "Purposive Communication",        instructor: "Ramos",      section: "BSIT 1–A",  type: "gen_ed"       },
      { day: "Tuesday",   startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "IT212",   descriptiveTitle: "IoT & Embedded Systems",         instructor: "Villanueva", section: "BSIT 4–B",  type: "major_lab"    },
      { day: "Tuesday",   startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "IT203",   descriptiveTitle: "Human-Computer Interaction",     instructor: "Beltran",    section: "BSIT 3–B",  type: "major_no_lab" },
      { day: "Tuesday",   startTime: "2:30 PM",  endTime: "4:00 PM",  subjectCode: "CS304",   descriptiveTitle: "Theory of Computation",          instructor: "Manuel",     section: "BSCS 3–A",  type: "major_no_lab" },
      { day: "Tuesday",   startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "IT215",   descriptiveTitle: "Thesis Writing I",               instructor: "Villanueva", section: "BSIT 4–A",  type: "major_no_lab" },
      { day: "Tuesday",   startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "IT218",   descriptiveTitle: "Professional Ethics in IT",      instructor: "Reyes",      section: "BSIT 3–B",  type: "gen_ed"       },
      { day: "Wednesday", startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "IT204",   descriptiveTitle: "Mobile Application Dev",         instructor: "Lapid",      section: "BSIT 3–A",  type: "major_lab"    },
      { day: "Wednesday", startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "GE103",   descriptiveTitle: "Contemporary World",             instructor: "Santos",     section: "BSIT 2–A",  type: "gen_ed"       },
      { day: "Wednesday", startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "CS305",   descriptiveTitle: "Compiler Design",                instructor: "Cruz",       section: "BSCS 3–B",  type: "major_no_lab" },
      { day: "Wednesday", startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "CS313",   descriptiveTitle: "Computer Vision",                instructor: "Dela Cruz",  section: "BSCS 4–B",  type: "major_no_lab" },
      { day: "Wednesday", startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "IT205",   descriptiveTitle: "Information Security",           instructor: "Reyes",      section: "BSIT 3–B",  type: "major_no_lab" },
      { day: "Wednesday", startTime: "2:30 PM",  endTime: "4:00 PM",  subjectCode: "MATH202", descriptiveTitle: "Calculus II",                    instructor: "Gomez",      section: "BSCS 2–B",  type: "gen_ed"       },
      { day: "Wednesday", startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "CS316",   descriptiveTitle: "Quantum Computing Intro",        instructor: "Cruz",       section: "BSCS 4–A",  type: "major_no_lab" },
      { day: "Wednesday", startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "CS319",   descriptiveTitle: "Advanced Database Systems",      instructor: "Cruz",       section: "BSCS 3–B",  type: "major_no_lab" },
      { day: "Thursday",  startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "CS306",   descriptiveTitle: "Artificial Intelligence",        instructor: "Dela Cruz",  section: "BSCS 3–A",  type: "major_no_lab" },
      { day: "Thursday",  startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "IT206",   descriptiveTitle: "Cloud Computing",                instructor: "Villanueva", section: "BSIT 3–A",  type: "major_no_lab" },
      { day: "Thursday",  startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "GE104",   descriptiveTitle: "Readings in Philippine History", instructor: "Rangel",     section: "BSIT 1–B",  type: "gen_ed"       },
      { day: "Thursday",  startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "IT213",   descriptiveTitle: "Digital Forensics",              instructor: "Manuel",     section: "BSIT 4–A",  type: "major_no_lab" },
      { day: "Thursday",  startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "IT207",   descriptiveTitle: "Capstone Project I",             instructor: "Manuel",     section: "BSIT 4–A",  type: "major_lab"    },
      { day: "Thursday",  startTime: "2:30 PM",  endTime: "4:00 PM",  subjectCode: "CS307",   descriptiveTitle: "Computer Networks",              instructor: "Beltran",    section: "BSCS 3–B",  type: "major_no_lab" },
      { day: "Thursday",  startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "IT216",   descriptiveTitle: "Augmented Reality Dev",          instructor: "Dela Cruz",  section: "BSIT 4–B",  type: "major_lab"    },
      { day: "Thursday",  startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "IT219",   descriptiveTitle: "Free & Open Source SW",         instructor: "Villanueva", section: "BSIT 3–A",  type: "major_no_lab" },
      { day: "Friday",    startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "IT208",   descriptiveTitle: "Software Testing",               instructor: "Lapid",      section: "BSIT 3–B",  type: "major_no_lab" },
      { day: "Friday",    startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "CS308",   descriptiveTitle: "Machine Learning",               instructor: "Cruz",       section: "BSCS 3–A",  type: "major_no_lab" },
      { day: "Friday",    startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "GE105",   descriptiveTitle: "Understanding the Self",         instructor: "Reyes",      section: "BSIT 2–B",  type: "gen_ed"       },
      { day: "Friday",    startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "CS314",   descriptiveTitle: "Natural Language Processing",    instructor: "Cruz",       section: "BSCS 4–A",  type: "major_no_lab" },
      { day: "Friday",    startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "IT209",   descriptiveTitle: "Enterprise Architecture",        instructor: "Santos",     section: "BSIT 4–A",  type: "major_no_lab" },
      { day: "Friday",    startTime: "2:30 PM",  endTime: "4:00 PM",  subjectCode: "CS309",   descriptiveTitle: "Data Science",                   instructor: "Dela Cruz",  section: "BSCS 3–B",  type: "major_no_lab" },
      { day: "Friday",    startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "CS317",   descriptiveTitle: "Distributed Systems",            instructor: "Manuel",     section: "BSCS 4–B",  type: "major_no_lab" },
      { day: "Friday",    startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "CS320",   descriptiveTitle: "Game Development",               instructor: "Dela Cruz",  section: "BSCS 3–A",  type: "major_lab"    },
      { day: "Saturday",  startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "IT210",   descriptiveTitle: "IT Project Management",          instructor: "Villanueva", section: "BSIT 4–B",  type: "major_no_lab" },
      { day: "Saturday",  startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "CS310",   descriptiveTitle: "Cybersecurity",                  instructor: "Manuel",     section: "BSCS 4–A",  type: "major_no_lab" },
      { day: "Saturday",  startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "GE106",   descriptiveTitle: "Art Appreciation",               instructor: "Cabrera",    section: "BSIT 1–A",  type: "gen_ed"       },
      { day: "Saturday",  startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "IT214",   descriptiveTitle: "DevOps & CI/CD",                 instructor: "Beltran",    section: "BSIT 4–B",  type: "major_no_lab" },
      { day: "Saturday",  startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "IT211",   descriptiveTitle: "Capstone Project II",            instructor: "Beltran",    section: "BSIT 4–A",  type: "major_lab"    },
      { day: "Saturday",  startTime: "2:30 PM",  endTime: "4:00 PM",  subjectCode: "CS311",   descriptiveTitle: "Blockchain Technology",          instructor: "Cruz",       section: "BSCS 4–B",  type: "major_no_lab" },
      { day: "Saturday",  startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "IT217",   descriptiveTitle: "Thesis Writing II",              instructor: "Beltran",    section: "BSIT 4–A",  type: "major_no_lab" },
      { day: "Saturday",  startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "IT220",   descriptiveTitle: "IT Special Topics",              instructor: "Manuel",     section: "BSIT 3–B",  type: "major_no_lab" },
    ],
  },
  {
    id: "cl-103",
    name: "CL-103",
    status: "available",
    entries: [
      { day: "Monday",    startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "ACC101",  descriptiveTitle: "Financial Accounting",           instructor: "Torres",     section: "BSAC 1–A",  type: "major_no_lab" },
      { day: "Monday",    startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "MGT101",  descriptiveTitle: "Principles of Management",       instructor: "Flores",     section: "BSMGT 1–A", type: "major_no_lab" },
      { day: "Monday",    startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "FIN101",  descriptiveTitle: "Financial Management",           instructor: "Torres",     section: "BSMGT 2–A", type: "major_no_lab" },
      { day: "Monday",    startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "ECO101",  descriptiveTitle: "Economics",                     instructor: "Perez",      section: "BSAC 1–A",  type: "gen_ed"       },
      { day: "Monday",    startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "MKT102",  descriptiveTitle: "Consumer Behavior",              instructor: "Flores",     section: "BSMGT 2–B", type: "major_no_lab" },
      { day: "Tuesday",   startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "ACC102",  descriptiveTitle: "Managerial Accounting",          instructor: "Torres",     section: "BSAC 2–A",  type: "major_no_lab" },
      { day: "Tuesday",   startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "MGT102",  descriptiveTitle: "Business Ethics",                instructor: "Flores",     section: "BSMGT 2–A", type: "gen_ed"       },
      { day: "Tuesday",   startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "MKT101",  descriptiveTitle: "Principles of Marketing",        instructor: "Flores",     section: "BSMGT 1–B", type: "major_no_lab" },
      { day: "Tuesday",   startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "FIN103",  descriptiveTitle: "Corporate Finance",              instructor: "Perez",      section: "BSMGT 4–A", type: "major_no_lab" },
      { day: "Wednesday", startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "ACC103",  descriptiveTitle: "Cost Accounting",                instructor: "Torres",     section: "BSAC 2–B",  type: "major_no_lab" },
      { day: "Wednesday", startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "ACC105",  descriptiveTitle: "Tax Accounting",                 instructor: "Torres",     section: "BSAC 3–B",  type: "major_no_lab" },
      { day: "Wednesday", startTime: "1:00 PM",  endTime: "2:30 PM",  subjectCode: "ECO102",  descriptiveTitle: "Macroeconomics",                 instructor: "Perez",      section: "BSAC 2–A",  type: "gen_ed"       },
      { day: "Wednesday", startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "ACC106",  descriptiveTitle: "Government Accounting",          instructor: "Torres",     section: "BSAC 4–A",  type: "major_no_lab" },
      { day: "Thursday",  startTime: "8:30 AM",  endTime: "10:00 AM", subjectCode: "MGT103",  descriptiveTitle: "Organizational Behavior",        instructor: "Flores",     section: "BSMGT 2–B", type: "major_no_lab" },
      { day: "Thursday",  startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "ACC104",  descriptiveTitle: "Auditing Principles",            instructor: "Torres",     section: "BSAC 3–A",  type: "major_no_lab" },
      { day: "Thursday",  startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "MGT105",  descriptiveTitle: "Operations Management",          instructor: "Flores",     section: "BSMGT 3–B", type: "major_no_lab" },
      { day: "Thursday",  startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "ACC107",  descriptiveTitle: "Advanced Accounting",            instructor: "Torres",     section: "BSAC 4–B",  type: "major_no_lab" },
      { day: "Friday",    startTime: "7:00 AM",  endTime: "8:30 AM",  subjectCode: "MGT104",  descriptiveTitle: "Strategic Management",           instructor: "Flores",     section: "BSMGT 3–A", type: "major_no_lab" },
      { day: "Friday",    startTime: "10:00 AM", endTime: "11:30 AM", subjectCode: "ECO103",  descriptiveTitle: "Microeconomics",                 instructor: "Perez",      section: "BSAC 3–A",  type: "gen_ed"       },
      { day: "Friday",    startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "ECO104",  descriptiveTitle: "International Economics",        instructor: "Perez",      section: "BSAC 4–A",  type: "gen_ed"       },
      { day: "Friday",    startTime: "4:00 PM",  endTime: "5:30 PM",  subjectCode: "MGT106",  descriptiveTitle: "Entrepreneurship",               instructor: "Flores",     section: "BSMGT 4–A", type: "major_no_lab" },
      { day: "Saturday",  startTime: "11:30 AM", endTime: "1:00 PM",  subjectCode: "FIN102",  descriptiveTitle: "Investment Management",          instructor: "Torres",     section: "BSMGT 3–A", type: "major_no_lab" },
      { day: "Saturday",  startTime: "4:30 PM",  endTime: "6:00 PM",  subjectCode: "MGT107",  descriptiveTitle: "Business Research Methods",      instructor: "Flores",     section: "BSMGT 4–B", type: "major_no_lab" },
    ],
  },
];

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useDragScroll(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let savedLeft = 0;

    const down = (e: MouseEvent) => {
      isDown = true;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
      startX = e.pageX - el.offsetLeft;
      savedLeft = el.scrollLeft;
    };
    const end = () => {
      isDown = false;
      el.style.cursor = "grab";
      el.style.userSelect = "";
    };
    const move = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      el.scrollLeft = savedLeft - (e.pageX - el.offsetLeft - startX) * 1.5;
    };

    el.addEventListener("mousedown", down);
    el.addEventListener("mouseleave", end);
    el.addEventListener("mouseup", end);
    el.addEventListener("mousemove", move);
    return () => {
      el.removeEventListener("mousedown", down);
      el.removeEventListener("mouseleave", end);
      el.removeEventListener("mouseup", end);
      el.removeEventListener("mousemove", move);
    };
  }, [ref]);
}

// ── Route ──────────────────────────────────────────────────────────────────────

export function meta() {
  return [
    { title: "Classroom Mapping — GWC Class Scheduling" },
    { name: "description", content: "Weekly schedule and availability for all classrooms." },
  ];
}

export default function ClassroomMappingRoute() {
  return (
    <RoleGuard allow={["admin", "registrar", "dean"]}>
      <ClassroomMappingPage />
    </RoleGuard>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function ClassroomMappingPage() {
  const [schoolYear, setSchoolYear] = useState(SCHOOL_YEARS[0]);
  const [semester, setSemester]     = useState(SEMESTERS[0]);
  const [building, setBuilding]     = useState(BUILDINGS[0]);
  const [rawSearch, setRawSearch]   = useState("");
  const [viewMode, setViewMode]     = useState<"grid" | "list">("grid");
  const [openRooms, setOpenRooms]   = useState<Set<string>>(new Set(["cl-101"]));

  const search = useDeferredValue(rawSearch);

  const filtered = useMemo(
    () => MOCK_CLASSROOMS.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const toggleRoom = (id: string) =>
    setOpenRooms(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allOpen  = filtered.length > 0 && filtered.every(c => openRooms.has(c.id));
  const toggleAll = () =>
    setOpenRooms(allOpen ? new Set() : new Set(filtered.map(c => c.id)));

  return (
    <>
      <PageHeader
        title="Classroom Mapping"
        description="Weekly schedule and availability for all classrooms by room."
      />

      {/* Filter toolbar */}
      <div className="mt-4 flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
          <div className="grid grid-cols-3 gap-3">
            <SelectField
              label="School Year"
              id="cm-year"
              value={schoolYear}
              onChange={setSchoolYear}
              options={SCHOOL_YEARS}
            />
            <SelectField
              label="Semester"
              id="cm-sem"
              value={semester}
              onChange={setSemester}
              options={SEMESTERS}
            />
            <SelectField
              label="Building"
              id="cm-building"
              value={building}
              onChange={setBuilding}
              options={BUILDINGS}
            />
          </div>

          <div className="relative w-full md:self-end">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={rawSearch}
              onChange={e => setRawSearch(e.target.value)}
              placeholder="Search classrooms…"
              aria-label="Search classrooms"
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 font-sans text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Controls row: responsive legend with expand / toggle around it */}
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex justify-center md:hidden">
          <TypeLegend />
        </div>

        <div className="flex items-center justify-between gap-3 md:hidden">
          <button
            type="button"
            onClick={toggleAll}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-sans text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>

          <ScheduleViewToggle
            value={viewMode}
            onChange={setViewMode}
            ariaLabel="Classroom view"
            options={[
              { mode: "grid", title: "Grid view", Icon: GridIcon },
              { mode: "list", title: "List view", Icon: ListIcon },
            ]}
          />
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={toggleAll}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-sans text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>

          <div className="flex flex-1 justify-center">
            <TypeLegend />
          </div>

          <ScheduleViewToggle
            value={viewMode}
            onChange={setViewMode}
            ariaLabel="Classroom view"
            options={[
              { mode: "grid", title: "Grid view", Icon: GridIcon },
              { mode: "list", title: "List view", Icon: ListIcon },
            ]}
          />
        </div>
      </div>

      {/* Room list */}
      {filtered.length === 0 ? (
        <NoResults query={rawSearch} />
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {filtered.map(room => (
            <RoomAccordion
              key={room.id}
              room={room}
              viewMode={viewMode}
              isOpen={openRooms.has(room.id)}
              onToggle={() => toggleRoom(room.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-sans text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 pr-8 font-sans text-sm text-gray-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ToolbarButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 font-sans text-sm font-medium text-gray-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TypeLegend() {
  const items: { label: string; type: SubjectType }[] = [
    { label: "Major (Lab)",    type: "major_lab"    },
    { label: "Major (w/o Lab)",     type: "major_no_lab" },
    { label: "GenEd",         type: "gen_ed"       },
  ];
  return (
    <Card className="flex flex-nowrap items-center justify-center gap-4 overflow-x-auto px-5 py-2">
      {items.map(({ label, type }) => (
        <div key={type} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span className={`inline-block h-1 w-7 rounded-full ${TYPE_STYLES[type].dot}`} />
          <span className="font-sans text-xs text-slate-500 dark:text-slate-400">{label}</span>
        </div>
      ))}
    </Card>
  );
}

function StatusBadge({ status }: { status: ClassroomStatus }) {
  return status === "available" ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 font-sans text-xs font-semibold text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300">
      Available
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-sans text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
      Full
    </span>
  );
}

function RoomAccordion({
  room,
  viewMode,
  isOpen,
  onToggle,
}: {
  room: Classroom;
  viewMode: "grid" | "list";
  isOpen: boolean;
  onToggle: () => void;
}) {
  const classCount = room.entries.length;

  return (
    <Card className="overflow-hidden dark:bg-slate-900/60">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-white/5"
      >
        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <LayoutIcon />
        </span>
        <span className="font-display text-lg tracking-tight text-slate-800 dark:text-white">
          {room.name}
        </span>
        <StatusBadge status={room.status} />
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-sans text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">
          <UserSmallIcon />
          {classCount} class{classCount !== 1 ? "es" : ""}
        </span>
        <span
          aria-hidden="true"
          className={`ml-auto text-slate-400 transition-transform duration-200 dark:text-slate-500 ${isOpen ? "rotate-90" : ""}`}
        >
          <ChevronRightIcon />
        </span>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="border-t border-slate-300 dark:border-white/10">
          {viewMode === "grid"
            ? <TimetableGrid room={room} />
            : <TableView room={room} />
          }
        </div>
      )}
    </Card>
  );
}

function TimetableGrid({ room }: { room: Classroom }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollRef);

  const gridCols = `repeat(${TIME_SLOTS.length}, minmax(170px, 1fr))`;

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto pb-2"
      style={{ cursor: "grab", scrollbarWidth: "none" }}
    >
      <div
        className="grid min-w-max"
        style={{ gridTemplateColumns: gridCols }}
      >
        {DAYS.map((day, di) => {
          const ds = DAY_STYLES[day];
          return (
            <div key={day} style={{ display: "contents" }}>
              {/* Day label — spans all columns, pill label sticks left while scrolling */}
              <div
                className={`py-1.5 ${di > 0 ? "border-t border-slate-100 dark:border-white/10" : ""}`}
                style={{ gridColumn: `1 / ${TIME_SLOTS.length + 1}` }}
              >
                <span
                  className={`inline-block rounded px-2.5 py-0.5 font-sans text-[0.68rem] font-bold uppercase tracking-widest ${ds.color} ${ds.bg}`}
                  style={{ position: "sticky", left: "1rem" }}
                >
                  {day}
                </span>
              </div>

              {/* Time slot cells */}
              {TIME_SLOTS.map((slot, si) => {
                const entry = room.entries.find(
                  e => e.day === day && e.startTime === slot.start && e.endTime === slot.end,
                );
                return (
                  <div
                    key={slot.start}
                    className={`min-h-25 border-t border-slate-200 p-1.5 dark:border-white/8 ${si > 0 ? "border-l border-slate-200 dark:border-white/8" : "border-l-0"}`}
                  >
                    {entry ? <ClassCard entry={entry} /> : <FreeCell />}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClassCard({ entry }: { entry: ClassEntry }) {
  const s = TYPE_STYLES[entry.type];
  return (
    <div
      className={`flex h-full flex-col gap-1 rounded-md border-l-[3px] p-2 text-slate-700 transition-transform duration-150 hover:-translate-y-0.5 dark:text-slate-200 ${s.card} ${s.border}`}
    >
      <span className="font-sans text-[0.62rem] font-semibold text-slate-400 dark:text-slate-500">
        {entry.startTime} – {entry.endTime}
      </span>
      <span className={`font-sans text-sm font-bold leading-tight ${s.code}`}>
        {entry.subjectCode}
      </span>
      <span className="line-clamp-2 font-sans text-[0.72rem] leading-snug text-slate-600 dark:text-slate-300">
        {entry.descriptiveTitle}
      </span>
      <div className="mt-auto flex items-center gap-1 font-sans text-[0.62rem] text-slate-500 dark:text-slate-500">
        <UserSmallIcon />
        <span>{entry.instructor}</span>
        <span className="mx-0.5 text-slate-300 dark:text-slate-600">|</span>
        <span>{entry.section}</span>
      </div>
    </div>
  );
}

function FreeCell() {
  return (
    <div className="flex h-full min-h-20 items-center justify-center">
      <span className="font-sans text-[0.72rem] italic text-slate-300 dark:text-slate-600">
        Free
      </span>
    </div>
  );
}

function TableView({ room }: { room: Classroom }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollRef);

  const rows = DAYS.flatMap((day) => {
    const dayEntries = room.entries
      .filter(e => e.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const ds = DAY_STYLES[day];
    if (dayEntries.length === 0) {
      return [
        <tr key={`${day}-empty`}>
          <td className={`whitespace-nowrap px-4 py-3 font-sans text-xs font-bold uppercase tracking-widest ${ds.color}`}>
            {day}
          </td>
          <td colSpan={6} className="px-4 py-3 font-sans text-sm italic text-slate-300 dark:text-slate-600">
            No classes
          </td>
        </tr>,
      ];
    }

    return dayEntries.map((entry, i) => {
      const s = TYPE_STYLES[entry.type];
      return (
        <tr
          key={`${day}-${entry.subjectCode}-${i}`}
          className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
        >
              <td className={`whitespace-nowrap px-4 py-3 font-sans text-xs font-bold uppercase tracking-widest ${ds.color}`}>
            {day}
          </td>
          <td className="whitespace-nowrap px-4 py-3 font-sans text-sm text-slate-500 dark:text-slate-400">
            {entry.startTime}
          </td>
          <td className="whitespace-nowrap px-4 py-3 font-sans text-sm text-slate-500 dark:text-slate-400">
            {entry.endTime}
          </td>
          <td className={`whitespace-nowrap px-4 py-3 font-sans text-sm font-bold ${s.tableCode}`}>
            {entry.subjectCode}
          </td>
          <td className="px-4 py-3 font-sans text-sm text-gray-900 dark:text-slate-200">
            {entry.descriptiveTitle}
          </td>
          <td className="whitespace-nowrap px-4 py-3 font-sans text-sm text-slate-500 dark:text-slate-400">
            {entry.instructor}
          </td>
          <td className="whitespace-nowrap px-4 py-3 font-sans text-sm text-slate-500 dark:text-slate-400">
            {entry.section}
          </td>
        </tr>
      );
    });
  });

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto"
      style={{ cursor: "grab", scrollbarWidth: "thin" }}
    >
      <table className="w-full min-w-190 border-collapse font-sans text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
            {["Day", "Start", "End", "Code", "Descriptive Title", "Instructor", "Set"].map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-sans text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
          {rows}
        </tbody>
      </table>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-white/10">
      <span className="text-slate-400 dark:text-slate-600">
        <SearchIcon size={32} />
      </span>
      <p className="font-sans font-semibold text-gray-700 dark:text-slate-400">No classrooms found</p>
      <p className="font-sans text-sm text-slate-500 dark:text-slate-500">
        No classrooms match "<span className="font-medium text-gray-700 dark:text-slate-300">{query}</span>". Try a different name.
      </p>
    </div>
  );
}

// ── Inline SVG icons ───────────────────────────────────────────────────────────

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
