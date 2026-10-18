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
import { partnerPortalApi } from "@/services/api"
import type { PartnerAffiliateLinksData, PartnerAffiliateProductsData } from "@/types/partnerPortal"

export function PartnerMyLinks() {
  const [data, setData] = useState<PartnerAffiliateProductsData | null>(null)
  const [linksData, setLinksData] = useState<PartnerAffiliateLinksData | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedLandingPageId, setSelectedLandingPageId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [linksLoading, setLinksLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linksError, setLinksError] = useState<string | null>(null)
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
          setSelectedLandingPageId(firstProduct.default_landing_page_id ?? firstProduct.landing_pages[0]?.id ?? null)
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
        const product = data?.products.find(item => item.id === selectedProductId)
        const defaultId = product?.default_landing_page_id ?? result.links.find(link => link.is_default)?.landing_page_id ?? result.links[0]?.landing_page_id ?? null
        setSelectedLandingPageId(current => result.links.some(link => link.landing_page_id === current) ? current : defaultId)
      })
      .catch((requestError: any) => {
        if (!active) return
        setLinksError(requestError?.message || "Unable to generate links for this product.")
      })
      .finally(() => active && setLinksLoading(false))

    return () => { active = false }
  }, [selectedProductId, data])

  const selectedProduct = useMemo(
    () => data?.products.find(product => product.id === selectedProductId) ?? null,
    [data, selectedProductId],
  )
  const selectedLink = useMemo(
    () => linksData?.links.find(link => link.landing_page_id === selectedLandingPageId) ?? null,
    [linksData, selectedLandingPageId],
  )

  const handleProductChange = (value: string) => {
    const product = data?.products.find(item => String(item.id) === value)
    setSelectedProductId(product?.id ?? null)
    setSelectedLandingPageId(product?.default_landing_page_id ?? product?.landing_pages[0]?.id ?? null)
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="size-5" />Product affiliate link</CardTitle>
              <CardDescription>Choose a landing page and share its stable Gleent link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {selectedProduct.landing_pages.length > 0 ? <div className="space-y-2">
                <Label htmlFor="landing-page">Landing page</Label>
                <Select value={selectedLandingPageId ? String(selectedLandingPageId) : ""} onValueChange={value => setSelectedLandingPageId(Number(value))}>
                  <SelectTrigger id="landing-page"><SelectValue placeholder="Select a landing page" /></SelectTrigger>
                  <SelectContent>
                    {selectedProduct.landing_pages.map(page => <SelectItem key={page.id} value={String(page.id)}>{page.name}{page.is_default ? " (Default)" : ""}{!page.is_active ? " (Unavailable)" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div> : <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">This product has no active landing pages. Ask your admin to publish one.</div>}

              {linksError && <Alert variant="destructive"><AlertTitle>Link unavailable</AlertTitle><AlertDescription>{linksError}</AlertDescription></Alert>}
              {linksLoading && <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Preparing links…</div>}
              {!linksLoading && selectedLink && <>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="share-link">{selectedLink.is_short_link ? "Your short link" : "Your affiliate link"}</Label>
                    <Badge variant={selectedLink.available ? "secondary" : "destructive"}>
                      {selectedLink.available ? "Active" : "Unavailable"}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input id="share-link" readOnly value={selectedLink.share_url} className="min-w-0 bg-muted/50 font-mono text-xs" />
                    <Button type="button" disabled={!selectedLink.available} onClick={() => copyLink(selectedLink.share_url, selectedLink.is_short_link ? "Short link" : "Affiliate link")}>
                      {copiedValue === selectedLink.share_url ? <Check className="size-4" /> : <Copy className="size-4" />}
                      <span className="ml-2">{copiedValue === selectedLink.share_url ? "Copied" : selectedLink.is_short_link ? "Copy short link" : "Copy link"}</span>
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" asChild>
                    <a href={selectedLink.destination_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 size-4" />Preview destination
                    </a>
                  </Button>
                  <span className="self-center text-xs text-muted-foreground">Previewing does not create an attributed visit.</span>
                </div>
                {!selectedLink.available ? (
                  <Alert variant="destructive"><AlertTitle>This link is unavailable</AlertTitle><AlertDescription>An administrator disabled this landing page or its destination is no longer eligible. Choose an active landing page or contact your administrator.</AlertDescription></Alert>
                ) : selectedLink.is_short_link ? (
                  <Alert><AlertTitle>Tracked link</AlertTitle><AlertDescription>Gleent records visits as clicks and forwards your partner code with a short-lived attribution handoff. The destination site must validate and retain attribution for eligible referrals. A click alone does not create a lead or commission.</AlertDescription></Alert>
                ) : selectedLink.tracking_mode === "redirect" ? (
                  <Alert><AlertTitle>Managed legacy link</AlertTitle><AlertDescription>Gleent records visits and forwards your partner code. The destination site must retain that code to attribute eligible referrals.</AlertDescription></Alert>
                ) : (
                  <Alert><AlertTitle>Direct legacy link</AlertTitle><AlertDescription>This link includes your partner code as a URL parameter. The destination site must store that code to attribute eligible referrals. Once shared, this direct URL cannot be disabled by Gleent.</AlertDescription></Alert>
                )}
              </>}

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
