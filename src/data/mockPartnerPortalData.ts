export const mockPartnerProfile = {
  partnerCode: "GLT-A7K2M9",
  partnerLink: "https://gleent.com/ref/GLT-A7K2M9",
  companyName: "Acme Growth Partners",
  phone: "+1 (555) 234-5678",
  status: "Active" as const,
  commissionType: "percentage" as const,
  commissionRate: 15,
  joinedAt: "2025-11-12",
}

export const mockPartnerDashboardKpi = {
  totalReferrals: 24,
  activeLeads: 8,
  closedDeals: 5,
  totalEarnings: 12450,
  pendingPayout: 3200,
  conversionRate: 21,
}

export const mockPartnerReferrals = [
  {
    id: "1",
    leadName: "Sarah Chen",
    company: "NovaTech Solutions",
    email: "sarah.chen@novatech.io",
    product: "SprintHR Core",
    status: "Qualified",
    submittedAt: "2026-06-28",
  },
  {
    id: "2",
    leadName: "Marcus Williams",
    company: "BrightPath HR",
    email: "marcus@brightpath.com",
    product: "SprintHR Payroll",
    status: "Demo Scheduled",
    submittedAt: "2026-06-25",
  },
  {
    id: "3",
    leadName: "Elena Rodriguez",
    company: "Summit Workforce",
    email: "elena@summitwf.com",
    product: "SprintHR Core",
    status: "Closed Won",
    submittedAt: "2026-06-18",
  },
  {
    id: "4",
    leadName: "James Okafor",
    company: "Pinnacle Staffing",
    email: "j.okafor@pinnaclestaff.com",
    product: "SprintHR Benefits",
    status: "Contacted",
    submittedAt: "2026-06-14",
  },
  {
    id: "5",
    leadName: "Lisa Park",
    company: "Horizon People Co",
    email: "lisa.park@horizonpeople.co",
    product: "SprintHR Core",
    status: "New",
    submittedAt: "2026-07-02",
  },
]

export const mockPartnerLeadStages = [
  { stage: "New", count: 3, description: "Referrals received, awaiting initial contact" },
  { stage: "Contacted", count: 4, description: "Outreach made, gathering requirements" },
  { stage: "Qualified", count: 5, description: "Lead meets criteria and shows buying intent" },
  { stage: "Demo Scheduled", count: 2, description: "Product demo booked with sales team" },
  { stage: "Proposal Sent", count: 1, description: "Commercial proposal delivered" },
  { stage: "Closed Won", count: 5, description: "Deal successfully closed" },
  { stage: "Closed Lost", count: 2, description: "Opportunity did not convert" },
]

export const mockPartnerCommissions = [
  {
    id: "COM-1042",
    deal: "Summit Workforce — SprintHR Core",
    amount: 4500,
    rate: "15%",
    status: "Approved",
    earnedAt: "2026-06-20",
  },
  {
    id: "COM-1038",
    deal: "BrightPath HR — SprintHR Payroll",
    amount: 2800,
    rate: "15%",
    status: "For Payout",
    earnedAt: "2026-06-10",
  },
  {
    id: "COM-1031",
    deal: "NovaTech Solutions — SprintHR Core",
    amount: 3200,
    rate: "15%",
    status: "Paid",
    earnedAt: "2026-05-28",
  },
  {
    id: "COM-1025",
    deal: "Pinnacle Staffing — SprintHR Benefits",
    amount: 1950,
    rate: "15%",
    status: "Pending Approval",
    earnedAt: "2026-06-30",
  },
]

export const mockPartnerPayouts = [
  {
    id: "PAY-089",
    period: "June 2026",
    amount: 3200,
    method: "Bank Transfer",
    status: "Pending",
    requestedAt: "2026-07-01",
  },
  {
    id: "PAY-082",
    period: "May 2026",
    amount: 3200,
    method: "Bank Transfer",
    status: "Paid",
    requestedAt: "2026-06-01",
    paidAt: "2026-06-05",
  },
  {
    id: "PAY-075",
    period: "April 2026",
    amount: 2800,
    method: "Bank Transfer",
    status: "Paid",
    requestedAt: "2026-05-01",
    paidAt: "2026-05-06",
  },
]

export const mockMarketingAssets = [
  {
    id: "1",
    title: "SprintHR Core — Partner Banner (728×90)",
    type: "Banner",
    format: "PNG",
    size: "245 KB",
  },
  {
    id: "2",
    title: "Affiliate Link Copy Templates",
    type: "Copy",
    format: "PDF",
    size: "128 KB",
  },
  {
    id: "3",
    title: "Product One-Pager — SprintHR Payroll",
    type: "Brochure",
    format: "PDF",
    size: "1.2 MB",
  },
  {
    id: "4",
    title: "Social Media Kit — Q3 2026",
    type: "Social",
    format: "ZIP",
    size: "4.8 MB",
  },
  {
    id: "5",
    title: "Email Outreach Templates",
    type: "Email",
    format: "DOCX",
    size: "86 KB",
  },
]
