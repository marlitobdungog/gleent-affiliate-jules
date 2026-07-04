import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { applicationsApi } from "@/services/api"
import { applicationStatusConfig } from "@/lib/statusConfig"

interface ApplicationsProps {
  onReviewApplication: (applicationId: string) => void
}

export function Applications({ onReviewApplication }: ApplicationsProps) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const data = await applicationsApi.getAll()
      setApplications(data)
    } catch (err) {
      console.error("Failed to fetch applications", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (app.company_name && app.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = applications.filter(
    (a) =>
      a.status === "submitted" ||
      a.status === "under_review" ||
      a.status === "needs_more_info"
  ).length

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve new affiliate applications.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="needs_more_info">Needs More Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-border shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading applications...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No applications found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Applicant
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">
                      Company
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">
                      Target Product
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Applied Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-foreground">{app.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {app.email}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {app.company_name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                        {app.target_product?.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} config={applicationStatusConfig} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onReviewApplication(app.id)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {pendingCount} application{pendingCount !== 1 ? "s" : ""} need review
      </p>
    </div>
  )
}
