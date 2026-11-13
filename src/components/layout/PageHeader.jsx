export default function PageHeader({ title, subtitle, className = '', icon: Icon, actions }) {
  return (
    <header className={`flex flex-col gap-3 bg-background sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {Icon && <Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400" />}
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {actions}
    </header>
  )
}
