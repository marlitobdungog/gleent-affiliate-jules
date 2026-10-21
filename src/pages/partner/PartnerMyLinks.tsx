import { useEffect, useMemo, useState } from "react"
import { Check, Copy, ExternalLink, Link2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnalyticsRangeSelect } from "@/components/partner/AnalyticsRangeSelect"
import { partnerPortalApi } from "@/services/api"
import type { AffiliateAnalyticsRange, PartnerAffiliateLinkAnalytics, PartnerAffiliateLinksData, PartnerAffiliateProductsData } from "@/types/partnerPortal"

export function PartnerMyLinks() {
  const [data, setData] = useState<PartnerAffiliateProductsData | null>(null)
  const [linksData, setLinksData] = useState<PartnerAffiliateLinksData | null>(null)
  const [linkAnalytics, setLinkAnalytics] = useState<PartnerAffiliateLinkAnalytics | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [range, setRange] = useState<AffiliateAnalyticsRange>("30d")
  const [loading, setLoading] = useState(true)
  const [linksLoading, setLinksLoading] = useState(false)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linksError, setLinksError] = useState<string | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    partnerPortalApi.getAffiliateProducts()
      .then((result: PartnerAffiliateProductsData) => {
        if (!active) return
        setData(result)
        const firstProduct = result.products[0]
        if (firstProduct) {
          setSelectedProductId(firstProduct.id)
        }
      })
      .catch((requestError: any) => {
        if (!active) return
        setError(requestError?.message || "Unable to load your eligible products.")
      })
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedProductId) {
      setLinksData(null)
      return
    }

    let active = true
    setLinksLoading(true)
    setLinksError(null)
    partnerPortalApi.getAffiliateLinks(selectedProductId)
      .then((result: PartnerAffiliateLinksData) => {
        if (!active) return
        setLinksData(result)
      })
      .catch((requestError: any) => {
        if (!active) return
        setLinksError(requestError?.message || "Unable to generate links for this product.")
      })
      .finally(() => active && setLinksLoading(false))

    return () => { active = false }
  }, [selectedProductId])

  useEffect(() => {
    if (!selectedProductId) {
      setLinkAnalytics(null)
      return
    }

    let active = true
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    setLinkAnalytics(null)
    partnerPortalApi.getAffiliateLinkAnalytics(selectedProductId, range)
      .then((result: PartnerAffiliateLinkAnalytics) => active && setLinkAnalytics(result))
      .catch((requestError: any) => {
        if (!active) return
        setAnalyticsError(requestError?.message || "Click analytics are temporarily unavailable.")
      })
      .finally(() => active && setAnalyticsLoading(false))

    return () => { active = false }
  }, [selectedProductId, range])

  const selectedProduct = useMemo(
    () => data?.products.find(product => product.id === selectedProductId) ?? null,
    [data, selectedProductId],
  )
  const handleProductChange = (value: string) => {
    const product = data?.products.find(item => String(item.id) === value)
    setSelectedProductId(product?.id ?? null)
    setLinksData(null)
  }

  const copyLink = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      toast.success(`${label} copied`)
      window.setTimeout(() => setCopiedValue(current => current === value ? null : current), 1800)
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Loading links" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
        <p className="mt-1 text-muted-foreground">Share stable product links. Eligible visits are tracked as clicks; referrals and commissions follow the program rules.</p>
      </header>

      {error && <Alert variant="destructive"><AlertTitle>Could not load links</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      {data && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Partner Code</CardTitle>
            <CardDescription>This code identifies your affiliate account across the Gleent partner program.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-code">Your code</Label>
              <div className="flex gap-2">
                <Input id="partner-code" readOnly value={data.partner_code} className="bg-muted/50 font-mono" />
                <Button type="button" variant="outline" onClick={() => copyLink(data.partner_code, "Partner code")}>
                  {copiedValue === data.partner_code ? <Check className="size-4" /> : <Copy className="size-4" />}
                  <span className="ml-2 hidden sm:inline">Copy code</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!error && (!data || data.products.length === 0) && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>No products available yet</CardTitle>
            <CardDescription>Your admin needs to assign at least one active product before product links can be generated.</CardDescription>
          </CardHeader>
          {data?.legacy_link && <CardContent className="space-y-2">
            <Label htmlFor="legacy-link">Existing link</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="legacy-link" readOnly value={data.legacy_link} className="min-w-0 bg-muted/50 font-mono text-xs" />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => copyLink(data.legacy_link, "Existing link")}>
                  {copiedValue === data.legacy_link ? <Check className="size-4" /> : <Copy className="size-4" />}
                  <span className="ml-2">Copy</span>
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={data.legacy_link} target="_blank" rel="noopener noreferrer" aria-label="Preview existing affiliate link"><ExternalLink className="size-4" /></a>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">This existing link is preserved while product access is configured.</p>
          </CardContent>}
        </Card>
      )}

      {data && data.products.length > 0 && (
        <>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Choose a product</CardTitle>
              <CardDescription>Only products assigned to your account and currently available for promotion are shown.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eligible-product">Product</Label>
                <Select value={selectedProductId ? String(selectedProductId) : ""} onValueChange={handleProductChange}>
                  <SelectTrigger id="eligible-product"><SelectValue placeholder="Select a product" /></SelectTrigger>
                  <SelectContent>
                    {data.products.map(product => <SelectItem key={product.id} value={String(product.id)}>{product.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selectedProduct && <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">{selectedProduct.name}</h2>
                    {selectedProduct.description && <p className="mt-1 text-sm text-muted-foreground">{selectedProduct.description}</p>}
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs text-muted-foreground">Your current commission</p>
                    <p className="font-semibold">{selectedProduct.commission_display}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Configured attribution window: {selectedProduct.attribution_window_days} days</p>
              </div>}
            </CardContent>
          </Card>

          {selectedProduct && <Card className="shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Link2 className="size-5" />Product affiliate links</CardTitle>
                <CardDescription>Share a stable Gleent link and review its click activity.</CardDescription>
              </div>
              <AnalyticsRangeSelect value={range} onValueChange={setRange} />
            </CardHeader>
            <CardContent className="space-y-5">
              {selectedProduct.landing_pages.length === 0 && <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">This product has no active landing pages. Ask your admin to publish one.</div>}
              {linksError && <Alert variant="destructive"><AlertTitle>Link unavailable</AlertTitle><AlertDescription>{linksError}</AlertDescription></Alert>}
              {linksLoading && <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Preparing links…</div>}
              {analyticsError && <Alert variant="destructive"><AlertTitle>Click metrics unavailable</AlertTitle><AlertDescription>{analyticsError} You can still copy and share your links.</AlertDescription></Alert>}
              {linkAnalytics?.is_partial && <Alert><AlertTitle>Some history is unavailable</AlertTitle><AlertDescription>Verified click analytics start on {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: linkAnalytics.timezone }).format(new Date(linkAnalytics.data_available_from))}. Earlier visits are not included.</AlertDescription></Alert>}
              {linkAnalytics && !linkAnalytics.is_partial && <p className="text-xs text-muted-foreground">All-time metrics begin {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: linkAnalytics.timezone }).format(new Date(linkAnalytics.data_available_from))}.</p>}

              {!linksLoading && linksData && linksData.links.length > 0 && (
                <div className="space-y-4">
                  {linksData.links.map(link => {
                    const metrics = linkAnalytics?.links.find(item => item.landing_page_id === link.landing_page_id)
                    const unavailable = analyticsError || (!analyticsLoading && !metrics)

                    return (
                      <article key={link.landing_page_id} className="space-y-4 rounded-xl border border-border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{link.landing_page_name}</h3>
                            {link.is_default && <p className="text-xs text-muted-foreground">Default landing page</p>}
                          </div>
                          <Badge variant={link.available ? "secondary" : "destructive"}>{link.available ? "Active" : "Unavailable"}</Badge>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input aria-label={`${link.landing_page_name} affiliate link`} readOnly value={link.share_url} className="min-w-0 bg-muted/50 font-mono text-xs" />
                          <Button type="button" disabled={!link.available} onClick={() => copyLink(link.share_url, link.is_short_link ? "Short link" : "Affiliate link")}>
                            {copiedValue === link.share_url ? <Check className="size-4" /> : <Copy className="size-4" />}
                            <span className="ml-2">{copiedValue === link.share_url ? "Copied" : link.is_short_link ? "Copy short link" : "Copy link"}</span>
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">Total Clicks</p>
                            <p className="mt-1 text-xl font-semibold">{analyticsLoading ? "…" : unavailable ? "Unavailable" : metrics?.total_clicks ?? "—"}</p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">Unique Clicks</p>
                            <p className="mt-1 text-xl font-semibold">{analyticsLoading ? "…" : unavailable ? "Unavailable" : metrics?.unique_clicks ?? "—"}</p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">Referrals</p>
                            <p className="mt-1 text-xl font-semibold">{analyticsLoading ? "…" : metrics?.referrals == null ? "—" : metrics.referrals}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Not attributed to individual links</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button type="button" variant="outline" asChild>
                            <a href={link.destination_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 size-4" />Preview destination
                            </a>
                          </Button>
                          <span className="self-center text-xs text-muted-foreground">Previewing does not create an attributed visit.</span>
                        </div>

                        {!link.available ? (
                          <Alert variant="destructive"><AlertTitle>This link is unavailable</AlertTitle><AlertDescription>An administrator disabled this landing page or its destination is no longer eligible.</AlertDescription></Alert>
                        ) : link.is_short_link ? (
                          <Alert><AlertTitle>Tracked link</AlertTitle><AlertDescription>Gleent counts valid redirects and forwards your partner code with a short-lived attribution handoff. Referrals and commissions continue to follow program rules.</AlertDescription></Alert>
                        ) : link.tracking_mode === "redirect" ? (
                          <Alert><AlertTitle>Managed legacy link</AlertTitle><AlertDescription>Gleent records visits and forwards your partner code.</AlertDescription></Alert>
                        ) : (
                          <Alert><AlertTitle>Direct legacy link</AlertTitle><AlertDescription>This URL bypasses Gleent's redirect, so link-level click metrics are unavailable.</AlertDescription></Alert>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}

              {!linksLoading && linksData && linksData.links.length === 0 && selectedProduct.landing_pages.length > 0 && (
                <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">Links are unavailable for this product right now. Ask your admin to review its affiliate settings.</div>
              )}
            </CardContent>
          </Card>}

          {data.legacy_link && <details className="rounded-lg border border-border px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium">Existing legacy link</summary>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={data.legacy_link} className="min-w-0 bg-muted/50 font-mono text-xs" aria-label="Existing legacy affiliate link" />
              <Button type="button" variant="outline" onClick={() => copyLink(data.legacy_link, "Existing link")}>
                {copiedValue === data.legacy_link ? <Check className="size-4" /> : <Copy className="size-4" />}<span className="ml-2">Copy legacy link</span>
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">This link keeps its existing destination and behavior.</p>
          </details>}
        </>
      )}

      <Card className="shadow-none">
        <CardHeader><CardTitle>How it works</CardTitle></CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Choose a product and one of its active landing pages.</li>
            <li>Copy and share its stable link with potential customers.</li>
            <li>When the product site validates the attribution handoff and submits an eligible referral, it can be associated with your account.</li>
            <li>Commissions are recorded when referred deals close under the program terms.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

export default PartnerMyLinks
