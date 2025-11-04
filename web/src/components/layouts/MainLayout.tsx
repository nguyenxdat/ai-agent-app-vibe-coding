/**
 * Main Layout Component
 * Base layout structure for the application
 */

import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface MainLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  header?: ReactNode
  className?: string
}

export function MainLayout({ children, sidebar, header, className }: MainLayoutProps) {
  return (
    <div className={cn('flex h-screen overflow-hidden bg-background', className)}>
      {/* Sidebar */}
      {sidebar && (
        <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border">
          {sidebar}
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        {header && (
          <header className="border-b border-border bg-background">
            {header}
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

interface HeaderProps {
  title?: string
  actions?: ReactNode
  className?: string
}

export function Header({ title, actions, className }: HeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-6 py-4', className)}>
      {title && (
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

interface SidebarProps {
  children: ReactNode
  className?: string
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {children}
    </div>
  )
}

interface SidebarHeaderProps {
  children: ReactNode
  className?: string
}

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return (
    <div className={cn('border-b border-border px-4 py-4', className)}>
      {children}
    </div>
  )
}

interface SidebarContentProps {
  children: ReactNode
  className?: string
}

export function SidebarContent({ children, className }: SidebarContentProps) {
  return (
    <div className={cn('flex-1 overflow-auto px-2 py-4', className)}>
      {children}
    </div>
  )
}

interface SidebarFooterProps {
  children: ReactNode
  className?: string
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div className={cn('border-t border-border px-4 py-4', className)}>
      {children}
    </div>
  )
}
