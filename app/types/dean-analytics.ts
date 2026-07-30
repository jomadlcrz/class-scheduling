export type Status = {
  tone: "neutral" | "good" | "warning" | "serious" | "critical";
  icon: string;
  label: string;
};

export type ThemeColors = {
  surface: string;
  page: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  gridline: string;
  axis: string;
  border: string;
  track: string;
  series_1: string;
  series_2: string;
  ordinal: string[];
  status: Record<string, string>;
};

export type Theme = {
  light: ThemeColors;
  dark: ThemeColors;
  rules: Record<string, unknown>;
};

export type FilterDef = {
  key: string;
  label: string;
  kind: string;
  value: number;
  display_value: string;
};

export type Spread = {
  instructors: number;
  median_percent: number;
  p90_percent: number;
  spread_percent: number;
  balance: Status;
  hint: string;
};

export type Insight = {
  severity: string;
  title: string;
  message: string;
  action: string | null;
  widget_id: string | null;
};

export type StatTile = {
  id: string;
  kind: "stat_tile";
  title: string;
  value: number;
  display_value: string;
  unit: string;
  meter?: { value: number; max: number; percent: number };
  status: Status;
  hint: string;
};

export type MeterRow = {
  id: number;
  instructor_profile_id: number;
  label: string;
  value: number;
  max: number;
  percent: number;
  display_value: string;
  secondary: string;
  status: Status;
  overflow: boolean;
};

export type MeterList = {
  id: string;
  kind: "meter_list";
  title: string;
  subtitle: string;
  value_suffix: string;
  track_color_role: string;
  fill_color_by: string;
  rows: MeterRow[];
  empty_state: { title: string; message: string; icon: string };
  table: { columns: { key: string; label: string; align: string; suffix?: string }[]; rows: Record<string, unknown>[] };
};

export type BarPoint = {
  label: string;
  full_label?: string;
  value: number;
  display_value: string;
  direct_label: boolean;
  color_role?: string;
  range_label?: string;
  description?: string;
  tone?: string;
};

export type BarSeries = {
  key: string;
  label: string;
  points: BarPoint[];
};

export type BarChart = {
  id: string;
  kind: "bar";
  orientation: "horizontal" | "vertical";
  title: string;
  subtitle: string;
  color_role: string;
  series: BarSeries[];
  legend: { show: boolean; reason?: string; position?: string };
  axis: { x: { label: string; suffix?: string; begin_at_zero?: boolean }; y: { label: string } };
  empty_state: { title: string; message: string; icon: string };
  table: { columns: { key: string; label: string; align: string; suffix?: string }[]; rows: Record<string, unknown>[] };
};

export type StackedBarCategory = {
  label: string;
  full_label: string;
  program_id: number;
  values: Record<string, number>;
  total: number;
  percent: number;
  display_value: string;
  status: Status;
};

export type StackedBar = {
  id: string;
  kind: "stacked_bar";
  orientation: "horizontal" | "vertical";
  title: string;
  subtitle: string;
  series: { key: string; label: string; color_role: string }[];
  categories: StackedBarCategory[];
  legend: { show: boolean; position: string };
  axis: { x: { label: string; begin_at_zero?: boolean }; y: { label: string } };
  segment_gap_px: number;
  empty_state: { title: string; message: string; icon: string };
  table: { columns: { key: string; label: string; align: string; suffix?: string }[]; rows: Record<string, unknown>[] };
};

export type TableColumn = {
  key: string;
  label: string;
  align: string;
  wrap?: boolean;
  suffix?: string;
};

export type TableRow = Record<string, unknown> & { status?: Status };

export type TableWidget = {
  id: string;
  kind: "table";
  title: string;
  subtitle: string;
  columns: TableColumn[];
  rows: TableRow[];
  total_rows?: number;
  truncated?: boolean;
  empty_state: { title: string; message: string; icon: string };
};

export type Widget = StatTile | MeterList | BarChart | StackedBar | TableWidget;

export type Section = {
  id: string;
  title: string;
  layout: "kpi_row" | "grid" | "full";
  columns: number;
  widgets: Widget[];
};

export type DeanAnalyticsResponse = {
  meta: {
    generated_at: string;
    department: string | null;
    department_id: number;
    term: {
      sy_id: number;
      school_year: string;
      sem_id: number;
      semester: string;
      semester_number: number;
    };
    title: string;
    subtitle: string;
    counts: {
      instructors: number;
      teaching_terms: number;
      assignments: number;
      curriculum_subjects: number;
    };
  };
  theme: Theme;
  filters: FilterDef[];
  insights: Insight[];
  spread: Spread;
  sections: Section[];
};
