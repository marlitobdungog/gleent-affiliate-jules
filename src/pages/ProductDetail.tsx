import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useBlocker, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { AlertTriangle, ArrowLeft, Check, Copy, Link2, Loader2, Plus, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { productsApi } from "@/services/api"
import { formatCurrencyPrecise } from "@/lib/format"
import { productStatusConfig } from "@/lib/statusConfig"

type Product = {
  id: number
  name: string
  slug: string
  description: string | null
  website_url: string | null
  status: "active" | "inactive"
  default_commission_type: "percentage" | "fixed"
  default_commission_rate: string | number
  affiliate_settings: AffiliateSettings | null
  landing_pages: LandingPage[]
  global_attribution_window_days: number
  created_at: string
}

type AffiliateSettings = {
  tracking_mode: "redirect" | "direct"
  referral_parameter: string
  attribution_window_days: number | null
}

type LandingPage = {
  id: number
  name: string
  destination_url: string
  is_default: boolean
  is_active: boolean
}

type GeneralForm = {
  name: string
  website_url: string
  description: string
  status: "active" | "inactive"
}

type AffiliateForm = {
  tracking_mode: "redirect" | "direct"
  referral_parameter: string
  attribution_window_days: string
  base_destination_url: string
}

type CommissionForm = {
  default_commission_type: "percentage" | "fixed"
  default_commission_rate: string
}

type ValidationErrors = Record<string, string[]>

const tabs = ["general", "links", "landing-pages", "commissions"] as const
type ProductTab = (typeof tabs)[number]
const sampleCode = "ABC123"

function errorMessage(error: any, fallback: string) {
  return typeof error?.message === "string" ? error.message : fallback
}

function validationErrors(error: any): ValidationErrors {
  return error?.errors && typeof error.errors === "object" ? error.errors : {}
}

function fieldError(errors: ValidationErrors, field: string) {
  return errors[field]?.[0]
}

function withSampleReferral(destination: string, parameter: string) {
  try {
    const url = new URL(destination)
    if (url.protocol !== "https:" || url.username || url.password) return ""
    url.searchParams.set(parameter || "ref", sampleCode)
    return url.toString()
  } catch {
    return ""
  }
}

function isTab(value: string | null): value is ProductTab {
  return !!value && tabs.includes(value as ProductTab)
}

export function ProductDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: ProductTab = isTab(searchParams.get("tab")) ? searchParams.get("tab") as ProductTab : "general"
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [general, setGeneral] = useState<GeneralForm>({ name: "", website_url: "", description: "", status: "active" })
  const [savedGeneral, setSavedGeneral] = useState<GeneralForm>({ name: "", website_url: "", description: "", status: "active" })
  const [generalErrors, setGeneralErrors] = useState<ValidationErrors>({})
  const [savingGeneral, setSavingGeneral] = useState(false)

  const [affiliate, setAffiliate] = useState<AffiliateForm>({
    tracking_mode: "direct",
    referral_parameter: "ref",
    attribution_window_days: "",
    base_destination_url: "",
  })
  const [savedAffiliate, setSavedAffiliate] = useState<AffiliateForm>({
    tracking_mode: "direct",
    referral_parameter: "ref",
    attribution_window_days: "",
    base_destination_url: "",
  })
  const [affiliateErrors, setAffiliateErrors] = useState<ValidationErrors>({})
  const [savingAffiliate, setSavingAffiliate] = useState(false)
  const [previewPageId, setPreviewPageId] = useState("")

  const [commission, setCommission] = useState<CommissionForm>({ default_commission_type: "percentage", default_commission_rate: "" })
  const [savedCommission, setSavedCommission] = useState<CommissionForm>({ default_commission_type: "percentage", default_commission_rate: "" })
  const [commissionErrors, setCommissionErrors] = useState<ValidationErrors>({})
  const [savingCommission, setSavingCommission] = useState(false)
  const [exampleSale, setExampleSale] = useState("10000")

  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [landingDialogOpen, setLandingDialogOpen] = useState(false)
  const [editingLandingPage, setEditingLandingPage] = useState<LandingPage | null>(null)
  const [landingForm, setLandingForm] = useState({ name: "", destination_url: "" })
  const [landingErrors, setLandingErrors] = useState<ValidationErrors>({})
  const [savingLandingPage, setSavingLandingPage] = useState(false)

  const generalDirty = JSON.stringify(general) !== JSON.stringify(savedGeneral)
  const affiliateDirty = JSON.stringify(affiliate) !== JSON.stringify(savedAffiliate)
  const commissionDirty = JSON.stringify(commission) !== JSON.stringify(savedCommission)
  const landingFormInitial = editingLandingPage
    ? { name: editingLandingPage.name, destination_url: editingLandingPage.destination_url }
    : { name: "", destination_url: "" }
  const landingDialogDirty = landingDialogOpen && JSON.stringify(landingForm) !== JSON.stringify(landingFormInitial)
  const hasUnsavedChanges = generalDirty || affiliateDirty || commissionDirty || landingDialogDirty
  const globalAttributionDays = product?.global_attribution_window_days ?? 30
  const blocker = useBlocker(hasUnsavedChanges)

  useEffect(() => {
    if (id) void loadProduct(id)
  }, [id])

  useEffect(() => {
    if (!hasUnsavedChanges) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (blocker.state !== "blocked") return
    if (window.confirm("Discard unsaved product configuration changes?")) {
      discardDrafts()
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker.state])

  async function loadProduct(productId: string) {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await productsApi.getById(productId) as Product
      const generalData: GeneralForm = {
        name: data.name,
        website_url: data.website_url ?? "",
        description: data.description ?? "",
        status: data.status,
      }
      const defaultPage = data.landing_pages?.find(page => page.is_active && page.is_default)
      const affiliateData: AffiliateForm = {
        tracking_mode: data.affiliate_settings?.tracking_mode ?? "direct",
        referral_parameter: data.affiliate_settings?.referral_parameter ?? "ref",
        attribution_window_days: data.affiliate_settings?.attribution_window_days == null
          ? ""
          : String(data.affiliate_settings.attribution_window_days),
        base_destination_url: defaultPage?.destination_url ?? "",
      }
      const commissionData: CommissionForm = {
        default_commission_type: data.default_commission_type,
        default_commission_rate: String(data.default_commission_rate),
      }

      setProduct(data)
      setLandingPages(data.landing_pages ?? [])
      setGeneral(generalData)
      setSavedGeneral(generalData)
      setAffiliate(affiliateData)
      setSavedAffiliate(affiliateData)
      setCommission(commissionData)
      setSavedCommission(commissionData)
      setPreviewPageId(defaultPage ? String(defaultPage.id) : "")
    } catch (error) {
      setLoadError(errorMessage(error, "Unable to load this product."))
    } finally {
      setLoading(false)
    }
  }

  function discardDrafts() {
    setGeneral(savedGeneral)
    setAffiliate(savedAffiliate)
    setCommission(savedCommission)
    setGeneralErrors({})
    setAffiliateErrors({})
    setCommissionErrors({})
    setLandingDialogOpen(false)
    setLandingForm(landingFormInitial)
  }

  function changeTab(value: string) {
    if (!isTab(value) || value === activeTab) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("tab", value)
    setSearchParams(nextParams)
  }

  function goBack() {
    navigate("/admin/products")
  }

  async function saveGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id) return
    if (savedGeneral.status === "active" && general.status === "inactive") {
      const confirmed = window.confirm("Deactivate this product? It will be hidden from new partner referral submissions, and its Gleent short links will stop redirecting. Previously shared direct URLs may continue working.")
      if (!confirmed) return
    }

    setSavingGeneral(true)
    setGeneralErrors({})
    try {
      const data = await productsApi.update(id, general) as Product
      const saved = { ...general }
      setSavedGeneral(saved)
      setProduct(current => current ? { ...current, ...data } : current)
      toast.success("General settings saved")
    } catch (error) {
      setGeneralErrors(validationErrors(error))
      toast.error(errorMessage(error, "Could not save general settings"))
    } finally {
      setSavingGeneral(false)
    }
  }

  async function saveAffiliate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id) return
    setSavingAffiliate(true)
    setAffiliateErrors({})
    try {
      const response = await productsApi.updateAffiliateSettings(id, {
        tracking_mode: affiliate.tracking_mode,
        referral_parameter: affiliate.referral_parameter,
        attribution_window_days: affiliate.attribution_window_days === "" ? null : Number(affiliate.attribution_window_days),
        base_destination_url: affiliate.base_destination_url || null,
      }) as { affiliate_settings: AffiliateSettings; base_destination_url: string | null }
      const saved = { ...affiliate, base_destination_url: response.base_destination_url ?? "" }
      setAffiliate(saved)
      setSavedAffiliate(saved)
      setProduct(current => current ? { ...current, affiliate_settings: response.affiliate_settings } : current)
      await refreshLandingPages()
      toast.success("Affiliate link settings saved")
    } catch (error) {
      setAffiliateErrors(validationErrors(error))
      toast.error(errorMessage(error, "Could not save affiliate link settings"))
    } finally {
      setSavingAffiliate(false)
    }
  }

  async function saveCommission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id) return
    setSavingCommission(true)
    setCommissionErrors({})
    try {
      const data = await productsApi.update(id, {
        default_commission_type: commission.default_commission_type,
        default_commission_rate: commission.default_commission_rate,
      }) as Product
      const saved = { ...commission }
      setSavedCommission(saved)
      setProduct(current => current ? { ...current, ...data } : current)
      toast.success("Default commission saved")
    } catch (error) {
      setCommissionErrors(validationErrors(error))
      toast.error(errorMessage(error, "Could not save default commission"))
    } finally {
      setSavingCommission(false)
    }
  }

  async function refreshLandingPages() {
    if (!id) return
    const pages = await productsApi.getLandingPages(id) as LandingPage[]
    const defaultPage = pages.find(page => page.is_active && page.is_default)
    setLandingPages(pages)
    setAffiliate(current => ({ ...current, base_destination_url: defaultPage?.destination_url ?? "" }))
    setSavedAffiliate(current => ({ ...current, base_destination_url: defaultPage?.destination_url ?? "" }))
    setPreviewPageId(defaultPage ? String(defaultPage.id) : "")
    setProduct(current => current ? { ...current, landing_pages: pages } : current)
  }

  function openCreateLandingPage() {
    setEditingLandingPage(null)
    setLandingForm({ name: "", destination_url: "" })
    setLandingErrors({})
    setLandingDialogOpen(true)
  }

  function openEditLandingPage(page: LandingPage) {
    setEditingLandingPage(page)
    setLandingForm({ name: page.name, destination_url: page.destination_url })
    setLandingErrors({})
    setLandingDialogOpen(true)
  }

  function requestCloseLandingDialog() {
    if (JSON.stringify(landingForm) !== JSON.stringify(landingFormInitial)
      && !window.confirm("Discard unsaved landing page changes?")) return
    setLandingDialogOpen(false)
  }

  async function saveLandingPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id) return
    setSavingLandingPage(true)
    setLandingErrors({})
    try {
      if (editingLandingPage) {
        await productsApi.updateLandingPage(id, editingLandingPage.id, landingForm)
      } else {
        await productsApi.createLandingPage(id, landingForm)
      }
      await refreshLandingPages()
      setLandingDialogOpen(false)
      toast.success(editingLandingPage ? "Landing page updated" : "Landing page added")
    } catch (error) {
      setLandingErrors(validationErrors(error))
      toast.error(errorMessage(error, "Could not save landing page"))
    } finally {
      setSavingLandingPage(false)
    }
  }

  async function setLandingPageDefault(page: LandingPage) {
    if (!id) return
    try {
      await productsApi.makeLandingPageDefault(id, page.id)
      await refreshLandingPages()
      toast.success(`${page.name} is now the default destination`)
    } catch (error) {
      toast.error(errorMessage(error, "Could not change the default landing page"))
    }
  }

  async function toggleLandingPage(page: LandingPage) {
    if (!id) return
    if (page.is_active) {
      const warning = page.is_default
        ? "Archive this default landing page? Its short links will stop redirecting until it is reactivated. Another active page will become the default, or the product will have no configured destination if this is the last active page."
        : "Archive this landing page? Its short links will stop redirecting until it is reactivated."
      if (!window.confirm(warning)) return
    }
    try {
      await productsApi.updateLandingPage(id, page.id, { is_active: !page.is_active })
      await refreshLandingPages()
      if (previewPageId === String(page.id) && page.is_active) setPreviewPageId("")
      toast.success(page.is_active ? "Landing page archived" : "Landing page activated")
    } catch (error) {
      toast.error(errorMessage(error, "Could not update landing page"))
    }
  }

  async function copyPreview(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Example link copied")
    } catch {
      toast.error("Could not copy example link")
    }
  }

  const activePages = useMemo(() => landingPages.filter(page => page.is_active), [landingPages])
  const selectedPreviewPage = activePages.find(page => String(page.id) === previewPageId)
  const previewDestination = selectedPreviewPage && !selectedPreviewPage.is_default
    ? selectedPreviewPage.destination_url
    : affiliate.base_destination_url
  const resolvedDestination = withSampleReferral(previewDestination, affiliate.referral_parameter)
  const commissionRate = Number(commission.default_commission_rate)
  const saleAmount = Number(exampleSale)
  const exampleCommission = Number.isFinite(commissionRate) && Number.isFinite(saleAmount)
    ? commission.default_commission_type === "percentage" ? saleAmount * commissionRate / 100 : commissionRate
    : 0

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading product configuration...</p>
      </div>
    )
  }

  if (!product || loadError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">{loadError ?? "Product not found."}</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={goBack}>
          <ArrowLeft className="mr-1.5 size-4" /> Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-3" onClick={goBack}>
          <ArrowLeft className="mr-1.5 size-4" /> Products
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{product.name}</h1>
              <StatusBadge status={product.status === "active" ? "Active" : "Inactive"} config={productStatusConfig} />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{product.slug}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage product configuration, affiliate tracking links, landing pages, and commissions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            <SummaryTile label="Default Commission" value={commissionSummary(product)} />
            <SummaryTile label="Active Landing Pages" value={String(activePages.length)} />
            <SummaryTile label="Attribution Window" value={`${affiliate.attribution_window_days || globalAttributionDays} days`} />
            <SummaryTile label="Tracking Service" value="Unconfigured" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="links">Affiliate Links</TabsTrigger>
          <TabsTrigger value="landing-pages">Landing Pages</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <div className="max-w-3xl">
            <Card className="border border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Product details</CardTitle>
                <CardDescription>Identity and availability for affiliate promotion.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveGeneral} className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input id="product-name" value={general.name} maxLength={255} required onChange={event => setGeneral({ ...general, name: event.target.value })} aria-invalid={!!fieldError(generalErrors, "name")} />
                    {fieldError(generalErrors, "name") && <FieldError message={fieldError(generalErrors, "name")!} />}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-slug">Product Slug</Label>
                    <Input id="product-slug" value={product.slug} readOnly className="font-mono bg-muted/50" />
                    <p className="text-xs text-muted-foreground">Product slugs are fixed after creation so existing references remain stable.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-website">Product Website</Label>
                    <Input id="product-website" type="url" inputMode="url" placeholder="https://example.com" value={general.website_url} onChange={event => setGeneral({ ...general, website_url: event.target.value })} aria-invalid={!!fieldError(generalErrors, "website_url")} />
                    <p className="text-xs text-muted-foreground">Use HTTPS. Landing page destinations must use this same host.</p>
                    {fieldError(generalErrors, "website_url") && <FieldError message={fieldError(generalErrors, "website_url")!} />}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-description">Description</Label>
                    <Textarea id="product-description" value={general.description} onChange={event => setGeneral({ ...general, description: event.target.value })} />
                    {fieldError(generalErrors, "description") && <FieldError message={fieldError(generalErrors, "description")!} />}
                  </div>
                  <div className="grid gap-2 sm:max-w-sm">
                    <Label htmlFor="product-status">Available for Promotion</Label>
                    <Select value={general.status} onValueChange={(value: "active" | "inactive") => setGeneral({ ...general, status: value })}>
                      <SelectTrigger id="product-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {general.status === "inactive" && (
                      <p className="flex gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-4 shrink-0" /> Gleent short links stop redirecting while this product is inactive. Previously shared direct URLs may continue working.
                      </p>
                    )}
                    {fieldError(generalErrors, "status") && <FieldError message={fieldError(generalErrors, "status")!} />}
                  </div>
                  <div className="flex justify-end border-t border-border pt-4">
                    <Button type="submit" disabled={!generalDirty || savingGeneral}>
                      {savingGeneral ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                      {savingGeneral ? "Saving..." : "Save General"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
            <Card className="border border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Affiliate link settings</CardTitle>
                <CardDescription>Configure destination and attribution parameters for this product.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveAffiliate} className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="base-destination">Base Destination URL</Label>
                    <Input id="base-destination" type="url" inputMode="url" placeholder={general.website_url || "Set Product Website in General first"} value={affiliate.base_destination_url} onChange={event => setAffiliate({ ...affiliate, base_destination_url: event.target.value })} aria-invalid={!!fieldError(affiliateErrors, "base_destination_url")} />
                    <p className="text-xs text-muted-foreground">This is the destination on the active default landing page.</p>
                    {fieldError(affiliateErrors, "base_destination_url") && <FieldError message={fieldError(affiliateErrors, "base_destination_url")!} />}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tracking-mode">Legacy Link Mode</Label>
                    <Select value={affiliate.tracking_mode} onValueChange={(value: "redirect" | "direct") => setAffiliate({ ...affiliate, tracking_mode: value })}>
                      <SelectTrigger id="tracking-mode"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="redirect">Gleent Redirect</SelectItem>
                        <SelectItem value="direct">Direct Destination</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Partners receive stable Gleent short links while short links are enabled. This setting controls the legacy link style used during rollback. The destination site should retain the partner code and validate the short-lived gclick handoff.</p>
                    {fieldError(affiliateErrors, "tracking_mode") && <FieldError message={fieldError(affiliateErrors, "tracking_mode")!} />}
                  </div>
                  <div className="grid gap-2 sm:max-w-sm">
                    <Label htmlFor="referral-parameter">Referral Parameter</Label>
                    <Input id="referral-parameter" value={affiliate.referral_parameter} maxLength={100} required onChange={event => setAffiliate({ ...affiliate, referral_parameter: event.target.value })} aria-invalid={!!fieldError(affiliateErrors, "referral_parameter")} />
                    <p className="text-xs text-muted-foreground">The example preview replaces this query parameter with the sample code.</p>
                    {fieldError(affiliateErrors, "referral_parameter") && <FieldError message={fieldError(affiliateErrors, "referral_parameter")!} />}
                  </div>
                  <div className="grid gap-2 sm:max-w-sm">
                    <Label htmlFor="attribution-window">Attribution Window</Label>
                    <div className="flex items-center gap-2">
                      <Input id="attribution-window" type="number" min="1" max="3650" placeholder={String(globalAttributionDays)} value={affiliate.attribution_window_days} onChange={event => setAffiliate({ ...affiliate, attribution_window_days: event.target.value })} aria-invalid={!!fieldError(affiliateErrors, "attribution_window_days")} />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Blank inherits the program default of {globalAttributionDays} days.</p>
                    {fieldError(affiliateErrors, "attribution_window_days") && <FieldError message={fieldError(affiliateErrors, "attribution_window_days")!} />}
                  </div>
                  <div className="flex justify-end border-t border-border pt-4">
                    <Button type="submit" disabled={!affiliateDirty || savingAffiliate}>
                      {savingAffiliate ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                      {savingAffiliate ? "Saving..." : "Save Affiliate Links"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="h-fit border border-border shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Link2 className="size-4" /> Live Preview</CardTitle>
                <CardDescription>Examples only. The code ABC123 is not an issued affiliate code.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {activePages.length > 0 && (
                  <div className="grid gap-2">
                    <Label htmlFor="preview-landing-page">Preview Landing Page</Label>
                    <Select value={previewPageId || "base"} onValueChange={value => setPreviewPageId(value === "base" ? "" : value)}>
                      <SelectTrigger id="preview-landing-page"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base">Default destination</SelectItem>
                        {activePages.map(page => <SelectItem key={page.id} value={String(page.id)}>{page.name}{page.is_default ? " (default)" : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <PreviewValue label="Resolved Destination" value={resolvedDestination || "No active landing page destination is configured."} />
                <div className="space-y-2">
                  <Label>Example Destination URL</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={resolvedDestination} className="font-mono text-xs" aria-label="Example destination URL with partner code" />
                    <Button type="button" variant="outline" size="icon" aria-label="Copy example destination URL" disabled={!resolvedDestination} onClick={() => void copyPreview(resolvedDestination)}>
                      <Copy className="size-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">This destination preview adds {affiliate.referral_parameter || "ref"}={sampleCode}. Partner links are short URLs that also record clicks; this example is not an issued share link.</p>
                </div>
                {selectedPreviewPage && !selectedPreviewPage.is_default && (
                  <p className="text-xs text-muted-foreground">Previewing {selectedPreviewPage.name}. Its URL is not the product's default destination.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="landing-pages" className="mt-6">
          <Card className="border border-border shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Approved landing pages</CardTitle>
                <CardDescription>Active pages must use the product website domain or one of its subdomains. One active page is the default destination.</CardDescription>
              </div>
              <Button type="button" onClick={openCreateLandingPage} disabled={!general.website_url}>
                <Plus className="mr-2 size-4" /> Add Landing Page
              </Button>
            </CardHeader>
            <CardContent>
              {!general.website_url && <p className="mb-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">Set the Product Website in General before adding landing pages.</p>}
              {landingPages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center">
                  <p className="font-medium text-foreground">No landing pages configured</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add an approved destination to use in affiliate link previews.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Landing Page</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Destination URL</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {landingPages.map(page => (
                        <tr key={page.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                              {page.name}
                              {page.is_default && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Default</span>}
                            </div>
                          </td>
                          <td className="max-w-[420px] truncate px-4 py-3 text-xs text-muted-foreground">{page.destination_url}</td>
                          <td className="px-4 py-3"><StatusBadge status={page.is_active ? "Active" : "Inactive"} config={productStatusConfig} /></td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {page.is_active && !page.is_default && <Button type="button" variant="outline" size="sm" onClick={() => void setLandingPageDefault(page)}>Make Default</Button>}
                              <Button type="button" variant="ghost" size="sm" onClick={() => openEditLandingPage(page)}>Edit</Button>
                              <Button type="button" variant="ghost" size="sm" className={page.is_active ? "text-destructive" : ""} onClick={() => void toggleLandingPage(page)}>
                                {page.is_active ? "Archive" : "Activate"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {activePages.length > 0 && !activePages.some(page => page.is_default) && (
                <p className="mt-4 text-xs text-amber-600 dark:text-amber-400">Choose an active default page before using this product as a destination.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
            <Card className="border border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Default earning rule</CardTitle>
                <CardDescription>Used as the default rate for new partner applications for this product.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveCommission} className="space-y-5">
                  <div className="grid gap-2 sm:max-w-sm">
                    <Label htmlFor="commission-type">Commission Type</Label>
                    <Select value={commission.default_commission_type} onValueChange={(value: "percentage" | "fixed") => setCommission({ ...commission, default_commission_type: value })}>
                      <SelectTrigger id="commission-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:max-w-sm">
                    <Label htmlFor="commission-rate">{commission.default_commission_type === "percentage" ? "Default Rate" : "Default Amount (PHP)"}</Label>
                    <div className="flex items-center gap-2">
                      <Input id="commission-rate" type="number" step="0.01" min="0" max={commission.default_commission_type === "percentage" ? "100" : undefined} required value={commission.default_commission_rate} onChange={event => setCommission({ ...commission, default_commission_rate: event.target.value })} aria-invalid={!!fieldError(commissionErrors, "default_commission_rate")} />
                      <span className="text-sm text-muted-foreground">{commission.default_commission_type === "percentage" ? "%" : "PHP"}</span>
                    </div>
                    {fieldError(commissionErrors, "default_commission_rate") && <FieldError message={fieldError(commissionErrors, "default_commission_rate")!} />}
                  </div>
                  <p className="text-xs text-muted-foreground">Existing partners keep their saved rates. Existing commissions retain the rate snapshot recorded when the deal was won.</p>
                  <div className="flex justify-end border-t border-border pt-4">
                    <Button type="submit" disabled={!commissionDirty || savingCommission}>
                      {savingCommission ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                      {savingCommission ? "Saving..." : "Save Commission"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="h-fit border border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Example calculator</CardTitle>
                <CardDescription>Illustrative estimate for a qualifying sale.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="example-sale">Sale Amount (PHP)</Label>
                  <Input id="example-sale" type="number" min="0" step="0.01" value={exampleSale} onChange={event => setExampleSale(event.target.value)} />
                </div>
                <div className="rounded-lg bg-muted/60 p-4">
                  <p className="text-xs text-muted-foreground">Estimated commission</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrencyPrecise(exampleCommission)}</p>
                </div>
                <p className="text-xs text-muted-foreground">This example uses the current unsaved form values and is not a payout promise.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={landingDialogOpen} onOpenChange={open => {
        if (open) setLandingDialogOpen(true)
        else requestCloseLandingDialog()
      }}>
        <DialogContent>
          <form onSubmit={saveLandingPage} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingLandingPage ? "Edit Landing Page" : "Add Landing Page"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="landing-name">Name</Label>
              <Input id="landing-name" maxLength={255} required value={landingForm.name} onChange={event => setLandingForm({ ...landingForm, name: event.target.value })} aria-invalid={!!fieldError(landingErrors, "name")} />
              {fieldError(landingErrors, "name") && <FieldError message={fieldError(landingErrors, "name")!} />}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="landing-url">Destination URL</Label>
              <Input id="landing-url" type="url" inputMode="url" placeholder={general.website_url || "https://example.com/campaign"} required value={landingForm.destination_url} onChange={event => setLandingForm({ ...landingForm, destination_url: event.target.value })} aria-invalid={!!fieldError(landingErrors, "destination_url")} />
              <p className="text-xs text-muted-foreground">Must use HTTPS and the product website domain or one of its subdomains.</p>
              {fieldError(landingErrors, "destination_url") && <FieldError message={fieldError(landingErrors, "destination_url")!} />}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={requestCloseLandingDialog}><X className="mr-2 size-4" /> Cancel</Button>
              <Button type="submit" disabled={savingLandingPage}>
                {savingLandingPage ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
                {savingLandingPage ? "Saving..." : "Save Landing Page"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function commissionSummary(product: Product) {
  return product.default_commission_type === "percentage"
    ? `${Number(product.default_commission_rate)}%`
    : formatCurrencyPrecise(Number(product.default_commission_rate))
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function PreviewValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="min-h-11 break-all rounded-md border border-input bg-muted/40 px-3 py-2 font-mono text-xs text-foreground">
        {value}
      </div>
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return <p role="alert" className="text-xs text-destructive">{message}</p>
}
