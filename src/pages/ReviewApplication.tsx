import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Check, ExternalLink, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { applicationsApi } from "@/services/api"
import { applicationStatusConfig } from "@/lib/statusConfig"

export function ReviewApplication() {
  const navigate = useNavigate()
  const { id: applicationId } = useParams<{ id: string }>()
  const [application, setApplication] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [decisionNotes, setDecisionNotes] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [approvedDetails, setApprovedDetails] = React.useState<{
    partnerCode: string
    partnerLink: string
    commissionRate: string
    commissionType: string
    loginEmail: string
    temporaryPassword: string
  } | null>(null)

  React.useEffect(() => {
    if (applicationId) fetchApplication()
  }, [applicationId])

  const fetchApplication = async () => {
    setLoading(true)
    try {
      const data = await applicationsApi.getById(applicationId!)
      setApplication(data)
      setDecisionNotes(data.review_notes ?? "")
    } catch (err) {
      console.error("Failed to fetch application", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading application...</p>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Application not found.</p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate("/admin/applications")}>
          <ArrowLeft className="size-4 mr-1.5" />
          Back to Applications
        </Button>
      </div>
    )
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      const result = await applicationsApi.approve(applicationId!)
      setApprovedDetails({
        partnerCode: result.partner.partner_code,
        partnerLink: result.partner.partner_link,
        commissionRate: result.partner.commission_rate,
        commissionType: result.partner.commission_type,
        loginEmail: result.login_credentials.email,
        temporaryPassword: result.login_credentials.password,
      })
      await fetchApplication()
    } catch (err: any) {
      alert(err.message || "Failed to approve application")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    try {
      await applicationsApi.reject(applicationId!, decisionNotes)
      await fetchApplication()
      navigate("/admin/applications")
    } catch (err: any) {
      alert(err.message || "Failed to reject application")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNeedsMoreInfo = async () => {
    setIsProcessing(true)
    try {
      await applicationsApi.needsMoreInfo(applicationId!, decisionNotes)
      await fetchApplication()
    } catch (err: any) {
      alert(err.message || "Failed to update application")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" className="shrink-0 mt-0.5" onClick={() => navigate("/admin/applications")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Review Application
            </h1>
            <StatusBadge status={application.status} config={applicationStatusConfig} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {application.name} · {application.company_name} · Applied {new Date(application.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Personal Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Full Name" value={application.name} />
                <InfoField label="Email" value={application.email} />
                <InfoField label="Phone" value={application.phone ?? "—"} />
              </dl>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Company Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Company" value={application.company_name ?? "—"} />
                <InfoField label="Target Product" value={application.target_product?.name ?? "—"} />
              </dl>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Social Links / Website</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.website && (
                <SocialLink label="Website" url={application.website} />
              )}
              {application.social_link && (
                <SocialLink label="Social Link" url={application.social_link} />
              )}
              {!application.website && !application.social_link && (
                <p className="text-sm text-muted-foreground">No links provided.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Promotion Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Promotion Plan
                </p>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                  {application.promotion_plan ?? "—"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Audience Description</p>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                  {application.audience_description ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Approval Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="review-notes">Notes</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Add review notes..."
                  rows={4}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                />
              </div>

              {approvedDetails && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800 p-4 space-y-3">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Partner account created
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Share these portal login credentials with the partner. This password is shown
                    only once.
                  </p>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Partner Code</dt>
                      <dd className="font-mono font-medium">{approvedDetails.partnerCode}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Partner Link</dt>
                      <dd className="text-primary break-all">{approvedDetails.partnerLink}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Commission Plan</dt>
                      <dd>{approvedDetails.commissionType === 'percentage' ? `${approvedDetails.commissionRate}%` : approvedDetails.commissionRate}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Assigned Product</dt>
                      <dd>{application.target_product?.name}</dd>
                    </div>
                    <Separator />
                    <div>
                      <dt className="text-xs text-muted-foreground">Portal Login Email</dt>
                      <dd className="font-medium">{approvedDetails.loginEmail}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Temporary Password</dt>
                      <dd className="font-mono font-medium">{approvedDetails.temporaryPassword}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={handleApprove}
                  disabled={application.status === "approved" || !!approvedDetails || isProcessing}
                >
                  {isProcessing ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Check className="size-4 mr-1.5" />}
                  Approve Partner
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleReject}
                  disabled={application.status === "approved" || application.status === "rejected" || isProcessing}
                >
                  <X className="size-4 mr-1.5" />
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleNeedsMoreInfo}
                  disabled={application.status === "approved" || isProcessing}
                >
                  Request More Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  )
}

function SocialLink({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{url}</p>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0" asChild>
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
        </a>
      </Button>
    </div>
  )
}
