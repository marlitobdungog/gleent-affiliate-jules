import { useEffect, useMemo, useState } from "react"
import { Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { marketingAssetsApi, productsApi } from "@/services/api"

type Product = { id: number; name: string; status: string }
type MarketingAsset = {
  id: number
  title: string
  type: string
  format: string
  file_size_bytes: number
  is_active: boolean
  sort_order: number
  products: Product[]
  updated_at: string | null
}

type AssetForm = {
  title: string
  type: string
  is_active: boolean
  sort_order: string
  product_ids: number[]
  file: File | null
}

const emptyForm = (): AssetForm => ({
  title: "",
  type: "Banner",
  is_active: true,
  sort_order: "0",
  product_ids: [],
  file: null,
})

function formatFileSize(bytes: number) {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Unknown"
}

function errorMessage(error: any) {
  const errors = error?.errors as Record<string, string[]> | undefined
  return errors ? Object.values(errors).flat()[0] : error?.message || "Unable to save marketing asset."
}

export function MarketingMaterials() {
  const [assets, setAssets] = useState<MarketingAsset[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [form, setForm] = useState<AssetForm>(emptyForm)
  const [selectedAsset, setSelectedAsset] = useState<MarketingAsset | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [assetData, productData] = await Promise.all([
        marketingAssetsApi.getAll(),
        productsApi.getAll(),
      ])
      setAssets(assetData)
      setProducts(productData)
    } catch (error: any) {
      toast.error(error.message || "Failed to load marketing assets.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchData() }, [])

  const filteredAssets = useMemo(() => {
    const query = searchTerm.toLowerCase()
    return assets.filter((asset) =>
      asset.title.toLowerCase().includes(query) ||
      asset.type.toLowerCase().includes(query) ||
      asset.products.some((product) => product.name.toLowerCase().includes(query))
    )
  }, [assets, searchTerm])

  const openAdd = () => {
    setSelectedAsset(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  const openEdit = (asset: MarketingAsset) => {
    setSelectedAsset(asset)
    setForm({
      title: asset.title,
      type: asset.type,
      is_active: asset.is_active,
      sort_order: String(asset.sort_order),
      product_ids: asset.products.map((product) => product.id),
      file: null,
    })
    setFormOpen(true)
  }

  const toggleProduct = (id: number, checked: boolean) => {
    setForm((current) => ({
      ...current,
      product_ids: checked
        ? [...current.product_ids, id]
        : current.product_ids.filter((productId) => productId !== id),
    }))
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedAsset && !form.file) {
      toast.error("Choose a file to upload.")
      return
    }

    const payload = new FormData()
    payload.append("title", form.title)
    payload.append("type", form.type)
    payload.append("is_active", form.is_active ? "1" : "0")
    payload.append("sort_order", form.sort_order || "0")
    form.product_ids.forEach((id) => payload.append("product_ids[]", String(id)))
    if (form.file) payload.append("file", form.file)

    setSaving(true)
    try {
      if (selectedAsset) {
        await marketingAssetsApi.update(selectedAsset.id, payload)
        toast.success("Marketing asset updated.")
      } else {
        await marketingAssetsApi.create(payload)
        toast.success("Marketing asset added.")
      }
      setFormOpen(false)
      await fetchData()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAsset) return
    setSaving(true)
    try {
      await marketingAssetsApi.delete(selectedAsset.id)
      toast.success("Marketing asset deleted.")
      setDeleteOpen(false)
      setSelectedAsset(null)
      await fetchData()
    } catch (error: any) {
      toast.error(error.message || "Unable to delete marketing asset.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Marketing Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage promotional files partners can download and share.</p>
        </div>
        <Button onClick={openAdd}><Plus className="size-4 mr-2" />Add Material</Button>
      </div>

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search materials..." className="pl-9" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
      </div>

      <Card className="border border-border shadow-none"><CardContent className="p-0"><div className="overflow-x-auto">
        {loading ? <div className="p-8 text-center text-muted-foreground">Loading marketing assets...</div>
          : filteredAssets.length === 0 ? <div className="p-8 text-center text-muted-foreground">No marketing assets found.</div>
          : <table className="w-full text-sm"><thead><tr className="border-b border-border">
            <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">Material</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Products</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">File</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Updated</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
          </tr></thead><tbody>{filteredAssets.map((asset) => <tr key={asset.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
            <td className="px-6 py-3"><div className="font-medium text-foreground">{asset.title}</div><div className="text-xs text-muted-foreground">{asset.type}</div></td>
            <td className="px-4 py-3 text-muted-foreground max-w-56">{asset.products.length ? asset.products.map((product) => product.name).join(", ") : "All products"}</td>
            <td className="px-4 py-3 text-muted-foreground">{asset.format} · {formatFileSize(asset.file_size_bytes)}</td>
            <td className="px-4 py-3"><span className={asset.is_active ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>{asset.is_active ? "Published" : "Draft"}</span></td>
            <td className="px-4 py-3 text-muted-foreground">{formatDate(asset.updated_at)}</td>
            <td className="px-4 py-3 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEdit(asset)}><Pencil className="size-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => { setSelectedAsset(asset); setDeleteOpen(true) }}><Trash2 className="size-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td>
          </tr>)}</tbody></table>}
      </div></CardContent></Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><form onSubmit={handleSave}>
        <DialogHeader><DialogTitle>{selectedAsset ? "Edit Marketing Asset" : "Add Marketing Asset"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label htmlFor="asset-title">Title</Label><Input id="asset-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div>
          <div className="grid gap-2"><Label htmlFor="asset-type">Material type</Label><Select value={form.type} onValueChange={(type) => setForm({ ...form, type })}><SelectTrigger id="asset-type"><SelectValue /></SelectTrigger><SelectContent>{["Banner", "Copy", "Brochure", "Social", "Email"].map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label htmlFor="asset-file">File {selectedAsset ? "(replace optional)" : ""}</Label><Input id="asset-file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.zip" required={!selectedAsset} onChange={(event) => setForm({ ...form, file: event.target.files?.[0] ?? null })} /><p className="text-xs text-muted-foreground">PNG, JPG, WebP, PDF, DOC, DOCX, or ZIP, up to 10 MB.</p></div>
          <div className="grid gap-2"><Label>Connected products</Label><p className="text-xs text-muted-foreground">Leave unselected to make this general material available for all products.</p><div className="rounded-md border border-border divide-y">{products.map((product) => <label key={product.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm"><Checkbox checked={form.product_ids.includes(product.id)} onCheckedChange={(checked) => toggleProduct(product.id, checked === true)} /><span className="flex-1">{product.name}</span>{product.status !== "active" && <span className="text-xs text-muted-foreground">Inactive</span>}</label>)}</div></div>
          <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="sort-order">Sort order</Label><Input id="sort-order" type="number" min="0" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} /></div><div className="grid gap-2"><Label htmlFor="asset-active">Publication status</Label><div className="flex h-9 items-center gap-2"><Switch id="asset-active" checked={form.is_active} onCheckedChange={(is_active) => setForm({ ...form, is_active })} /><span className="text-sm text-muted-foreground">{form.is_active ? "Published" : "Draft"}</span></div></div></div>
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}{selectedAsset ? "Save Changes" : "Upload Material"}</Button></DialogFooter>
      </form></DialogContent></Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent><DialogHeader><DialogTitle>Delete Marketing Asset</DialogTitle></DialogHeader><p className="py-4 text-sm text-muted-foreground">Delete <span className="font-medium text-foreground">{selectedAsset?.title}</span>? Partners will no longer be able to download it.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Deleting..." : "Delete"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
