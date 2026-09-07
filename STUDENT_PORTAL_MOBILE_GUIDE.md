# Student Portal Mobile Experience: Rebuild & Parity Guide

## Architectural Blueprint, Component Specs & Implementation Guide
**Target Repository:** `class-scheduling-frontend`  
**Reference Design:** `class-scheduling-mobile` (Expo SDK 57 Student Portal)  
**Target User Persona:** **Students on Mobile Viewports (`<= 1023px` / mobile browsers)**  
**Antigravity Skill:** [`.agents/skills/student-portal-mobile/SKILL.md`](.agents/skills/student-portal-mobile/SKILL.md)  

---

## 1. Executive Summary & Core Mandate

The objective is to achieve **1:1 visual, ergonomic, and interaction parity** between the web-based student portal in `class-scheduling-frontend` (when accessed via mobile browsers or narrow viewports) and the native `class-scheduling-mobile` application.

### Key Mandates:
1. **Student-Exclusive Mobile Shell**:
   - For student users (`user.role === 'student'`) on mobile viewports (`window.innerWidth < 1024px` or touch devices), bypass the desktop side-rail and topbar hamburger menu.
   - Render a native-style **Mobile Student Shell** featuring a streamlined header, main content area with safe-area spacing (`pb-20`), and a **5-Tab Fixed Bottom Navigation Bar**.
2. **Untouched Non-Student Roles**:
   - Faculty, Deans, Registrars, and Super Administrators are untouched and continue to use the existing responsive desktop shell with collapsible sidebar navigation.
3. **Backend Contract Preservation**:
   - `class-scheduling-backend` is the single source of truth and must remain 100% untouched.
4. **Canonical Institutional Palette (Golden West Colleges)**:
   - Primary Brand: GWC Blue (`#0b3b9e` / `--color-gwc-blue`), Bright Highlight (`#1e5bff` / `--color-gwc-blue-bright`), Deep Navy (`#072b75` / `--color-gwc-blue-deep`).
   - Institutional School Navy: Navy 500 (`#1e3a6e`), Navy 700 (`#0f1e3c`), Navy 950 (`#050b1a`).
   - School Gold (Accent): Gold 400 (`#ffba00`), Gold 500 (`#e6a700`), Gold 300 (`#ffd966`).
   - Surfaces: Cream 50 (`#f7f7f2`), Surface (`#131a2c`), Surface Raised (`#1a2338`), Mist 100 (`#e8eaf1`).

---

## 2. Five-Tab Navigation & Route Mapping

The mobile view mirrors the 5 canonical tabs of `class-scheduling-mobile`:

```
┌─────────────────────────────────────────────────────────────┐
│                    Student Mobile Header                    │
│      [GWC Logo] GWC Student Portal       [Active Term Chip] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Active Screen Content                    │
│        (Dashboard / Schedule / COR / Notifications / …)     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Fixed Bottom Tab Bar                     │
│   [Dashboard]  [Schedule]  [COR]  [Notifications (3)]  [Profile] │
└─────────────────────────────────────────────────────────────┘
```

| Tab # | Label | Route in Web Frontend | Visual Representation |
|---|---|---|---|
| **1** | **Dashboard** | `/dashboard` | Greeting, Academic Load summary card (4 metrics), Today's Classes widget. |
| **2** | **Schedule** | `/student-schedule` | Day selector chips (Mon–Sat) in GWC Blue, Timetable cards with time column, subject, room, instructor. |
| **3** | **COR** | `/registration` | Official Certificate of Registration (COR): GWC header banner, student demographics, enrolled subjects, signatory card. |
| **4** | **Notifications** | `/notifications` | Inbox list, unread indicators, mark all as read, two-tier badge dismissal. |
| **5** | **Profile** | `/profile` | Student ID card, avatar with camera edit trigger, academic info, address details, change password, sign out. |

---

## 3. Screen-by-Screen Parity Blueprint

### 3.1 Dashboard (`/dashboard`)
- **Greeting & Academic Context**:
  - Warm greeting ("Good morning, [First Name]") with waving hand 👋 and active academic semester chip.
- **Academic Load Summary Card**:
  - Section or Program title + Year level.
  - Enrolled status pill (`Regular` / `Irregular`).
  - Schedule status banner: "Schedule status:" + Badge (`Official & approved` / `Pending approval`).
  - 4-metric grid:
    - **Subjects**: `X of Y`
    - **Weekly**: `Xh`
    - **Sessions**: `X`
    - **Units**: `X`
- **Today's Classes Widget**:
  - Chronological cards of today's meeting sessions.
  - **Compact Empty State Rule**: If no classes are scheduled for the current day, render a compact empty state (~135px height) with calendar icon and "No classes scheduled today" message + "View full timetable" button.

### 3.2 Schedule (`/student-schedule`)
- **Approval Gate**:
  - Strictly enforce schedule release status: if `scheduleReleaseStatus !== 'approved'`, hide the timetable entries and render an informative pending card.
- **Day Selector Bar**:
  - Horizontal chip scroll: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`.
  - Active day chip highlighted in GWC Blue (`bg-gwc-blue text-white dark:bg-gwc-blue-bright`) with count pill.
- **Timetable Entry Card**:
  - Time text in GWC Blue (`text-gwc-blue dark:text-gwc-blue-bright`).
  - Subject code in School Navy (`text-navy-950 dark:text-mist-100`).
  - Badges: session mode (`LAB` gold, `LEC` info), units.
  - Tags: Room with GWC Blue MapPin, Instructor with UserSmallIcon.

### 3.3 Certificate of Registration (COR) (`/registration`)
- **Institutional Banner**:
  - GWC seal/logo, "GOLDEN WEST COLLEGES" in GWC Blue, "Certificate of Registration", term tag, Share and Official copy triggers.
- **Student Profile Card**:
  - Student number, student name, program, year level, matriculation status badge.
- **Enrolled Subjects List & Table**:
  - Mobile card list with subject code, hours breakdown, units in GWC Blue, room, schedule.
  - Desktop table & print view with official GWC styling.
- **Official Signatory Footer**:
  - GWC official seal badge, Office of the College Registrar, registrar name, verification statement.

### 3.4 Notifications Center (`/notifications`)
- **Two-Tier Badge Architecture**:
  - Bottom Tab Bar displays the `badgeCount` pill.
  - When the student opens the Notifications tab, the bottom bar badge disappears (`badgeCount = 0`).
  - **Notification items in the list remain unread (`is_read: false`)** until individually tapped or "Mark all as read" is tapped.
- **Visuals**:
  - Schedule published: CalendarIcon in GWC Blue.
  - Schedule rescheduled: RefreshIcon in Amber.
  - Student enrolled: GraduationCapIcon.
  - Unread card: `bg-blue-50/40 border-blue-200/90` with bright blue indicator dot.

### 3.5 Student Profile & Account (`/profile`)
- **ID Card Hero**:
  - Avatar with camera edit trigger in GWC Blue, full name in School Navy, "Verified student" in Gold, enrollment status in Primary Blue.
- **Personal & Address Info**:
  - Student number, program, year & section, registered street, barangay, city, province.
- **Account Actions**:
  - Direct link to Change Password.
  - Sign Out button with confirmation dialog.

---

## 4. Casing & Visual Design Rules

- **Sentence-dominant Hybrid Casing (`CASING_GUIDELINES.md`)**:
  - **Title Case**: Major structural landmarks, tab titles, and page headers (`Today's Classes`, `Enrolled Curriculum`, `Account Details`).
  - **Sentence case**: All interactive actions, buttons (`Log out`, `Change password`, `Mark all as read`), input labels, table cells, and unit badges (`3 units`).
  - **UPPERCASE**: Acronyms (`GWC`, `COR`, `ID`, `TBA`) and micro data tags (`ROOM`, `INSTRUCTOR`).
- **Color Palette (app/app.css)**:
  - Brand Blue: `#0b3b9e` (`--color-gwc-blue`), `#1e5bff` (`--color-gwc-blue-bright`), `#072b75` (`--color-gwc-blue-deep`).
  - Navy: `#1e3a6e` (`--color-navy-500`), `#0f1e3c` (`--color-navy-700`), `#050b1a` (`--color-navy-950`).
  - Gold Accent: `#ffba00` (`--color-gold-400`), `#ffd966` (`--color-gold-300`).
  - Surfaces: `#f7f7f2` (`--color-cream-50`), `#131a2c` (`--color-surface`), `#1a2338` (`--color-surface-raised`), `#e8eaf1` (`--color-mist-100`).
