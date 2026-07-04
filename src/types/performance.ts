export type CycleStatus = "Draft" | "Active" | "Closing Soon" | "Finalized"
export type CycleType =
  | "Annual"
  | "Semi-Annual"
  | "Quarterly"
  | "Probationary"
  | "Regularization"
  | "Project-Based"

export type RegularizationStatus =
  | "Not Started"
  | "Manager Review Pending"
  | "HR Review Pending"
  | "For Final Decision"

export interface ReviewCycle {
  id: string
  name: string
  type: CycleType
  description: string
  period: string
  periodStart: string
  periodEnd: string
  launchDate: string
  dueDate: string
  assignedEmployees: number
  completion: number
  status: CycleStatus
  createdBy: string
  departments: string[]
  template: string
  pendingReviews: number
  overdueReviews: number
}

export interface ManagerPending {
  manager: string
  department: string
  pending: number
  overdue: number
  completion: number
}

export interface RegularizationEmployee {
  employee: string
  position: string
  department: string
  dateHired: string
  dueDate: string
  manager: string
  status: RegularizationStatus
}

export interface PerformanceDistributionItem {
  label: string
  count: number
  color: string
}

export interface KpiData {
  activeCycles: number
  cyclesClosingThisMonth: number
  pendingEvaluations: number
  overdueManagerReviews: number
  regularizationDue: number
  averageScore: number
}
