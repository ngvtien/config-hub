import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useEnvironment, Environment, Instance } from '@/contexts/environment-context'
import { 
  ChevronDown, 
  Globe, 
  TestTube, 
  Users, 
  Shield,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function EnvironmentSelector() {
  const { 
    environment, 
    instance, 
    setEnvironment, 
    setInstance, 
    getContextKey, 
    isUatEnvironment 
  } = useEnvironment()
  const [isOpen, setIsOpen] = useState(false)

  const environments: { key: Environment; label: string; icon: any; color: string }[] = [
    { key: 'local', label: 'Local', icon: Globe, color: 'bg-gray-500' },
    { key: 'dev', label: 'Development', icon: TestTube, color: 'bg-blue-500' },
    { key: 'sit', label: 'System Integration', icon: Settings, color: 'bg-yellow-500' },
    { key: 'uat', label: 'User Acceptance', icon: Users, color: 'bg-orange-500' },
    { key: 'prod', label: 'Production', icon: Shield, color: 'bg-red-500' }
  ]

  const instances: Instance[] = [0, 1, 2, 3]

  const currentEnv = environments.find(env => env.key === environment)
  const CurrentIcon = currentEnv?.icon || Globe

  const handleEnvironmentChange = (env: Environment) => {
    setEnvironment(env)
    setIsOpen(false)
  }

  const handleInstanceChange = (newInstance: Instance) => {
    setInstance(newInstance)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", currentEnv?.color)} />
          <CurrentIcon className="w-4 h-4" />
          <span className="font-medium">{getContextKey().toUpperCase()}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <Card className="w-80 shadow-lg">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Environment</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {environments.map((env) => {
                      const Icon = env.icon
                      const isActive = environment === env.key
                      
                      return (
                        <Button
                          key={env.key}
                          variant={isActive ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => handleEnvironmentChange(env.key)}
                          className="justify-start h-auto p-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", env.color)} />
                            <Icon className="w-4 h-4" />
                            <div className="text-left">
                              <div className="text-xs font-medium">{env.key.toUpperCase()}</div>
                              <div className="text-xs text-muted-foreground">{env.label}</div>
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {isUatEnvironment() && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">UAT Instance</h3>
                    <div className="flex gap-1">
                      {instances.map((inst) => (
                        <Button
                          key={inst}
                          variant={instance === inst ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => handleInstanceChange(inst)}
                          className="w-10 h-10 p-0"
                        >
                          {inst}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Different Helm chart versions of the same container image
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Current Context:</span>
                    <Badge variant="outline" className="font-mono">
                      {getContextKey()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}