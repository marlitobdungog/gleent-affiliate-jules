import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CYCLE_TYPES, EMPLOYEE_GROUPS, EVALUATION_TEMPLATES, DEPARTMENTS } from "@/data/mockPerformanceData"

interface CreateCycleModalProps {
  open: boolean
  onClose: () => void
  onSaveDraft: () => void
  onCreateAndLaunch: () => void
}

export function CreateCycleModal({
  open,
  onClose,
  onSaveDraft,
  onCreateAndLaunch,
}: CreateCycleModalProps) {
  const [selfEval, setSelfEval] = React.useState(true)
  const [managerEval, setManagerEval] = React.useState(true)
  const [hrReview, setHrReview] = React.useState(false)
  const [requireAck, setRequireAck] = React.useState(false)
  const [hrApproval, setHrApproval] = React.useState(false)
  const [managerComments, setManagerComments] = React.useState(true)
  const [requireCommentsLow, setRequireCommentsLow] = React.useState(true)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Review Cycle</DialogTitle>
          <DialogDescription>
            Set up a new performance review cycle and configure its participants and workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Basic Information */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cycle-name">Cycle Name <span className="text-destructive">*</span></Label>
                <Input id="cycle-name" placeholder="e.g. 2026 Annual Performance Review" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cycle-type">Cycle Type <span className="text-destructive">*</span></Label>
                <Select>
                  <SelectTrigger id="cycle-type">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CYCLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose and scope of this review cycle..."
                  className="resize-none h-20"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Review Period */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Review Period</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="period-start">Period Start <span className="text-destructive">*</span></Label>
                <Input id="period-start" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="period-end">Period End <span className="text-destructive">*</span></Label>
                <Input id="period-end" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="launch-date">Launch Date</Label>
                <Input id="launch-date" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due-date">Review Due Date <span className="text-destructive">*</span></Label>
                <Input id="due-date" type="date" />
              </div>
            </div>
          </section>

          <Separator />

          {/* Participants */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Participants</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Departments</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select departments" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Employee Group</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              {[
                { id: "self-eval", label: "Include Self-Evaluation", value: selfEval, setter: setSelfEval },
                { id: "manager-eval", label: "Include Manager Evaluation", value: managerEval, setter: setManagerEval },
                { id: "hr-review", label: "Include HR Review", value: hrReview, setter: setHrReview },
              ].map(({ id, label, value, setter }) => (
                <div key={id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <Label htmlFor={id} className="text-sm font-normal cursor-pointer">{label}</Label>
                  <Switch id={id} checked={value} onCheckedChange={setter} />
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Template */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Evaluation Template</h3>
            <div className="space-y-1.5">
              <Label>Select Template <span className="text-destructive">*</span></Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an evaluation template" />
                </SelectTrigger>
                <SelectContent>
                  {EVALUATION_TEMPLATES.map((tpl) => (
                    <SelectItem key={tpl} value={tpl}>
                      {tpl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Workflow */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Workflow Settings</h3>
            <div className="space-y-2">
              {[
                { id: "require-ack", label: "Require employee acknowledgment", value: requireAck, setter: setRequireAck },
                { id: "hr-approval", label: "Require HR final approval", value: hrApproval, setter: setHrApproval },
                { id: "mgr-comments", label: "Allow manager comments", value: managerComments, setter: setManagerComments },
                { id: "comments-low", label: "Require comments for low scores", value: requireCommentsLow, setter: setRequireCommentsLow },
              ].map(({ id, label, value, setter }) => (
                <div key={id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <Label htmlFor={id} className="text-sm font-normal cursor-pointer">{label}</Label>
                  <Switch id={id} checked={value} onCheckedChange={setter} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" className="sm:mr-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onSaveDraft}>
            Save as Draft
          </Button>
          <Button onClick={onCreateAndLaunch}>
            Create and Launch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
