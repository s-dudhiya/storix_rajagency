interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: string
  trendUp?: boolean
}

export function StatCard({ label, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="group bg-card rounded-lg border border-border/50 p-4 shadow-sm transition-all hover:shadow-md hover:border-border relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary to-transparent blur-xl" />
      </div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 group-hover:text-primary transition-colors">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend}
            </p>
          )}
        </div>
        {icon && <div className="text-muted-foreground group-hover:text-primary transition-colors bg-muted/50 p-2 rounded-md">{icon}</div>}
      </div>
    </div>
  )
}
