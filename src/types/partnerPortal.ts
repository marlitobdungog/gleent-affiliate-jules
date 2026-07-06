export interface PartnerProfile {
  id: number
  name: string
  email: string
  phone: string | null
  company_name: string | null
  partner_code: string
  partner_link: string
  status: string
  status_raw: string
  commission_type: string
  commission_rate: number
  joined_at: string | null
}

export interface PartnerReferralItem {
  id: string
  lead_name: string
  company: string | null
  email: string
  product: string | null
  status: string
  status_raw: string
  submitted_at: string | null
}

export interface PartnerDashboardKpi {
  total_referrals: number
  active_leads: number
  closed_deals: number
  total_earnings: number
  pending_payout: number
  conversion_rate: number
}

export interface PartnerDashboardData {
  kpi: PartnerDashboardKpi
  recent_referrals: PartnerReferralItem[]
  profile: PartnerProfile
}

export interface PartnerLeadStage {
  stage: string
  status: string
  count: number
  description: string
}

export interface PartnerCommissionItem {
  id: string
  deal: string
  amount: number
  rate: string
  status: string
  status_raw: string
  earned_at: string | null
}

export interface PartnerCommissionsData {
  summary: {
    total_earned: number
    pending_amount: number
    paid_amount: number
  }
  items: PartnerCommissionItem[]
}

export interface PartnerPayoutItem {
  id: string
  period: string
  amount: number
  method: string
  status: string
  status_raw: string
  requested_at: string | null
  paid_at: string | null
}

export interface PartnerPayoutsData {
  summary: {
    total_paid: number
    pending_payout: number
  }
  items: PartnerPayoutItem[]
}

export interface PartnerMarketingAsset {
  id: string
  title: string
  type: string
  format: string
  size: string
  download_url: string
}

export interface PartnerProduct {
  id: number
  name: string
  slug: string
  description: string | null
}
