import { Routes, Route, Navigate } from "react-router-dom"
import { PerformanceShell } from "@/components/layout/PerformanceShell"
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
        <Route path="/partner/dashboard" element={<PartnerDashboard />} />
      </Route>

      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}

export default App
