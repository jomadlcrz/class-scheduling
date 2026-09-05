# GWC Web Application — Casing & Typography Standards

**Document Version:** 1.0  
**Effective Date:** 2026-09-05  
**Applies to:** `class-scheduling-frontend` (Web Desktop & Tablet)

---

## 1. Executive Summary

This standard defines the **Sentence-dominant Hybrid Casing** system adopted across the GWC Class Scheduling web application. Modeled after premier web application design systems (Stripe, GitHub, Apple Human Interface Guidelines, and Google Material 3), it balances:

- **Authority & Structure (Title Case)** for navigation landmarks, sidebar groups, page titles, and modal headers.
- **Readability & Speed (Sentence case)** for all interactive action buttons, form labels, table headers, placeholders, helper text, and notifications.
- **Precision (UPPERCASE)** for acronyms and compact technical metadata.

---

## 2. The 3-Tier Casing Rules

```
┌────────────────────────────────────────────────────────────┐
│ 1. Title Case    -> For STRUCTURAL LANDMARKS & HEADINGS     │
│ 2. Sentence case -> For ACTIONS, FORM LABELS & CONTENT     │
│ 3. UPPERCASE      -> For ACRONYMS & MICRO-TAGS ONLY         │
│ 4. Backend Truth -> NEVER RECASE BACKEND VOCABULARY & ERRORS│
└────────────────────────────────────────────────────────────┘
```

### Rule 1: Title Case (Landmarks & Hierarchy)
Capitalize the first letter of each major word. Used exclusively to answer: *"Where am I in the application?"* or *"What category is this?"*

**Apply to:**
- **Sidebar Groups & Navigation Items:**
  - `Overview`, `Term Setup`, `Curriculum & Facilities`, `Rooms & Capacity`, `Academic Community`, `Enrollment`
  - `Dashboard`, `Academic Terms`, `Weekly Hour Allocations`, `Subject Hour Overrides`, `Class Delivery Modes`, `Facilities`, `Departments`, `Program Curricula`, `Sets`, `Classroom Mapping`, `Laboratory Analysis`, `Administrators`, `Faculty`, `Students`, `Enrollment Records`, `New Enrollment`, `Re-enroll Student`
- **Page Titles & Breadcrumbs:**
  - `Dashboard`, `Academic Terms`, `Faculty Directory`, `Add Faculty Member`, `Create Curriculum`, `Enrollment Records`
- **Modal / Dialog / Drawer Titles:**
  - `Create Semester`, `Create School Year`, `Edit Department`, `Add Existing Instructor`, `Assign Faculty Load`, `Confirm Deletion`
- **Tab Bar Items:**
  - `School Years`, `Semesters`, `Audit Log`, `Term Closure`, `Active Faculty`, `Archived Accounts`
- **Major Section Headings & Card Titles:**
  - `Faculty Information`, `Contact Details`, `Room Specifications`, `System Permissions`, `Weekly Schedule Preview`
- **Empty State Titles:**
  - `No Faculty Assigned`, `No Schedules Found`, `No Conflicts Detected`, `No Data Available`

---

### Rule 2: Sentence case (Interactive & Reading Copy)
Capitalize only the first letter of the first word (plus proper nouns and standard acronyms). Used for everything the user **reads, clicks, or inputs**.

**Apply to:**
- **Buttons & Action CTAs:**
  - `Save changes` *(not `Save Changes`)*
  - `Add department`, `Create building`, `Create program`, `Add semester`
  - `Update password`, `Send reset link`, `Back to log in`, `Log in`, `Sign out`
  - `Export PDF`, `Export CSV`, `Apply filters`, `Reset filters`, `Delete room`
  - `Add to schedule`, `Move slot`, `Update slot`
- **Form Input Labels:**
  - `Department name`, `Email address`, `Contact number`, `Mobile number`
  - `First name`, `Middle name`, `Last name`
  - `Academic year`, `School year`, `Room code`, `Room capacity`, `Building`
  - `Subject code`, `Descriptive title`, `Subject type`, `Civil status`
  - `Student ID` *(ID remains capitalized as an acronym)*
- **Table Column Headers:**
  - `Subject code`, `Descriptive title`, `Assigned instructor`, `Room`, `Day & time`, `Units`, `Status`, `Actions`
- **Input Placeholders & Hints:**
  - `Select a department…`
  - `Enter room code`
  - `Search by faculty name…`
  - `At least 8 characters`
  - `e.g. juan.delacruz@gwc.edu.ph`
- **Unit Badges, Counters & Metrics:**
  - `3 units`, `1 unit`
  - `12 subjects`
  - `24 weekly hours`
  - `24 total units`
- **Status Badges & Pills:**
  - `Active`, `Inactive`, `Pending review`, `Approved`, `Published`, `Draft`, `In progress`, `Completed`
- **Dialogs, Alerts, & Status Messages:**
  - `Are you sure you want to delete this class set? This action cannot be undone.`
  - `Please select an academic term before proceeding.`
  - `Schedule status: Pending approval`

---

### Rule 3: UPPERCASE (Acronyms & Micro-Tags Only)
Capitalize all letters for short technical acronyms and compact categorization tags. Usually styled with small font sizes (`text-xs` / `text-[10px]`) and slight letter-spacing.

**Apply to:**
- **Institutional & Academic Acronyms:** `GWC`, `COR`, `BSIT`, `BSCS`, `GPA`, `ID`, `AM`, `PM`, `TBA`, `PDF`, `CSV`, `URL`, `IP`
- **Micro-Category Tags:** `LEC`, `LAB`

---

### Rule 4: Backend-Truth Exemption
> [!IMPORTANT]
> **NEVER RECASE BACKEND RESPONSES OR ENUMS**:
> In accordance with the core architecture standard (`AGENTS.md`), error messages, success messages, and enum values surfaced from the Flask backend are displayed **verbatim**. Do not rewrite or alter the casing of strings originating from API payloads.

---

## 3. Screen & Feature Reference

### 3.1 Authentication & Profile
| Component / Location | Element | Text | Case Rule |
|---|---|---|---|
| `login-form.tsx` | Field Label | `Email address` | Sentence case |
| `login-form.tsx` | Field Label | `Password` | Sentence case |
| `login-form.tsx` | Primary Button | `Log in` | Sentence case |
| `login-form.tsx` | Link Action | `Forgot your password?` | Sentence case |
| `forgot-password-form.tsx` | Page Title | `Forgot Password` | Title Case |
| `forgot-password-form.tsx` | Primary Button | `Send reset link` | Sentence case |
| `forgot-password-form.tsx` | Back Action | `Back to log in` | Sentence case |
| `change-password.tsx` | Page Title | `Change Temporary Password` | Title Case |
| `change-password.tsx` | Primary Button | `Update password` | Sentence case |
| `security-settings.tsx` | Section Title | `Change Password` | Title Case |
| `security-settings.tsx` | Primary Button | `Update password` | Sentence case |

### 3.2 Academic Terms & Setup
| Component / Location | Element | Text | Case Rule |
|---|---|---|---|
| `semesters-page.tsx` | Modal Title | `Create Semester` | Title Case |
| `semesters-page.tsx` | Primary Action | `Create semester` | Sentence case |
| `semester-form.tsx` | Submit Button | `Save changes` / `Add semester` | Sentence case |
| `school-years-page.tsx` | Modal Title | `Create School Year` | Title Case |
| `school-year-form.tsx` | Submit Button | `Save changes` / `Add school year` | Sentence case |
| `term-closure-page.tsx` | Field Label | `School year` | Sentence case |
| `term-closure-page.tsx` | Field Label | `Semester` | Sentence case |
| `subject-hour-overrides.tsx`| Modal Title | `Add Override` | Title Case |
| `subject-hour-override-form.tsx` | Submit Button | `Save changes` / `Add override` | Sentence case |

### 3.3 Curriculum & Facilities
| Component / Location | Element | Text | Case Rule |
|---|---|---|---|
| `departments.tsx` | Page Header | `Departments` | Title Case |
| `department-form.tsx` | Field Label | `Department code` | Sentence case |
| `department-form.tsx` | Field Label | `Department name` | Sentence case |
| `department-form.tsx` | Submit Button | `Save changes` / `Add department` | Sentence case |
| `programs.tsx` | Page Header | `Program Curricula` | Title Case |
| `program-form.tsx` | Submit Button | `Save changes` / `Create program` | Sentence case |
| `building-form.tsx` | Submit Button | `Save changes` / `Create building` | Sentence case |
| `set-form.tsx` | Submit Button | `Save changes` / `Add sets` | Sentence case |
| `subject-form.tsx` | Field Label | `Subject code` | Sentence case |
| `subject-form.tsx` | Field Label | `Descriptive title` | Sentence case |
| `subject-form.tsx` | Field Label | `Subject type` | Sentence case |
| `subject-form.tsx` | Submit Button | `Save changes` / `Add subject` | Sentence case |

### 3.4 Faculty & Students
| Component / Location | Element | Text | Case Rule |
|---|---|---|---|
| `faculty.tsx` | Page Header | `Faculty Directory` | Title Case |
| `faculty-account-form.tsx` | Field Labels | `First name`, `Middle name`, `Last name` | Sentence case |
| `faculty-account-form.tsx` | Field Labels | `Mobile number`, `Civil status` | Sentence case |
| `faculty-edit-form.tsx` | Submit Button | `Save changes` | Sentence case |
| `student-record-form.tsx` | Field Label | `Student ID` | Sentence case (ID acronym) |
| `student-record-form.tsx` | Field Labels | `First name`, `Middle name`, `Last name` | Sentence case |
| `student-profile-form.tsx`| Submit Button | `Save changes` | Sentence case |

### 3.5 Schedules & Timetables
| Component / Location | Element | Text | Case Rule |
|---|---|---|---|
| `major-schedules.tsx` | Page Header | `Major Class Schedules` | Title Case |
| `major-schedules-mapping-grid.tsx` | Action Button | `Save changes` / `Create meeting` | Sentence case |
| `slot-entry-form.tsx` | Action Button | `Update slot` / `Move slot` / `Add to schedule` | Sentence case |
| `irregular-class.tsx` | Field Label | `School year` | Sentence case |
| `lab-analysis.tsx` | Field Label | `School year`, `Program lens` | Sentence case |

---

## 4. Quick Checklist for Developers & PRs

Before submitting UI changes, check:
1. [ ] Is the button/CTA in **Sentence case**? (e.g., `Save changes`, not `Save Changes`; `Create building`, not `Create Building`).
2. [ ] Is the form field label in **Sentence case**? (e.g., `Email address`, `First name`, `Subject code`, not `Subject Code`).
3. [ ] Are units and counter badges in **Sentence case**? (e.g., `3 units`, `24 weekly hours`, not `3 Units`).
4. [ ] Are page titles, tabs, sidebar groups, and modal headers in **Title Case**? (e.g., `Academic Terms`, `Create Semester`).
5. [ ] Are all caps restricted exclusively to acronyms (`GWC`, `BSIT`, `COR`, `PDF`, `TBA`, `ID`) and micro-tags (`LEC`, `LAB`)?
6. [ ] Are backend errors and enum responses kept **verbatim** without manual recasing?

---

## 5. Typography & Font Family Standards

The web application strictly utilizes **two local typefaces**:

| Typeface | Class Name | Usage & Purpose | Fallback Stack |
|---|---|---|---|
| **Bebas Neue** | `font-display` | Primary page headlines, large modal titles, display banners, wordmark. | `sans-serif` |
| **Century Gothic** | `font-sans` / `font-body` | Navigation, forms, buttons, table cells, dialog copy, inputs. | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |

No external Google Font CDNs or unlicensed font files may be introduced. All typography is served locally through `/public/fonts`.
