import { Routes, Route, Navigate } from "react-router-dom"
import { PerformanceShell } from "@/components/layout/PerformanceShell"
import { PartnerShell } from "@/components/layout/PartnerShell"
import { Dashboard } from "@/pages/Dashboard"
import { Partners } from "@/pages/Partners"
import { PartnerDetail } from "@/pages/PartnerDetail"
import { Applications } from "@/pages/Applications"
import { ReviewApplication } from "@/pages/ReviewApplication"
import { Referrals } from "@/pages/Referrals"
import { Deals } from "@/pages/Deals"
import { Commissions } from "@/pages/Commissions"
import { Payouts } from "@/pages/Payouts"
import { Products } from "@/pages/Products"
import { Settings } from "@/pages/Settings"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { PartnerLogin } from "@/pages/partner/PartnerLogin"
import { PartnerRegister } from "@/pages/partner/PartnerRegister"
import { PartnerDashboard } from "@/pages/partner/PartnerDashboard"
import { PartnerMyLink } from "@/pages/partner/PartnerMyLink"
import { PartnerReferrals } from "@/pages/partner/PartnerReferrals"
import { PartnerLeadStages } from "@/pages/partner/PartnerLeadStages"
import { PartnerCommissions } from "@/pages/partner/PartnerCommissions"
import { PartnerPayouts } from "@/pages/partner/PartnerPayouts"
import { PartnerMarketingAssets } from "@/pages/partner/PartnerMarketingAssets"
import { PartnerProfile } from "@/pages/partner/PartnerProfile"
import { PartnerChangePassword } from "@/pages/partner/PartnerChangePassword"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/register" element={<Register />} />
      <Route path="/partner/login" element={<PartnerLogin />} />
      <Route path="/partner/register" element={<PartnerRegister />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login" />}>
        <Route path="/admin" element={<PerformanceShell />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="partners" element={<Partners />} />
          <Route path="partners/:id" element={<PartnerDetail />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applications/:id" element={<ReviewApplication />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="deals" element={<Deals />} />
          <Route path="commissions" element={<Commissions />} />
          <Route path="payouts" element={<Payouts />} />
          <Route path="products" element={<Products />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Protected Partner Routes */}
      <Route element={<ProtectedRoute allowedRoles={["partner"]} loginPath="/partner/login" />}>
        <Route path="/partner" element={<PartnerShell />}>
          <Route index element={<Navigate to="/partner/dashboard" replace />} />
          <Route path="dashboard" element={<PartnerDashboard />} />
          <Route path="my-link" element={<PartnerMyLink />} />
          <Route path="referrals" element={<PartnerReferrals />} />
          <Route path="lead-stages" element={<PartnerLeadStages />} />
          <Route path="commissions" element={<PartnerCommissions />} />
          <Route path="payouts" element={<PartnerPayouts />} />
          <Route path="marketing-assets" element={<PartnerMarketingAssets />} />
          <Route path="profile" element={<PartnerProfile />} />
          <Route path="profile/change-password" element={<PartnerChangePassword />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}

export default App
