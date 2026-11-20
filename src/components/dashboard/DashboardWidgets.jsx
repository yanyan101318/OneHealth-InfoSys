import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

const colorStyles = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export function StatCard({ title, value, icon: Icon, color = 'blue', detail, valueColor, className = '' }) {
  return (
    <Card className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${valueColor || 'text-foreground'}`}>{Number(value).toLocaleString()}</p>
          {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${colorStyles[color] || colorStyles.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ChartContainer({ title, description, actions, children, loading, empty, className = '' }) {
  return (
    <Card className={`min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-64 w-full" /> : empty ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            No records found for this selection.
          </div>
        ) : <div className="h-64 min-w-0 text-muted-foreground">{children}</div>}
      </CardContent>
    </Card>
  )
}

export function ActivityFeed({ activities, loading, className = '' }) {
  return (
    <Card className={`h-full rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <p className="text-xs text-muted-foreground">System activity for the selected week</p>
      </CardHeader>
      <CardContent>
        {loading ? <div className="space-y-4">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div> : activities.length ? (
          <ol className="space-y-0">
            {activities.slice(0, 8).map((activity, index) => (
              <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
                {index !== Math.min(activities.length, 8) - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-border" />}
                <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{activity.user} · {activity.timestamp.toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : <p className="py-12 text-center text-sm text-muted-foreground">No recent activity found for this week.</p>}
      </CardContent>
    </Card>
  )
}
