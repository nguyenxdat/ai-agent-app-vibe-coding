/**
 * SettingsSidebar Component
 * Middle panel for settings navigation
 */

import { cn } from '@/lib/utils'

interface SettingsSidebarProps {
  className?: string
}

export function SettingsSidebar({ className }: SettingsSidebarProps) {
  const menuItems = [
    { id: 'agents', label: 'Agents', active: true },
    { id: 'general', label: 'General', active: false },
    { id: 'appearance', label: 'Appearance', active: false },
  ]

  return (
    <div className={cn('flex flex-col h-full bg-background border-r border-border w-80', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your preferences
        </p>
      </div>

      {/* Navigation */}
      <nav className="p-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={cn(
              'w-full text-left px-4 py-2.5 rounded-lg transition-colors mb-1',
              item.active
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50 text-muted-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
