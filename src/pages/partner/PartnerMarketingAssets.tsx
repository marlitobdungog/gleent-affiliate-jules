import { Download, FileImage, FileText, Mail, Share2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockMarketingAssets } from "@/data/mockPartnerPortalData"
import { toast } from "sonner"

const typeIcons: Record<string, typeof FileImage> = {
  Banner: FileImage,
  Copy: FileText,
  Brochure: FileText,
  Social: Share2,
  Email: Mail,
}

export function PartnerMarketingAssets() {
  const handleDownload = (title: string) => {
    toast.success(`Downloading "${title}" (demo)`)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketing Assets</h1>
        <p className="text-muted-foreground mt-1">
          Download banners, copy templates, and promotional materials to share with your audience.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockMarketingAssets.map((asset) => {
          const Icon = typeIcons[asset.type] ?? FileText
          return (
            <Card key={asset.id} className="shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-snug">{asset.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {asset.type} · {asset.format} · {asset.size}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDownload(asset.title)}
                >
                  <Download className="size-4 mr-2" />
                  Download
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default PartnerMarketingAssets
