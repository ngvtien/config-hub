import { Button } from '@/components/ui/button'
import { useSidebarState } from '@/hooks/use-sidebar-state'
import { useUserManagement } from '@/hooks/use-user-management'
import { useAssetPath } from '@/hooks/use-asset-path'
import {
  Home,
  Settings,
  Users,
  FileText,
  BarChart3,
  Workflow,
  ChevronLeft,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  className?: string
  currentPage?: string
  onNavigate?: (page: string) => void
}

const menuItems = [
  { icon: Home, label: 'Dashboard', page: 'dashboard' },
  { icon: Workflow, label: 'ArgoCD', page: 'argocd' },
  { icon: Users, label: 'Users', page: 'users' },
  { icon: FileText, label: 'Documents', page: 'documents' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: Settings, label: 'Settings', page: 'settings' },
]

export function AppSidebar({ className, currentPage = 'dashboard', onNavigate }: AppSidebarProps) {
  const { isCollapsed, toggleCollapse } = useSidebarState()
  const { currentUser, isLoading } = useUserManagement()

  // Get asset paths for logos
  const lightLogo = useAssetPath('config-hub-logo-light.svg')
  const darkLogo = useAssetPath('config-hub-logo-dark.svg')
  const lightMonogram = useAssetPath('config-hub-monogram-light.svg')
  const darkMonogram = useAssetPath('config-hub-monogram-dark.svg')

  return (
    <div
      className={cn(
        "relative flex flex-col h-full bg-muted/30 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center p-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            {/* Config Hub Logo - Theme Aware */}
            <div className="w-8 h-8">
              {lightLogo && (
                <img
                  src={lightLogo}
                  alt="Config Hub Logo"
                  className="w-8 h-8 dark:hidden"
                />
              )}
              {darkLogo && (
                <img
                  src={darkLogo}
                  alt="Config Hub Logo"
                  className="w-8 h-8 hidden dark:block"
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-tight">Config Hub</h2>
              <p className="text-xs text-muted-foreground leading-tight">Config Management</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          /* Clickable Logo when collapsed - Theme Aware */
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="p-2 hover:bg-accent rounded-lg"
            title="Expand sidebar"
          >
            <div className="w-8 h-8">
              {lightMonogram && (
                <img
                  src={lightMonogram}
                  alt="Config Hub - Click to expand"
                  className="w-8 h-8 dark:hidden"
                />
              )}
              {darkMonogram && (
                <img
                  src={darkMonogram}
                  alt="Config Hub - Click to expand"
                  className="w-8 h-8 hidden dark:block"
                />
              )}
            </div>
          </Button>
        )}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="ml-auto"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.page

            return (
              <li key={item.label}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full",
                    isCollapsed ? "justify-center px-2" : "justify-start px-3"
                  )}
                  onClick={() => onNavigate?.(item.page)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer - User Menu */}
      <div className="p-2">
        <Button
          variant={currentPage === 'users' ? "secondary" : "ghost"}
          className={cn(
            "w-full h-auto p-2 hover:bg-accent transition-colors",
            isCollapsed ? "justify-center px-2" : "justify-start px-2",
            currentPage === 'users' && "bg-secondary"
          )}
          onClick={() => onNavigate?.('users')}
          disabled={isLoading}
          title={isCollapsed ? `${currentUser?.fullName || currentUser?.username || 'User'} - Click to manage users` : undefined}
        >
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "w-full"
          )}>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              {currentUser ? (
                <span className="text-primary-foreground text-sm font-medium">
                  {currentUser.username.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            {!isCollapsed && (
              <div className="ml-2 flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">
                  {currentUser?.fullName || currentUser?.username || 'Loading...'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser?.domain ? `${currentUser.domain}\\${currentUser.username}` : currentUser?.username || 'Click to view details'}
                </p>
              </div>
            )}
          </div>
        </Button>
      </div>
    </div>
  )
}