import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

export interface CycleFiltersState {
  search: string
  status: string
  type: string
  department: string
}

interface CycleFiltersProps {
  filters: CycleFiltersState
  onChange: (filters: CycleFiltersState) => void
}

export function CycleFilters({ filters, onChange }: CycleFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.status !== "all" || filters.type !== "all" || filters.department !== "all"

  const reset = () =>
    onChange({ search: "", status: "all", type: "all", department: "all" })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search cycles..."
          className="pl-8 h-9"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ ...filters, status: v })}
      >
        <SelectTrigger className="h-9 w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Draft">Draft</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Closing Soon">Closing Soon</SelectItem>
          <SelectItem value="Finalized">Finalized</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.type}
        onValueChange={(v) => onChange({ ...filters, type: v })}
      >
        <SelectTrigger className="h-9 w-40">
          <SelectValue placeholder="Cycle Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Annual">Annual</SelectItem>
          <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
          <SelectItem value="Quarterly">Quarterly</SelectItem>
          <SelectItem value="Probationary">Probationary</SelectItem>
          <SelectItem value="Regularization">Regularization</SelectItem>
          <SelectItem value="Project-Based">Project-Based</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.department}
        onValueChange={(v) => onChange({ ...filters, department: v })}
      >
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          <SelectItem value="Sales">Sales</SelectItem>
          <SelectItem value="Operations">Operations</SelectItem>
          <SelectItem value="Finance">Finance</SelectItem>
          <SelectItem value="HR Operations">HR Operations</SelectItem>
          <SelectItem value="IT">IT</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-9 text-xs gap-1" onClick={reset}>
          <X className="size-3" /> Clear
        </Button>
      )}
    </div>
  )
}
