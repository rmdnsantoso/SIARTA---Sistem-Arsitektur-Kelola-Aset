export type ColorTheme = 'default' | 'blue' | 'green' | 'red' | 'amber' | 'purple'

interface StatCardProps {
  label: string
  value: number | string
  iconPath: string
  colorTheme?: ColorTheme
  sub?: string
}

export default function StatCard({ label, value, iconPath, colorTheme = 'default', sub }: StatCardProps) {
  const themes = {
    default: { text: 'text-gray-900', iconBg: 'bg-gray-50', iconColor: 'text-gray-600', border: 'border-gray-200' },
    blue: { text: 'text-blue-700', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', border: 'border-blue-200' },
    green: { text: 'text-green-700', iconBg: 'bg-green-50', iconColor: 'text-green-600', border: 'border-green-200' },
    red: { text: 'text-red-700', iconBg: 'bg-red-50', iconColor: 'text-red-600', border: 'border-red-200' },
    amber: { text: 'text-amber-700', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-200' },
    purple: { text: 'text-purple-700', iconBg: 'bg-purple-50', iconColor: 'text-purple-600', border: 'border-purple-200' },
  }
  
  const theme = themes[colorTheme] || themes.default

  return (
    <div className={`bg-white border ${theme.border} rounded-xl p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{label}</h3>
        <div className={`p-2.5 rounded-lg ${theme.iconBg}`}>
          <svg className={`w-5 h-5 ${theme.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={iconPath} />
          </svg>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className={`text-4xl font-extrabold tracking-tight ${theme.text}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
