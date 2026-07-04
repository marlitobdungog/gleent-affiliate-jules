import * as React from "react"
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

type Page =
  | "dashboard"
  | "partners"
  | "partner-detail"
  | "applications"
  | "application-review"
  | "referrals"
  | "deals"
  | "commissions"
  | "payouts"
  | "products"
  | "settings"

export function App() {
  const [activePage, setActivePage] = React.useState<Page>("dashboard")
  const [selectedPartnerId, setSelectedPartnerId] = React.useState<string | null>(null)
  const [selectedApplicationId, setSelectedApplicationId] = React.useState<string | null>(null)

  const handleNavigate = (route: string) => {
    setActivePage(route as Page)
    setSelectedPartnerId(null)
    setSelectedApplicationId(null)
  }

  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartnerId(partnerId)
    setActivePage("partner-detail")
  }

  const handleReviewApplication = (applicationId: string) => {
    setSelectedApplicationId(applicationId)
    setActivePage("application-review")
  }

  const handleBackToPartners = () => {
    setSelectedPartnerId(null)
    setActivePage("partners")
  }

  const handleBackToApplications = () => {
    setSelectedApplicationId(null)
    setActivePage("applications")
  }

  const sidebarPage =
    activePage === "partner-detail"
      ? "partners"
      : activePage === "application-review"
        ? "applications"
        : activePage

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            onNavigate={handleNavigate}
            onSelectPartner={handleSelectPartner}
            onReviewApplication={handleReviewApplication}
          />
        )
      case "partners":
        return <Partners onSelectPartner={handleSelectPartner} />
      case "partner-detail":
        return selectedPartnerId ? (
          <PartnerDetail partnerId={selectedPartnerId} onBack={handleBackToPartners} />
        ) : (
          <Partners onSelectPartner={handleSelectPartner} />
        )
      case "applications":
        return <Applications onReviewApplication={handleReviewApplication} />
      case "application-review":
        return selectedApplicationId ? (
          <ReviewApplication
            applicationId={selectedApplicationId}
            onBack={handleBackToApplications}
          />
        ) : (
          <Applications onReviewApplication={handleReviewApplication} />
        )
      case "referrals":
        return <Referrals />
      case "deals":
        return <Deals />
      case "commissions":
        return <Commissions />
      case "payouts":
        return <Payouts />
      case "products":
        return <Products />
      case "settings":
        return <Settings />
      default:
        return null
    }
  }

  return (
    <PerformanceShell activePage={sidebarPage} onNavigate={handleNavigate}>
      {renderPage()}
    </PerformanceShell>
  )
}

export default App
