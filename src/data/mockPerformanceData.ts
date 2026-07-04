import type {
  KpiData,
  ReviewCycle,
  ManagerPending,
  RegularizationEmployee,
  PerformanceDistributionItem,
} from "@/types/performance"

export const mockKpi: KpiData = {
  activeCycles: 3,
  cyclesClosingThisMonth: 2,
  pendingEvaluations: 48,
  overdueManagerReviews: 18,
  regularizationDue: 12,
  averageScore: 4.1,
}

export const mockCycles: ReviewCycle[] = [
  {
    id: "cycle-001",
    name: "2026 Mid-Year Performance Review",
    type: "Semi-Annual",
    description:
      "Company-wide mid-year performance evaluation covering all permanent employees across all departments.",
    period: "Jan 1 - Jun 30, 2026",
    periodStart: "Jan 1, 2026",
    periodEnd: "Jun 30, 2026",
    launchDate: "Jul 1, 2026",
    dueDate: "Jul 20, 2026",
    assignedEmployees: 185,
    completion: 68,
    status: "Active",
    createdBy: "HR Admin",
    departments: ["All Departments"],
    template: "General Employee Evaluation",
    pendingReviews: 59,
    overdueReviews: 12,
  },
  {
    id: "cycle-002",
    name: "July Regularization Review",
    type: "Regularization",
    description:
      "Regularization review for employees who completed their probationary period in Q1 2026.",
    period: "Apr 1 - Jun 30, 2026",
    periodStart: "Apr 1, 2026",
    periodEnd: "Jun 30, 2026",
    launchDate: "Jul 1, 2026",
    dueDate: "Jul 15, 2026",
    assignedEmployees: 24,
    completion: 42,
    status: "Closing Soon",
    createdBy: "HR Admin",
    departments: ["HR Operations", "Operations", "Sales"],
    template: "Regularization Review",
    pendingReviews: 14,
    overdueReviews: 6,
  },
  {
    id: "cycle-003",
    name: "Sales Team Quarterly Review",
    type: "Quarterly",
    description:
      "Q2 quarterly performance evaluation for the Sales team, aligned with sales targets.",
    period: "Apr 1 - Jun 30, 2026",
    periodStart: "Apr 1, 2026",
    periodEnd: "Jun 30, 2026",
    launchDate: "Jul 1, 2026",
    dueDate: "Jul 25, 2026",
    assignedEmployees: 42,
    completion: 81,
    status: "Active",
    createdBy: "HR Admin",
    departments: ["Sales"],
    template: "General Employee Evaluation",
    pendingReviews: 8,
    overdueReviews: 2,
  },
  {
    id: "cycle-004",
    name: "2026 Annual Leadership Review",
    type: "Annual",
    description:
      "Annual review for all team leads, managers, and department heads. Includes 360-degree feedback.",
    period: "Jan 1 - Dec 31, 2026",
    periodStart: "Jan 1, 2026",
    periodEnd: "Dec 31, 2026",
    launchDate: "Dec 1, 2026",
    dueDate: "Dec 15, 2026",
    assignedEmployees: 32,
    completion: 0,
    status: "Draft",
    createdBy: "HR Admin",
    departments: ["All Departments"],
    template: "Leadership Review",
    pendingReviews: 0,
    overdueReviews: 0,
  },
  {
    id: "cycle-005",
    name: "Q1 2026 Finance Review",
    type: "Quarterly",
    description: "Q1 quarterly performance review for Finance and Accounting team members.",
    period: "Jan 1 - Mar 31, 2026",
    periodStart: "Jan 1, 2026",
    periodEnd: "Mar 31, 2026",
    launchDate: "Apr 1, 2026",
    dueDate: "Apr 20, 2026",
    assignedEmployees: 18,
    completion: 100,
    status: "Finalized",
    createdBy: "HR Admin",
    departments: ["Finance"],
    template: "General Employee Evaluation",
    pendingReviews: 0,
    overdueReviews: 0,
  },
]

export const mockManagers: ManagerPending[] = [
  {
    manager: "Maria Santos",
    department: "Sales",
    pending: 8,
    overdue: 3,
    completion: 55,
  },
  {
    manager: "John Reyes",
    department: "Operations",
    pending: 12,
    overdue: 6,
    completion: 40,
  },
  {
    manager: "Ana Cruz",
    department: "Finance",
    pending: 4,
    overdue: 1,
    completion: 78,
  },
  {
    manager: "Rodel Bautista",
    department: "IT",
    pending: 6,
    overdue: 2,
    completion: 62,
  },
  {
    manager: "Sheila Navarro",
    department: "HR Operations",
    pending: 3,
    overdue: 0,
    completion: 89,
  },
]

export const mockRegularization: RegularizationEmployee[] = [
  {
    employee: "Carlo Mendoza",
    position: "Payroll Specialist",
    department: "HR Operations",
    dateHired: "Jan 10, 2026",
    dueDate: "Jul 10, 2026",
    manager: "Maria Santos",
    status: "Manager Review Pending",
  },
  {
    employee: "Bianca Torres",
    position: "Inventory Analyst",
    department: "Operations",
    dateHired: "Jan 18, 2026",
    dueDate: "Jul 18, 2026",
    manager: "John Reyes",
    status: "Not Started",
  },
  {
    employee: "Mark Villanueva",
    position: "Sales Associate",
    department: "Sales",
    dateHired: "Jan 22, 2026",
    dueDate: "Jul 22, 2026",
    manager: "Maria Santos",
    status: "HR Review Pending",
  },
  {
    employee: "Lorraine Dela Cruz",
    position: "Accounts Payable Officer",
    department: "Finance",
    dateHired: "Jan 25, 2026",
    dueDate: "Jul 25, 2026",
    manager: "Ana Cruz",
    status: "For Final Decision",
  },
]

export const mockDistribution: PerformanceDistributionItem[] = [
  { label: "Outstanding", count: 18, color: "bg-emerald-500" },
  { label: "Exceeds Expectations", count: 42, color: "bg-blue-500" },
  { label: "Meets Expectations", count: 103, color: "bg-primary" },
  { label: "Needs Improvement", count: 14, color: "bg-amber-500" },
  { label: "Unsatisfactory", count: 3, color: "bg-destructive" },
]

export const EVALUATION_TEMPLATES = [
  "General Employee Evaluation",
  "Manager Evaluation",
  "Regularization Review",
  "Leadership Review",
]

export const CYCLE_TYPES = [
  "Annual",
  "Semi-Annual",
  "Quarterly",
  "Probationary",
  "Regularization",
  "Project-Based",
]

export const EMPLOYEE_GROUPS = [
  "All Employees",
  "Selected Departments",
  "Selected Employees",
  "Probationary Employees",
  "Managers Only",
]

export const DEPARTMENTS = [
  "All Departments",
  "Sales",
  "Operations",
  "Finance",
  "HR Operations",
  "IT",
  "Marketing",
]
