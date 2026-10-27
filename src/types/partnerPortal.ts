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
  crm_pipeline_name?: string | null
  crm_stage_name?: string | null
  crm_stage_code?: string | null
  crm_stage_sort_order?: number | null
  crm_stage_updated_at?: string | null
  source?: string | null
  signup_status?: "email_verified" | "account_created" | null
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

export type AffiliateAnalyticsRange = "7d" | "30d" | "90d" | "all"

export interface AffiliateAnalyticsWindow {
  range: AffiliateAnalyticsRange
  timezone: string
  data_available_from: string
  is_partial: boolean
}

export interface PartnerAffiliateAnalyticsOverview extends AffiliateAnalyticsWindow {
  metrics: {
    total_clicks: number
    unique_clicks: number
    referrals: number | null
    conversion_rate: number
  }
}

export interface PartnerAffiliateLinkAnalytics extends AffiliateAnalyticsWindow {
  product_id: number
  metrics: {
    total_clicks: number
    unique_clicks: number
    referrals: number
  }
  links: {
    affiliate_link_id: number
    landing_page_id: number
    total_clicks: number
    unique_clicks: number
    referrals: number
  }[]
}

export interface PartnerLeadStage {
  key: string
  stage: string
  status: string
  stage_code: string | null
  pipeline: string | null
  count: number
  description: string
  source: "crm" | "affiliate"
  sort_order: number | null
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
  products: string[]
  download_url: string
}

export interface PartnerProduct {
  id: number
  name: string
  slug: string
  description: string | null
}

export interface PartnerAffiliateLandingPage {
  id: number
  name: string
  destination_url: string
  is_default: boolean
  is_active: boolean
}

export interface PartnerAffiliateProduct {
  id: number
  name: string
  slug: string
  description: string | null
  commission_display: string
  default_landing_page_id: number | null
  tracking_mode: "direct" | "redirect"
  referral_parameter: string
  attribution_window_days: number
  landing_pages: PartnerAffiliateLandingPage[]
}

export interface PartnerAffiliateProductsData {
  partner_code: string
  legacy_link: string
  products: PartnerAffiliateProduct[]
}

export interface PartnerAffiliateLink {
  landing_page_id: number
  landing_page_name: string
  share_url: string
  destination_url: string
  is_default: boolean
  available: boolean
  status: "active" | "inactive"
  is_short_link: boolean
  tracking_mode: "direct" | "redirect"
}

export interface PartnerAffiliateLinksData {
  product_id: number
  links: PartnerAffiliateLink[]
}
