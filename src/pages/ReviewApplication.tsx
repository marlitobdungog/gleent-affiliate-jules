import * as React from "react"
import { ArrowLeft, Check, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { getApplicationById } from "@/data/mockAffiliateData"
import { applicationStatusConfig } from "@/lib/statusConfig"

interface ReviewApplicationProps {
  applicationId: string
  onBack: () => void
}

function generatePartnerCode(company: string): string {
  const prefix = company
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4)
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${suffix}`
}

export function ReviewApplication({ applicationId, onBack }: ReviewApplicationProps) {
  const application = getApplicationById(applicationId)
  const [decisionNotes, setDecisionNotes] = React.useState(application?.notes ?? "")
  const [approvedDetails, setApprovedDetails] = React.useState<{
    partnerCode: string
    partnerLink: string
  } | null>(null)

  if (!application) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Application not found.</p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1.5" />
          Back to Applications
        </Button>
      </div>
    )
  }

  const handleApprove = () => {
    const code = generatePartnerCode(application.company)
    setApprovedDetails({
      partnerCode: code,
      partnerLink: `https://sprinthr.com/ref/${code}`,
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" className="shrink-0 mt-0.5" onClick={onBack}>
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
            {application.applicantName} · {application.company} · Applied {application.appliedDate}
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
                <InfoField label="Full Name" value={application.applicantName} />
                <InfoField label="Email" value={application.email} />
                <InfoField label="Phone" value={application.phone ?? "—"} />
                <InfoField label="Partner Type" value={application.partnerType} />
              </dl>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Company Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <InfoField label="Company" value={application.company} />
                <InfoField label="Target Product" value={application.targetProduct} />
                <InfoField label="Source" value={application.source ?? "—"} />
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
              {application.linkedIn && (
                <SocialLink label="LinkedIn" url={application.linkedIn} />
              )}
              {application.twitter && (
                <SocialLink label="Twitter" url={application.twitter} />
              )}
              {!application.website && !application.linkedIn && !application.twitter && (
                <p className="text-sm text-muted-foreground">No social links provided.</p>
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
                  How they plan to promote SprintHR
                </p>
                <p className="text-sm text-foreground mt-1">
                  {application.promotionPlan ?? "—"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expected audience</p>
                <p className="text-sm text-foreground mt-1">
                  {application.expectedAudience ?? "—"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Audience / Network</p>
                <p className="text-sm text-foreground mt-1">{application.audienceNetwork}</p>
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
                      <dd>Standard — 10%</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Assigned Product</dt>
                      <dd>SprintHR</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Partner Account Access</dt>
                      <dd>Portal invite sent to {application.email}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={handleApprove}
                  disabled={application.status === "Approved" || !!approvedDetails}
                >
                  <Check className="size-4 mr-1.5" />
                  Approve Partner
                </Button>
                <Button variant="outline" className="w-full">
                  <X className="size-4 mr-1.5" />
                  Reject
                </Button>
                <Button variant="secondary" className="w-full">
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
      <div>
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
