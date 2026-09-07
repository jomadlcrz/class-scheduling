---
name: student-portal-mobile
description: >-
  Architectural patterns, component blueprints, and development guidelines for rebuilding
  and styling the Student Portal in class-scheduling-frontend to achieve 1:1 visual and UX
  parity with class-scheduling-mobile. Use this skill whenever implementing, styling,
  or refactoring student mobile layouts, bottom tab navigation, Certificate of Registration (COR),
  student timetables, or notification badge interactions.
---

# Student Portal Mobile Experience & Design Parity

This skill governs the architecture, component structure, responsive adaptation, and visual design standards for the **Student Portal** in `class-scheduling-frontend`, ensuring 1:1 parity with the dedicated `class-scheduling-mobile` Expo application.

---

## 1. Core Principles & Mandates

1. **Role-Isolated Mobile Presentation**:
   - The dedicated mobile view applies **exclusively** when `user.role === 'student'` on mobile viewports (`max-width: 1023px` / touch viewports).
   - Registrars, deans, and administrators continue to use the administrative responsive shell.
2. **1:1 Visual & Functional Parity with `class-scheduling-mobile`**:
   - Match the 5 primary tabs: **Dashboard**, **Schedule**, **Registration (COR)**, **Notifications**, and **Profile**.
   - **Canonical Institutional Palette (Golden West Colleges)**:
     - **Primary Brand**: GWC Blue (`#0b3b9e` / `--color-gwc-blue`), Bright Highlight (`#1e5bff` / `--color-gwc-blue-bright`), Deep Navy (`#072b75` / `--color-gwc-blue-deep`).
     - **Institutional School Navy**: Navy 500 (`#1e3a6e`), Navy 700 (`#0f1e3c`), Navy 950 (`#050b1a`).
     - **School Gold (Accent)**: Gold 400 (`#ffba00`), Gold 500 (`#e6a700`), Gold 300 (`#ffd966`).
     - **Warm Light Surfaces**: Cream 50 (`#f7f7f2`), Cream 100 (`#eeeee6`), White (`#ffffff`).
     - **Soft Dark-Mode Chrome**: Surface (`#131a2c`), Surface Raised (`#1a2338`), Surface Overlay (`#232e48`), Mist 100 (`#e8eaf1`).
     - **Semantic Status Tones**: Success (`#2f9e63` / `statusGood` / emerald badge for official status only), Warning (`#d9a026` / amber), Danger (`#d64545` / rose).
     - **NEVER use emerald green as the brand primary or chrome color.**
   - Match the typography and casing guidelines (`CASING_GUIDELINES.md` — Sentence-dominant Hybrid Casing).
3. **Bottom Navigation Architecture**:
   - On mobile viewports for students, replace the side rail / hamburger sidebar with a fixed bottom tab bar featuring safe-area padding (`env(safe-area-inset-bottom)`), active tab indicators (`text-gwc-blue` in light mode, `text-gold-400` in dark mode), and a real-time notification badge.

---

## 2. Five-Tab Navigation & Route Mapping

| Tab | Label | Route in Frontend | Function & Mobile Component |
|---|---|---|---|
| **1** | **Dashboard** | `/dashboard` | Term overview, load summary card (4 metrics), compact today's classes widget. |
| **2** | **Schedule** | `/student-schedule` | Day selector chips (Mon–Sat) in GWC Blue, timetable cards with time block, subject, room, instructor. |
| **3** | **Registration** | `/registration` | Official Certificate of Registration (COR): GWC header banner, student demographics, enrolled subjects, fee assessment, signatory card. |
| **4** | **Notifications** | `/notifications` | Notification center: type-specific icons, unread indicators, mark all as read, two-tier badge dismissal. |
| **5** | **Profile** | `/profile` | Student profile hero, avatar with photo update, academic details, address details, change password, sign out. |

---

## 3. Screen Specifications

### 3.1 Dashboard (`/dashboard`)
- **Header**: Greeting with student name, waving hand animation, active semester and school year chip.
- **Academic Load Card**:
  - Section/Program title, enrolled status pill, schedule status banner (`Official & approved` / `Pending approval`).
  - 4-metric grid: Subjects (`X of Y`), Weekly (`Xh`), Sessions (`X`), Units (`X`).
- **Today's Classes Widget**:
  - Chronologically ordered cards showing start/end time in GWC Blue, session mode (gold for LAB, blue for LEC), subject code in navy, room with GWC Blue MapPin, instructor.
  - If no classes today: Compact empty state with calendar icon and "No classes scheduled today" message + "View full timetable" button.

### 3.2 Schedule (`/student-schedule`)
- **Release Status Gate**:
  - Timetable sessions are hidden when `scheduleReleaseStatus !== 'approved'`.
  - Render an informative pending banner or empty state ("Class schedule not published").
- **Day Tab Selector**:
  - Horizontal chip row: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`.
  - Active chip uses GWC Blue (`bg-gwc-blue text-white dark:bg-gwc-blue-bright`) with count pill.
- **Timetable Entry Card**:
  - Time text in GWC Blue (`text-gwc-blue dark:text-gwc-blue-bright`).
  - Subject code in School Navy (`text-navy-950 dark:text-mist-100`).
  - Badges: session mode (`LAB` gold, `LEC` info), units.
  - Room with GWC Blue MapPinIcon, Instructor with UserSmallIcon.

### 3.3 Certificate of Registration (COR) (`/registration`)
- **Institutional Header Card**:
  - Golden West Colleges logo, "GOLDEN WEST COLLEGES" in GWC Blue, "Certificate of Registration", term tag, Share and Official copy triggers.
- **Student Profile Card**:
  - Student number, student name, program, year level, matriculation status badge.
- **Enrolled Subjects List & Table**:
  - Mobile card list with subject code, hours breakdown, units in GWC Blue, room, schedule.
  - Desktop table & print view with official GWC styling.
- **Fee Assessment Breakdown**:
  - Tuition, Miscellaneous, Laboratory, Total Assessed in GWC Blue.
- **Official Signatory Footer**:
  - GWC official seal badge, Office of the College Registrar, registrar name, verification statement.

### 3.4 Notifications Center (`/notifications`)
- **Two-Tier Badge Architecture**:
  - `badgeCount`: Number rendered on the bottom navigation tab.
  - When the user navigates to `/notifications`, the bottom bar badge is dismissed (`badgeCount = 0`).
  - **Inbox items remain unread (`is_read: false`)** until the student clicks an item or taps "Mark all as read".
- **Visuals**:
  - Schedule published: CalendarIcon in GWC Blue, blue background.
  - Schedule rescheduled: RefreshIcon in Amber.
  - Student enrolled: GraduationCapIcon.
  - Unread card: `bg-blue-50/40 border-blue-200/90` with bright blue indicator dot.

### 3.5 Student Profile & Account (`/profile`)
- **Student Profile Hero Card**:
  - Avatar with camera badge in GWC Blue, full name in School Navy, "Verified student" in Gold, enrollment status in Primary Blue.
- **Academic & Address Details**:
  - Student ID, program, year & section, registered street, barangay, city, province.
- **Security & Actions**:
  - Direct navigation to Change Password.
  - "Log out" button with confirmation modal.

---

## 4. Mobile Bottom Navigation Component Blueprint

```tsx
// Pattern: StudentBottomNav.tsx
// Fixed bottom tab bar rendered on mobile screens for student users
<nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-surface/95 lg:hidden">
  {TABS.map((tab) => {
    const isActive = location.pathname === tab.to;
    return (
      <NavLink
        key={tab.to}
        to={tab.to}
        className={`relative flex flex-1 flex-col items-center justify-center py-1 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
          isActive
            ? "font-bold text-gwc-blue dark:text-gold-400"
            : "text-slate-500 hover:text-navy-700 dark:text-slate-400 dark:hover:text-mist-100"
        }`}
      >
        <tab.icon />
        <span className="mt-1 text-[11px] leading-tight">{tab.label}</span>
        {tab.badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white">
            {tab.badge > 99 ? "99+" : tab.badge}
          </span>
        )}
      </NavLink>
    );
  })}
</nav>
```

---

## 5. Development & Review Checklist

Before approving any PR or finalizing student portal changes in `class-scheduling-frontend`:

- [ ] **Role Guard Verification**: Ensure student mobile shell only activates for `user.role === 'student'`. Non-student views remain unaffected.
- [ ] **Color Palette Integrity**: Strictly use canonical GWC Blue (`#0b3b9e`), School Gold (`#ffba00`), School Navy (`#1e3a6e` / `#050b1a`), Cream (`#f7f7f2`), and Surface (`#131a2c`). No foreign emerald green.
- [ ] **Safe Area Awareness**: Bottom bar includes `pb-[env(safe-area-inset-bottom)]` and content containers include `pb-20` to prevent tab bar overlapping content.
- [ ] **Schedule Release Guard**: Class schedules and session times remain completely hidden when `scheduleReleaseStatus !== 'approved'`.
- [ ] **Badge Mechanics**: Opening the Notifications tab dismisses the bottom tab badge while keeping individual unread notifications intact.
- [ ] **Compact Dashboard**: Today's classes widget uses a compact empty state (~135px) to prevent artificial scrolling on mobile.
- [ ] **Casing Guidelines**: All UI copy adheres to `CASING_GUIDELINES.md` (Title Case landmarks, Sentence case actions/buttons, UPPERCASE acronyms).
- [ ] **Typecheck**: `npm run typecheck` passes with 0 errors.
- [ ] **Backend Integrity**: `class-scheduling-backend` remains 100% clean and untouched.
