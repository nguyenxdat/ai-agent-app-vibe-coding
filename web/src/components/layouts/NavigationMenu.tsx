/**
 * NavigationMenu Component
 * Left sidebar navigation with collapsible icons
 */

import { useState } from 'react'
import { MessageSquare, Settings, Library, Calendar, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '../../lib/utils'

interface NavigationMenuProps {
  currentPage?: 'chat' | 'settings' | 'library' | 'calendar'
  onNavigate?: (page: string) => void
  className?: string
}

export function NavigationMenu({ currentPage = 'chat', onNavigate, className }: NavigationMenuProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
  ]

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-muted/30 border-r border-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">UI</span>
            </div>
            <span className="font-semibold">Chatbot UI</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors',
            isCollapsed && 'justify-center'
          )}
          title="Help"
        >
          <span className="text-xl">?</span>
          {!isCollapsed && <span className="text-sm">Help & Support</span>}
        </button>
      </div>
    </div>
  )
}
