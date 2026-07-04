export type ApplicationStatus =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Needs More Info"

export type DealStatus = "Open" | "Won" | "Lost" | "Cancelled"

export type PayoutStatus =
  | "Draft"
  | "Pending"
  | "Processing"
  | "Paid"
  | "Failed"
  | "Cancelled"
  | "On Hold"

export type PartnerType = "Agency" | "Consultant" | "Reseller" | "Influencer"

export type PartnerStatus = "Active" | "Suspended" | "Pending" | "Inactive"

export type ReferralStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Demo Scheduled"
  | "Proposal Sent"
  | "Closed Won"
  | "Closed Lost"
  | "Invalid"
  | "Duplicate"

export type ReferralSource = "Partner Link" | "Manual Submission"

export type CommissionStatus =
  | "Not Eligible"
  | "Pending Approval"
  | "Approved"
  | "For Payout"
  | "Paid"
  | "Rejected"

export type ActivityAction =
  | "Partner approved"
  | "Commission adjusted"
  | "Payout marked as paid"
  | "Partner suspended"
  | "Link regenerated"
  | "Product assigned"

export interface DashboardKpi {
  totalPartners: number
  pendingApplications: number
  activePartners: number
  totalReferrals: number
  referralsThisMonth: number
  qualifiedLeads: number
  closedDeals: number
  totalCommissionEarned: number
  pendingPayouts: number
  conversionRate: number
}

export interface AffiliateApplication {
  id: string
  applicantName: string
  email: string
  company: string
  partnerType: PartnerType
  targetProduct: string
  audienceNetwork: string
  appliedDate: string
  status: ApplicationStatus
  phone?: string
  website?: string
  linkedIn?: string
  twitter?: string
  promotionPlan?: string
  expectedAudience?: string
  notes?: string
  source?: string
}

export interface Partner {
  id: string
  name: string
  email: string
  phone: string
  company: string
  partnerType: PartnerType
  status: PartnerStatus
  assignedProducts: string[]
  commissionPlan: string
  partnerCode: string
  partnerLink: string
  joinedDate: string
  approvedBy: string | null
  approvedDate: string | null
  referrals: number
  closedDeals: number
  revenueGenerated: number
  commissionEarned: number
}

/** @deprecated Use Partner — kept for dashboard card compatibility */
export interface TopPartner {
  id: string
  partner: string
  code: string
  referrals: number
  closedDeals: number
  revenueGenerated: number
  commissionEarned: number
}

export interface PartnerReferral {
  id: string
  partnerId: string
  leadName: string
  company: string
  product: string
  source: ReferralSource
  sourceLink?: string
  status: ReferralStatus
  assignedSalesperson: string | null
  createdDate: string
  lastActivity: string
}

export interface PartnerDeal {
  id: string
  partnerId: string
  dealName: string
  client: string
  product: string
  dealValue: number
  dealStatus: DealStatus
  closedDate: string | null
  commissionAmount: number | null
  commissionStatus: CommissionStatus
}

export interface PartnerCommission {
  id: string
  partnerId: string
  deal: string
  product: string
  baseAmount: number
  commissionRate: number
  commissionAmount: number
  status: CommissionStatus
  approvedBy: string | null
  approvedDate: string | null
}

export interface PartnerPayout {
  id: string
  partnerId: string
  payoutPeriod: string
  amount: number
  method: string
  referenceNo: string
  status: PayoutStatus
  createdDate: string
  paidDate: string | null
}

export interface PartnerDocument {
  id: string
  partnerId: string
  name: string
  type: string
  uploadedDate: string
  size: string
}

export interface ActivityLogEntry {
  id: string
  partnerId: string
  action: ActivityAction
  performedBy: string
  timestamp: string
  details?: string
}

export interface FunnelStage {
  label: string
  count: number
}

export interface RecentDeal {
  id: string
  deal: string
  product: string
  client: string
  partner: string
  dealValue: number
  commission: number
  status: DealStatus
  closedDate: string
}

export interface PendingPayout {
  id: string
  partner: string
  amount: number
  commissionPeriod: string
  dueDate: string
  status: PayoutStatus
}
