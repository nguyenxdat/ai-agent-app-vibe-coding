/**
 * Main Application Component
 */

import { ThemeProvider } from './components/ui/theme-provider'
import { MainLayout, Header, Sidebar, SidebarHeader, SidebarContent } from './components/layouts/MainLayout'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ai-chat-theme">
      <MainLayout
        header={
          <Header
            title="AI Chat App"
            actions={
              <Button variant="outline">Settings</Button>
            }
          />
        }
        sidebar={
          <Sidebar>
            <SidebarHeader>
              <h2 className="text-lg font-semibold">Agents</h2>
            </SidebarHeader>
            <SidebarContent>
              <p className="text-sm text-muted-foreground px-2">
                Chưa có agent nào được cấu hình
              </p>
            </SidebarContent>
          </Sidebar>
        }
      >
        <div className="flex h-full items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Chào mừng đến với AI Chat App</CardTitle>
              <CardDescription>
                Ứng dụng chat với AI Agent sử dụng A2A Protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Tính năng:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Quản lý nhiều AI Agent</li>
                  <li>Chat real-time với WebSocket</li>
                  <li>Hỗ trợ A2A Protocol</li>
                  <li>Dark mode / Light mode</li>
                  <li>Cross-platform (Web + Desktop)</li>
                </ul>
              </div>
              <div className="pt-4">
                <Button className="w-full">Bắt đầu</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ThemeProvider>
  )
}

export default App
