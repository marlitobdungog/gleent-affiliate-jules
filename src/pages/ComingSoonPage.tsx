import { Construction } from "lucide-react"

interface ComingSoonPageProps {
  title: string
  description?: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Construction className="size-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {description ?? "This module is under development and will be available soon."}
      </p>
    </div>
  )
}
