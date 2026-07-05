import { useState } from "react"
import { Copy, Check, Link2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mockPartnerProfile } from "@/data/mockPartnerPortalData"
import { toast } from "sonner"

export function PartnerMyLink() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mockPartnerProfile.partnerLink)
      setCopied(true)
      toast.success("Affiliate link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Link</h1>
        <p className="text-muted-foreground mt-1">
          Share your unique affiliate link to earn commissions on every referral.
        </p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-5" />
            Your Affiliate Link
          </CardTitle>
          <CardDescription>
            Use this link in emails, social posts, or your website. All sign-ups through this link
            are attributed to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="partner-code">Partner Code</Label>
            <Input
              id="partner-code"
              readOnly
              value={mockPartnerProfile.partnerCode}
              className="font-mono bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner-link">Affiliate Link</Label>
            <div className="flex gap-2">
              <Input
                id="partner-link"
                readOnly
                value={mockPartnerProfile.partnerLink}
                className="font-mono bg-muted/50"
              />
              <Button onClick={handleCopy} variant="outline" className="shrink-0">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span className="ml-2 hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>

          <Button variant="outline" asChild>
            <a href={mockPartnerProfile.partnerLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4 mr-2" />
              Preview Link
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Share your unique affiliate link with potential customers</li>
            <li>When they sign up or request a demo, the lead is tracked to your account</li>
            <li>Earn commission when referred deals close successfully</li>
            <li>Request payouts once your balance reaches the minimum threshold</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

export default PartnerMyLink
