interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: string
  trendUp?: boolean
}

export function StatCard({ label, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="group bg-card rounded-xl border border-border/50 p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary to-transparent blur-2xl" />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 group-hover:text-primary/80 transition-colors">
            {label}
          </p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
            {trend && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md mb-1.5 ${trendUp ? 'bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {trend}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="text-primary/80 bg-primary/10 p-2.5 rounded-xl group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
