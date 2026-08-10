import * as XLSX from "xlsx";
import type { ProgramCurriculum } from "~/types/curriculum";

/** One row of the curriculum Excel interchange format — mirrors the columns
 * the export writes so an exported file round-trips back into the builder. */
export type CurriculumImportRow = {
  yearLevel: number;
  semester: number;
  code: string;
  title: string;
  units: number;
  subjectType: string;
  prerequisites: string[];
};

const HEADERS = {
  yearLevel: "Year Level",
  semester: "Semester",
  subjectCode: "Subject Code",
  title: "Descriptive Title",
  units: "Units",
  subjectType: "Subject Type",
  prerequisites: "Prerequisites",
} as const;

type ExportRow = Record<(typeof HEADERS)[keyof typeof HEADERS], string | number>;

function toExportRow(curriculum: ProgramCurriculum): ExportRow[] {
  const rows: ExportRow[] = [];
  for (const group of curriculum.groups) {
    for (const subject of group.subjects) {
      rows.push({
        [HEADERS.yearLevel]: group.yearLevel,
        [HEADERS.semester]: group.semester,
        [HEADERS.subjectCode]: subject.code,
        [HEADERS.title]: subject.title,
        [HEADERS.units]: subject.units,
        [HEADERS.subjectType]: subject.subjectType,
        [HEADERS.prerequisites]: subject.prerequisites.join(", "),
      });
    }
  }
  return rows.sort(
    (a, b) =>
      Number(a[HEADERS.yearLevel]) - Number(b[HEADERS.yearLevel]) ||
      Number(a[HEADERS.semester]) - Number(b[HEADERS.semester]) ||
      String(a[HEADERS.subjectCode]).localeCompare(String(b[HEADERS.subjectCode])),
  );
}

/** Download the program curriculum as an Excel workbook. */
export function exportCurriculumToExcel(curriculum: ProgramCurriculum): void {
  const worksheet = XLSX.utils.json_to_sheet(toExportRow(curriculum));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Curriculum");
  const filename = `curriculum-${curriculum.programCode.toLowerCase()}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

function normalizeHeader(header: unknown): string {
  return String(header ?? "").trim().toLowerCase();
}

function cell(record: Record<string, unknown>, key: string): string {
  const match = Object.entries(record).find(([header]) => normalizeHeader(header) === key);
  return String(match?.[1] ?? "").trim();
}

function fail(code: string, message: string): Error {
  return new Error(`Row “${code}” — ${message}`);
}

/** Parse an uploaded .xlsx/.xls/.csv curriculum file into builder rows. */
export async function parseCurriculumWorkbook(file: File): Promise<CurriculumImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("The file has no worksheet.");

  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const rows: CurriculumImportRow[] = [];

  for (const record of records) {
    const code = cell(record, "subject code");
    const title = cell(record, "descriptive title");
    if (!code && !title) continue;

    const yearLevel = Number(cell(record, "year level"));
    const semester = Number(cell(record, "semester"));
    const units = Number(cell(record, "units"));
    const subjectType = cell(record, "subject type");

    if (!Number.isInteger(yearLevel) || yearLevel < 1) throw fail(code, "invalid year level.");
    if (!Number.isInteger(semester) || semester < 1) throw fail(code, "invalid semester.");
    if (!code) throw new Error("A row is missing a subject code.");
    if (!title) throw fail(code, "missing a descriptive title.");
    if (!Number.isFinite(units) || units < 1) throw fail(code, "needs a unit count of at least 1.");
    if (!subjectType) throw fail(code, "missing a subject type.");

    rows.push({
      yearLevel,
      semester,
      code,
      title,
      units,
      subjectType,
      prerequisites: cell(record, "prerequisites")
        .split(/[,;]+/)
        .map((p) => p.trim())
        .filter(Boolean),
    });
  }

  return rows;
}
