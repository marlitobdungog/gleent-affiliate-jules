import { Fragment, useEffect, useMemo, useState } from "react"
import { Check, ChevronDown, Copy, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AnalyticsRangeSelect } from "@/components/partner/AnalyticsRangeSelect"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { partnerPortalApi } from "@/services/api"
import type {
  AffiliateAnalyticsRange,
  PartnerAffiliateLink,
  PartnerAffiliateLinkAnalytics,
  PartnerAffiliateLinksData,
  PartnerAffiliateProductsData,
} from "@/types/partnerPortal"

type LinkMetric = PartnerAffiliateLinkAnalytics["links"][number]

function formatMetric(value: number): string {
  return new Intl.NumberFormat("en-PH").format(value)
}

function formatAvailableDate(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: timezone,
  }).format(new Date(value))
}

export function PartnerMyLinks() {
  const [data, setData] = useState<PartnerAffiliateProductsData | null>(null)
  const [linksData, setLinksData] = useState<PartnerAffiliateLinksData | null>(null)
  const [linkAnalytics, setLinkAnalytics] = useState<PartnerAffiliateLinkAnalytics | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [range, setRange] = useState<AffiliateAnalyticsRange>("30d")
  const [expandedLinkId, setExpandedLinkId] = useState<number | null>(null)
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
        setSelectedProductId(result.products[0]?.id ?? null)
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
        setLinksError(requestError?.message || "Unable to prepare links for this product.")
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
    setLinkAnalytics(null)
    setLinksLoading(true)
    setAnalyticsLoading(true)
    setLinksError(null)
    setAnalyticsError(null)
    setExpandedLinkId(null)
  }

  const handleRangeChange = (value: AffiliateAnalyticsRange) => {
    setRange(value)
    setLinkAnalytics(null)
    setAnalyticsLoading(true)
    setAnalyticsError(null)
  }

  const copyLink = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      toast.success(label + " copied")
      window.setTimeout(() => setCopiedValue(current => current === value ? null : current), 1800)
    } catch {
      toast.error("Could not copy " + label.toLowerCase())
    }
  }

  const metricFor = (link: PartnerAffiliateLink) =>
    linkAnalytics?.links.find(item => item.landing_page_id === link.landing_page_id)

  const isTracked = (link: PartnerAffiliateLink) =>
    link.is_short_link || link.tracking_mode === "redirect"

  const renderClickValue = (link: PartnerAffiliateLink, metric: LinkMetric | undefined) => {
    if (!isTracked(link)) return "—"
    if (analyticsLoading) return <Skeleton className="ml-auto h-5 w-10" />
    if (analyticsError) return "Unavailable"
    return metric ? formatMetric(metric.total_clicks) : "—"
  }

  const renderDetails = (
    link: PartnerAffiliateLink,
    metric: LinkMetric | undefined,
    detailsId: string,
  ) => (
    <div id={detailsId} className="grid gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-2">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Unique Clicks</p>
        <p className="font-semibold">
          {!isTracked(link)
            ? "—"
            : analyticsLoading
              ? "Loading…"
              : analyticsError
                ? "Unavailable"
                : metric
                  ? formatMetric(metric.unique_clicks)
                  : "—"}
        </p>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <p className="text-xs font-medium text-muted-foreground">Full affiliate link</p>
        <p className="break-all font-mono text-xs text-muted-foreground">{link.share_url}</p>
      </div>
      {!isTracked(link) && (
        <p className="text-sm text-muted-foreground sm:col-span-2">
          This direct legacy link bypasses Gleent’s redirect, so Gleent cannot report its click count.
        </p>
      )}
      {!link.available && (
        <p className="text-sm text-destructive sm:col-span-2">
          This landing page is unavailable. An administrator may have disabled it or changed its destination.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={link.destination_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 size-4" />
            Preview destination
          </a>
        </Button>
        <span className="text-xs text-muted-foreground">Previewing does not create a tracked visit.</span>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6" role="status" aria-live="polite">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading your affiliate links…</p>
        </div>
        <Card className="shadow-none">
          <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_1.2fr_auto]">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    )
  }

  const availableFrom = linkAnalytics
    ? formatAvailableDate(linkAnalytics.data_available_from, linkAnalytics.timezone)
    : null

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
        <p className="mt-1 text-sm text-muted-foreground">Copy a landing page link and review its click activity.</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Could not load links</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <Card className="shadow-none">
          <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-end">
            <div className="min-w-0 space-y-1.5">
              <p id="partner-code-label" className="text-sm font-medium leading-none">Partner Code</p>
              <div className="flex items-center gap-2">
                <code aria-labelledby="partner-code-label" className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-sm">{data.partner_code}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={copiedValue === data.partner_code ? "Partner code copied" : "Copy partner code"}
                  onClick={() => void copyLink(data.partner_code, "Partner code")}
                >
                  {copiedValue === data.partner_code ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              {data.products.length > 1 ? (
                <>
                  <Label htmlFor="eligible-product">Product</Label>
                  <Select value={selectedProductId ? String(selectedProductId) : ""} onValueChange={handleProductChange}>
                    <SelectTrigger id="eligible-product"><SelectValue placeholder="Select a product" /></SelectTrigger>
                    <SelectContent>
                      {data.products.map(product => (
                        <SelectItem key={product.id} value={String(product.id)}>{product.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <div>
                  <p className="text-sm font-medium leading-none">Product</p>
                  <p className="mt-2 truncate rounded-md border border-input px-3 py-2 text-sm" title={data.products[0]?.name}>
                    {data.products[0]?.name ?? "No product assigned"}
                  </p>
                </div>
              )}
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  {selectedProduct.commission_display} commission · {selectedProduct.attribution_window_days}-day attribution
                </p>
              )}
            </div>

            <AnalyticsRangeSelect value={range} onValueChange={handleRangeChange} />
          </CardContent>
        </Card>
      )}

      {data && data.products.length === 0 && (
        <Alert>
          <AlertTitle>No products available yet</AlertTitle>
          <AlertDescription>Your admin needs to assign an active product before product links can be generated.</AlertDescription>
        </Alert>
      )}

      {selectedProduct && (
        <>
          <section aria-label="Selected product click metrics">
            {analyticsError && (
              <Alert variant="destructive" className="mb-3">
                <AlertTitle>Click metrics unavailable</AlertTitle>
                <AlertDescription>{analyticsError} Your affiliate links are still available to copy.</AlertDescription>
              </Alert>
            )}

            <Card className="shadow-none">
              <CardContent className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  { label: "Total Clicks", value: linkAnalytics?.metrics.total_clicks },
                  { label: "Unique Clicks", value: linkAnalytics?.metrics.unique_clicks },
                  { label: "Referrals", value: linkAnalytics?.metrics.referrals },
                ].map(metric => (
                  <div key={metric.label} className="flex items-center justify-between gap-4 px-4 py-3 first:pl-0 last:pr-0 sm:block sm:py-1 sm:first:pl-4">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-xl font-semibold tabular-nums" aria-live="polite">
                      {analyticsLoading
                        ? <Skeleton className="h-6 w-12" />
                        : analyticsError || metric.value === undefined
                          ? "Unavailable"
                          : formatMetric(metric.value)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {linkAnalytics && availableFrom && (
              linkAnalytics.is_partial ? (
                <Alert className="mt-3">
                  <AlertTitle>Some history is unavailable</AlertTitle>
                  <AlertDescription>
                    This period includes verified click data from {availableFrom} onward. Earlier visits are not included.
                  </AlertDescription>
                </Alert>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Verified click analytics are available from {availableFrom}; earlier visits are not included.
                </p>
              )
            )}
          </section>

          <section className="space-y-3" aria-labelledby="affiliate-links-heading">
            <div>
              <h2 id="affiliate-links-heading" className="text-lg font-semibold">Landing page links</h2>
              <p className="text-sm text-muted-foreground">Copy a link directly from its row.</p>
            </div>

            {linksError && (
              <Alert variant="destructive">
                <AlertTitle>Links unavailable</AlertTitle>
                <AlertDescription>{linksError}</AlertDescription>
              </Alert>
            )}

            {linksLoading && (
              <div className="space-y-2" role="status" aria-label="Loading landing page links">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}

            {!linksLoading && !linksError && selectedProduct.landing_pages.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                This product has no active landing pages. Ask your admin to publish one.
              </div>
            )}

            {!linksLoading && !linksError && linksData && linksData.links.length === 0 && selectedProduct.landing_pages.length > 0 && (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                Links are unavailable for this product right now. Ask your admin to review its affiliate settings.
              </div>
            )}

            {!linksLoading && !linksError && linksData && linksData.links.length > 0 && (
              <>
                <Card className="hidden border border-border shadow-none md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Landing page</TableHead>
                        <TableHead>Short link</TableHead>
                        <TableHead className="text-right">Total clicks</TableHead>
                        <TableHead className="w-40 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linksData.links.map(link => {
                        const metric = metricFor(link)
                        const expanded = expandedLinkId === link.landing_page_id
                        const detailsId = "desktop-link-details-" + link.landing_page_id
                        return (
                          <Fragment key={"link-" + link.landing_page_id}>
                            <TableRow>
                              <TableCell className="font-medium">
                                <span>{link.landing_page_name}</span>
                                {link.is_default && <span className="ml-2 text-xs text-muted-foreground">Default</span>}
                                {!link.available && <span className="ml-2 text-xs text-destructive">Unavailable</span>}
                              </TableCell>
                              <TableCell className="max-w-[260px]">
                                <span className="block truncate font-mono text-xs text-muted-foreground" title={link.share_url}>{link.share_url}</span>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{renderClickValue(link, metric)}</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={!link.available}
                                    aria-label={"Copy link for " + link.landing_page_name}
                                    onClick={() => void copyLink(link.share_url, "Affiliate link")}
                                  >
                                    {copiedValue === link.share_url ? <Check className="mr-1 size-4" /> : <Copy className="mr-1 size-4" />}
                                    {copiedValue === link.share_url ? "Copied" : "Copy"}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    aria-label={(expanded ? "Hide" : "Show") + " details for " + link.landing_page_name}
                                    aria-expanded={expanded}
                                    aria-controls={detailsId}
                                    onClick={() => setExpandedLinkId(expanded ? null : link.landing_page_id)}
                                  >
                                    <ChevronDown className={"size-4 transition-transform " + (expanded ? "rotate-180" : "")} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            <TableRow hidden={!expanded}>
                              <TableCell colSpan={4} className="bg-muted/20 p-3">
                                {renderDetails(link, metric, detailsId)}
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Card>

                <div className="space-y-2 md:hidden">
                  {linksData.links.map(link => {
                    const metric = metricFor(link)
                    const expanded = expandedLinkId === link.landing_page_id
                    const detailsId = "mobile-link-details-" + link.landing_page_id
                    return (
                      <article key={"mobile-link-" + link.landing_page_id} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-medium">{link.landing_page_name}</h3>
                            {link.is_default && <p className="mt-0.5 text-xs text-muted-foreground">Default landing page</p>}
                            {!link.available && <p className="mt-0.5 text-xs text-destructive">Unavailable</p>}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs text-muted-foreground">Total clicks</p>
                            <p className="font-semibold tabular-nums">{renderClickValue(link, metric)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="min-h-10"
                            disabled={!link.available}
                            aria-label={"Copy link for " + link.landing_page_name}
                            onClick={() => void copyLink(link.share_url, "Affiliate link")}
                          >
                            {copiedValue === link.share_url ? <Check className="mr-1 size-4" /> : <Copy className="mr-1 size-4" />}
                            {copiedValue === link.share_url ? "Copied" : "Copy link"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="min-h-10"
                            aria-expanded={expanded}
                            aria-controls={detailsId}
                            aria-label={(expanded ? "Hide" : "Show") + " details for " + link.landing_page_name}
                            onClick={() => setExpandedLinkId(expanded ? null : link.landing_page_id)}
                          >
                            Details
                            <ChevronDown className={"ml-1 size-4 transition-transform " + (expanded ? "rotate-180" : "")} />
                          </Button>
                        </div>
                        <div className="mt-3" hidden={!expanded}>
                          {renderDetails(link, metric, detailsId)}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </>
            )}
          </section>

          <p className="text-sm text-muted-foreground">
            Referrals are attributed at the partner and product level, not to individual links.{" "}
            <Link to="/partner/referrals" className="font-medium text-primary underline-offset-4 hover:underline">View referrals</Link>.
          </p>
        </>
      )}

      {data?.legacy_link && (
        <details className="rounded-lg border border-border px-4 py-3">
          <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium">Existing legacy link</summary>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">{data.legacy_link}</code>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void copyLink(data.legacy_link, "Existing link")}>
                {copiedValue === data.legacy_link ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span className="ml-2">{copiedValue === data.legacy_link ? "Copied" : "Copy legacy link"}</span>
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={data.legacy_link} target="_blank" rel="noopener noreferrer" aria-label="Open existing legacy affiliate link">
                  <ExternalLink className="size-4" />
                  <span className="ml-2">Open link</span>
                </a>
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">This link keeps its existing destination and behavior.</p>
        </details>
      )}

      <details className="rounded-lg border border-border px-4 py-3">
        <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium">How link tracking works</summary>
        <div className="space-y-2 pb-2 pt-1 text-sm text-muted-foreground">
          <p>Eligible visits through a Gleent short link or managed redirect are counted as clicks. Unique clicks estimate distinct browsers using a first-party identifier.</p>
          <p>Direct legacy links bypass Gleent’s redirect and do not produce link click metrics. Preview destination opens the destination directly and does not create a tracked visit.</p>
          <p>Referrals and commissions continue to follow the program’s attribution rules and the product terms shown above.</p>
        </div>
      </details>
    </div>
  )
}

export default PartnerMyLinks
