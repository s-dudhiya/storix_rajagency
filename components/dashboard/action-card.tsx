import Link from "next/link"
import { LucideIcon } from "lucide-react"

interface ActionCardProps {
    icon: LucideIcon
    label: string
    description?: string
    href: string
    variant?: "default" | "outline" | "ghost" | "secondary"
    onClick?: () => void
}

export function ActionCard({ icon: Icon, label, description, href, variant = "default" }: ActionCardProps) {
    return (
        <Link href={href} className="group block h-full">
            <div className={`
        relative h-full flex flex-col justify-between p-5 rounded-xl border transition-all duration-300
        ${variant === 'default'
                    ? 'bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 hover:shadow-md'
                    : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                }
      `}>
                <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors
          ${variant === 'default'
                        ? 'bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }
        `}>
                    <Icon size={20} />
                </div>

                <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{label}</h3>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {description}
                        </p>
                    )}
                </div>

                <div className="absolute top-4 right-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <svg
                        className="w-4 h-4 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    )
}
