import * as React from "react"
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  FileText,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
  getActivityLogsByPartnerId,
  getCommissionsByPartnerId,
  getDealsByPartnerId,
  getDocumentsByPartnerId,
  getPartnerById,
  getPayoutsByPartnerId,
  getReferralsByPartnerId,
} from "@/data/mockAffiliateData"
import { formatCurrency, formatPercent } from "@/lib/format"
import {
  commissionStatusConfig,
  dealStatusConfig,
  partnerStatusConfig,
  payoutStatusConfig,
  referralStatusConfig,
} from "@/lib/statusConfig"
import type { Partner } from "@/types/affiliate"

interface PartnerDetailProps {
  partnerId: string
  onBack: () => void
}

export function PartnerDetail({ partnerId, onBack }: PartnerDetailProps) {
  const partner = getPartnerById(partnerId)

  if (!partner) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Partner not found.</p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1.5" />
          Back to Partners
        </Button>
      </div>
    )
  }

  const referrals = getReferralsByPartnerId(partnerId)
  const deals = getDealsByPartnerId(partnerId)
  const commissions = getCommissionsByPartnerId(partnerId)
  const payouts = getPayoutsByPartnerId(partnerId)
  const documents = getDocumentsByPartnerId(partnerId)
  const activityLogs = getActivityLogsByPartnerId(partnerId)

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" className="shrink-0 mt-0.5" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h1 className="text-xl font-semibold text-foreground tracking-tight truncate">
              {partner.name}
            </h1>
            <StatusBadge status={partner.status} config={partnerStatusConfig} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {partner.company} · {partner.partnerType} · Joined {partner.joinedDate}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="links">Links & Codes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab partner={partner} />
        </TabsContent>
        <TabsContent value="referrals" className="mt-6">
          <DataTable
            emptyMessage="No referrals yet."
            columns={[
              "Lead Name",
              "Company",
              "Product",
              "Source",
              "Status",
              "Assigned Salesperson",
              "Created Date",
              "Last Activity",
            ]}
            rows={referrals.map((r) => [
              r.leadName,
              r.company,
              r.product,
              r.source,
              <StatusBadge key={`s-${r.id}`} status={r.status} config={referralStatusConfig} />,
              r.assignedSalesperson ?? "—",
              r.createdDate,
              r.lastActivity,
            ])}
          />
        </TabsContent>
        <TabsContent value="deals" className="mt-6">
          <DataTable
            emptyMessage="No deals yet."
            columns={[
              "Deal Name",
              "Client",
              "Product",
              "Deal Value",
              "Deal Status",
              "Closed Date",
              "Commission Amount",
              "Commission Status",
            ]}
            rows={deals.map((d) => [
              d.dealName,
              d.client,
              d.product,
              formatCurrency(d.dealValue),
              <StatusBadge key={`ds-${d.id}`} status={d.dealStatus} config={dealStatusConfig} />,
              d.closedDate ?? "—",
              d.commissionAmount != null ? formatCurrency(d.commissionAmount) : "—",
              <StatusBadge
                key={`cs-${d.id}`}
                status={d.commissionStatus}
                config={commissionStatusConfig}
              />,
            ])}
          />
        </TabsContent>
        <TabsContent value="commissions" className="mt-6">
          <DataTable
            emptyMessage="No commissions yet."
            columns={[
              "Deal",
              "Product",
              "Deal Value",
              "Commission Rate",
              "Commission Amount",
              "Status",
              "Approved By",
              "Approved Date",
            ]}
            rows={commissions.map((c) => [
              c.deal,
              c.product,
              formatCurrency(c.baseAmount),
              formatPercent(c.commissionRate),
              formatCurrency(c.commissionAmount),
              <StatusBadge key={`s-${c.id}`} status={c.status} config={commissionStatusConfig} />,
              c.approvedBy ?? "—",
              c.approvedDate ?? "—",
            ])}
          />
        </TabsContent>
        <TabsContent value="payouts" className="mt-6">
          <DataTable
            emptyMessage="No payouts yet."
            columns={[
              "Payout Period",
              "Amount",
              "Method",
              "Reference No.",
              "Status",
              "Created Date",
              "Paid Date",
            ]}
            rows={payouts.map((p) => [
              p.payoutPeriod,
              formatCurrency(p.amount),
              p.method,
              <code key={`ref-${p.id}`} className="text-xs font-mono">
                {p.referenceNo}
              </code>,
              <StatusBadge key={`s-${p.id}`} status={p.status} config={payoutStatusConfig} />,
              p.createdDate,
              p.paidDate ?? "—",
            ])}
          />
        </TabsContent>
        <TabsContent value="links" className="mt-6">
          <LinksTab partner={partner} />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <DocumentsTab documents={documents} />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ActivityLogTab logs={activityLogs} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab partner={partner} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab({ partner }: { partner: Partner }) {
  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Partner Name", value: partner.name },
    { label: "Email", value: partner.email },
    { label: "Phone", value: partner.phone },
    { label: "Company", value: partner.company },
    { label: "Partner Type", value: partner.partnerType },
    { label: "Status", value: <StatusBadge status={partner.status} config={partnerStatusConfig} /> },
    { label: "Assigned Products", value: partner.assignedProducts.join(", ") },
    { label: "Commission Plan", value: partner.commissionPlan },
    {
      label: "Partner Code",
      value: (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{partner.partnerCode}</code>
      ),
    },
    {
      label: "Partner Link",
      value: (
        <a
          href={partner.partnerLink}
          className="text-primary hover:underline text-sm"
          target="_blank"
          rel="noreferrer"
        >
          {partner.partnerLink}
        </a>
      ),
    },
    { label: "Joined Date", value: partner.joinedDate },
    { label: "Approved By", value: partner.approvedBy ?? "—" },
    { label: "Approved Date", value: partner.approvedDate ?? "—" },
  ]

  return (
    <Card className="border border-border shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Partner Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
              <dd className="mt-1 text-sm text-foreground">{field.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function LinksTab({ partner }: { partner: Partner }) {
  return (
    <div className="space-y-4">
      <Card className="border border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Referral Link & Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Partner Code</Label>
            <div className="flex gap-2">
              <Input readOnly value={partner.partnerCode} className="font-mono text-sm" />
              <Button variant="outline" size="icon">
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Partner Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={partner.partnerLink} className="text-sm" />
              <Button variant="outline" size="icon">
                <Copy className="size-4" />
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={partner.partnerLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>
          <Separator />
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-1.5" />
            Regenerate Link
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">UTM Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">utm_source</span>
              <p className="font-mono mt-0.5">partner</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">utm_medium</span>
              <p className="font-mono mt-0.5">referral</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">utm_campaign</span>
              <p className="font-mono mt-0.5">{partner.partnerCode.toLowerCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DocumentsTab({
  documents,
}: {
  documents: ReturnType<typeof getDocumentsByPartnerId>
}) {
  if (documents.length === 0) {
    return (
      <Card className="border border-border shadow-none">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No documents uploaded.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border shadow-none">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition-colors"
            >
              <FileText className="size-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.type} · {doc.size} · Uploaded {doc.uploadedDate}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityLogTab({
  logs,
}: {
  logs: ReturnType<typeof getActivityLogsByPartnerId>
}) {
  if (logs.length === 0) {
    return (
      <Card className="border border-border shadow-none">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No activity recorded.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border shadow-none">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {logs.map((log) => (
            <div key={log.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{log.action}</p>
                  {log.details && (
                    <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    by {log.performedBy} · {log.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsTab({ partner }: { partner: Partner }) {
  return (
    <div className="space-y-4 max-w-lg">
      <Card className="border border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Partner Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="commission-plan">Commission Plan</Label>
            <Input id="commission-plan" defaultValue={partner.commissionPlan} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner-notes">Internal Notes</Label>
            <Textarea
              id="partner-notes"
              placeholder="Add internal notes about this partner..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Account Access</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow partner to log in to the partner portal
              </p>
            </div>
            <Switch defaultChecked={partner.status === "Active"} />
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button size="sm">Save Changes</Button>
            {partner.status !== "Suspended" && (
              <Button variant="destructive" size="sm">
                Suspend Partner
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DataTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: string[]
  rows: React.ReactNode[][]
  emptyMessage: string
}) {
  if (rows.length === 0) {
    return (
      <Card className="border border-border shadow-none">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border shadow-none">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-6 py-3 text-foreground whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
