Project: Multi-Role Dashboard System (Employee, HR, RMG)
Tech Stack: React.js + TypeScript + Vite
UI: TailwindCSS + ShadCN UI
State: Zustand or Context API
Theme: Light & Dark
Data Source: Static JSON files
Core Requirement: All pages must be shown/hidden based on authenticated user role (Employee, HR, RMG).

## ⭐ Role-Based Access Control (RBAC) Requirements
Supported Roles

EMPLOYEE

HR

RMG

RBAC Rules

Each role sees only its own dashboard pages.

Sidebar menu items auto-hide based on role.

Restricted routes → redirect to 403 Not Authorized page.

Implement RBAC using:

const rolePermissions = {
  EMPLOYEE: [...],
  HR: [...],
  RMG: [...],
};


Role comes from mock auth (JSON or local state).

## 🧑‍💼 1. Employee Dashboard Features

Show only if user role = EMPLOYEE

Personal & Work Info

Profile overview (name, role, department, ID)

Employment details (joining date, reporting manager)

Skills & certifications

Company policies & documents

Attendance & Leave

Clock-in / Clock-out

Leave balance

Apply leave / remote work

Timesheet submission

Approval notifications

Payroll & Benefits

Payslip viewer (PDF)

Salary breakdown

Tax info

Reimbursements

Benefits overview

Performance & Development

Goals / OKRs tracking

Feedback & appraisal history

Training recommendations

Rewards/recognition

Communication & Engagement

Announcements

Team directory

Chat placeholder

Feedback/survey forms

## 👩‍💼 2. HR Dashboard Features

Show only if user role = HR

Employee Management

Add/update/deactivate profiles

Department/role assignments

Lifecycle tracking (Onboarding → Exit)

Document repository

Attendance & Leave Oversight

Department-level attendance views

Leave approvals

Holiday & shift scheduling

Compliance & exception alerts

Payroll & Compensation

Payroll generation

Bonuses/incentives

PF / ESI / TDS reports

Finance reports export

Recruitment & Onboarding

Job requisition manager

Candidate pipeline dashboard

Offer release

Onboarding tasks tracking

Performance & HR Analytics

KPI / OKR monitoring

Appraisal cycle setup

Attrition/retention analytics

Workforce insights (headcount, diversity)

Engagement & Compliance

Policy updates & acknowledgments

Surveys & feedback management

Exit interview summaries

Audit & compliance reports

## 🧠 3. RMG (Resource Management Group) Dashboard Features

Show only if user role = RMG

Resource Pool Overview

List employees with skills & availability

Billable vs non-billable

Allocation summary per project

Allocation & Utilization

Assign/unassign resources

Utilization metrics

Bench strength overview

Skill gap insights

Demand & Forecasting

Upcoming project demands

Resource forecast by skill/role

Hiring alignment with HR

Reporting & Insights

Allocation efficiency reports

Resource cost summary

Bench cost tracking

Gantt/calendar for availability

## 🗂️ Recommended Folder Structure
src/
  components/
  layouts/
  router/
    AppRouter.tsx
    ProtectedRoute.tsx
    roleConfig.ts
  context/
    AuthContext.tsx
  pages/
    employee/
    hr/
    rmg/
    auth/Login.tsx
    errors/403.tsx
  data/
    employees.json
    attendance.json
    payroll.json
    projects.json
  services/
  theme/
  hooks/

## 🔐 Protected Routing Requirements

Copilot should generate:

ProtectedRoute Component

Validates user role

Checks rolePermissions

If unauthorized → redirect to /403

roleConfig.ts

Defines which pages each role can access.

Sidebar Requirements

Auto-hide menu items based on:

user.role
rolePermissions[user.role]

Login Page

Mock login

Select role: Employee / HR / RMG

Store in Context/Zustand

## 🎨 UI/Component Requirements

Dashboard layout (sidebar + topbar)

Reusable widgets/cards

Charts (Recharts)

Tables (ShadCN table)

Forms (React Hook Form)

Filters & search inputs

Global theme toggle (dark/light)

Toast notifications (sonner)

## 🛠️ Development Notes for Copilot

Use TypeScript interfaces for all models

Read static JSON via mock API services

Use Context/Zustand for:

User (role, info)

Theme mode

Build modular pages

Fully responsive

Use ShadCN UI components

Light & Dark theme must work across layouts