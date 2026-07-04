import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { partnersApi } from "@/services/api"
import { formatCurrency } from "@/lib/format"
import {
  commissionStatusConfig,
  dealStatusConfig,
  partnerStatusConfig,
  payoutStatusConfig,
  referralStatusConfig,
} from "@/lib/statusConfig"

interface PartnerDetailProps {
  partnerId: string
  onBack: () => void
}

export function PartnerDetail({ partnerId, onBack }: PartnerDetailProps) {
  const [partner, setPartner] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchPartner()
  }, [partnerId])

  const fetchPartner = async () => {
    setLoading(true)
    try {
      const data = await partnersApi.getById(partnerId)
      setPartner(data)
    } catch (err) {
      console.error("Failed to fetch partner", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading partner details...</p>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Partner not found.</p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1.5" />
          Back to Partners
        </Button>
      </div>
    )
  }

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
            {partner.company_name} · Joined {new Date(partner.joined_at).toLocaleDateString()}
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
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab partner={partner} />
        </TabsContent>
        <TabsContent value="referrals" className="mt-6">
          <DataTable
            emptyMessage="No referrals yet."
            columns={["Lead Name", "Email", "Product", "Status", "Created Date"]}
            rows={(partner.referrals || []).map((r: any) => [
              r.lead_name,
              r.lead_email,
              r.product?.name,
              <StatusBadge key={`s-${r.id}`} status={r.status} config={referralStatusConfig} />,
              new Date(r.created_at).toLocaleDateString(),
            ])}
          />
        </TabsContent>
        <TabsContent value="deals" className="mt-6">
          <DataTable
            emptyMessage="No deals yet."
            columns={["Deal Name", "Client", "Value", "Status", "Closed Date"]}
            rows={(partner.deals || []).map((d: any) => [
              d.deal_name,
              d.client_name,
              formatCurrency(d.deal_value),
              <StatusBadge key={`ds-${d.id}`} status={d.status} config={dealStatusConfig} />,
              d.closed_at ? new Date(d.closed_at).toLocaleDateString() : "—",
            ])}
          />
        </TabsContent>
        <TabsContent value="commissions" className="mt-6">
          <DataTable
            emptyMessage="No commissions yet."
            columns={["Deal", "Base Amount", "Rate", "Commission", "Status"]}
            rows={(partner.commissions || []).map((c: any) => [
              c.deal?.deal_name,
              formatCurrency(c.base_amount),
              c.commission_type === 'percentage' ? `${c.commission_rate}%` : formatCurrency(c.commission_rate),
              formatCurrency(c.commission_amount),
              <StatusBadge key={`s-${c.id}`} status={c.status} config={commissionStatusConfig} />,
            ])}
          />
        </TabsContent>
        <TabsContent value="payouts" className="mt-6">
          <DataTable
            emptyMessage="No payouts yet."
            columns={["Amount", "Method", "Reference", "Status", "Paid Date"]}
            rows={(partner.payouts || []).map((p: any) => [
              formatCurrency(p.amount),
              p.payment_method || "—",
              p.payment_reference || "—",
              <StatusBadge key={`s-${p.id}`} status={p.status} config={payoutStatusConfig} />,
              p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—",
            ])}
          />
        </TabsContent>
        <TabsContent value="links" className="mt-6">
          <LinksTab partner={partner} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab({ partner }: { partner: any }) {
  const fields = [
    { label: "Partner Name", value: partner.name },
    { label: "Email", value: partner.email },
    { label: "Phone", value: partner.phone ?? "—" },
    { label: "Company", value: partner.company_name ?? "—" },
    { label: "Status", value: <StatusBadge status={partner.status} config={partnerStatusConfig} /> },
    { label: "Commission Type", value: partner.commission_type },
    { label: "Commission Rate", value: partner.commission_type === 'percentage' ? `${partner.commission_rate}%` : formatCurrency(partner.commission_rate) },
    {
      label: "Partner Code",
      value: (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{partner.partner_code}</code>
      ),
    },
    {
      label: "Partner Link",
      value: (
        <a
          href={partner.partner_link}
          className="text-primary hover:underline text-sm"
          target="_blank"
          rel="noreferrer"
        >
          {partner.partner_link}
        </a>
      ),
    },
    { label: "Joined Date", value: new Date(partner.joined_at).toLocaleDateString() },
    { label: "Approved Date", value: partner.approved_at ? new Date(partner.approved_at).toLocaleDateString() : "—" },
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

function LinksTab({ partner }: { partner: any }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  }

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
              <Input readOnly value={partner.partner_code} className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(partner.partner_code)}>
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Partner Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={partner.partner_link} className="text-sm" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(partner.partner_link)}>
                <Copy className="size-4" />
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={partner.partner_link} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
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
