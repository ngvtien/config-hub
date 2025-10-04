import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Monitor
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ZoomControls() {
    const [zoomLevel, setZoomLevel] = useState(0)
    const [isElectron, setIsElectron] = useState(false)

    useEffect(() => {
        // Check if we're running in Electron
        const checkElectron = () => {
            setIsElectron(!!window.electronAPI)
        }

        checkElectron()

        // Load initial zoom level
        if (window.electronAPI) {
            window.electronAPI.getZoomLevel().then(setZoomLevel)
        }
    }, [])

    // Listen for zoom changes from keyboard/mouse wheel
    useEffect(() => {
        if (!window.electronAPI) return

        const handleZoomChange = (event: CustomEvent) => {
            setZoomLevel(event.detail.zoomLevel)
        }

        // Listen for custom zoom change events
        window.addEventListener('zoom-changed', handleZoomChange as EventListener)

        return () => {
            window.removeEventListener('zoom-changed', handleZoomChange as EventListener)
        }
    }, [isElectron])

    const handleZoomIn = async () => {
        if (!window.electronAPI) return
        const newZoom = await window.electronAPI.zoomIn()
        setZoomLevel(newZoom)
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoomLevel: newZoom } }))
    }

    const handleZoomOut = async () => {
        if (!window.electronAPI) return
        const newZoom = await window.electronAPI.zoomOut()
        setZoomLevel(newZoom)
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoomLevel: newZoom } }))
    }

    const handleZoomReset = async () => {
        if (!window.electronAPI) return
        const newZoom = await window.electronAPI.zoomReset()
        setZoomLevel(newZoom)
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoomLevel: newZoom } }))
    }

    const handleZoomSet = async (level: number) => {
        if (!window.electronAPI) return
        const newZoom = await window.electronAPI.setZoomLevel(level)
        setZoomLevel(newZoom)
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoomLevel: newZoom } }))
    }

    const getZoomPercentage = (level: number) => {
        return Math.round(Math.pow(1.2, level) * 100)
    }

    // Don't render if not in Electron
    if (!isElectron) return null

    const zoomPercentage = getZoomPercentage(zoomLevel)
    const presetZooms = [-2, -1, 0, 1, 2, 3]

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= -5}
                title="Zoom Out (Ctrl+- or Ctrl+Wheel Down)"
            >
                <ZoomOut className="h-4 w-4" />
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="min-w-[60px]">
                        <Badge variant="secondary" className="text-xs">
                            {zoomPercentage}%
                        </Badge>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-32">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Zoom Level
                    </div>
                    <DropdownMenuSeparator />
                    {presetZooms.map((level) => (
                        <DropdownMenuItem
                            key={level}
                            onClick={() => handleZoomSet(level)}
                            className="flex justify-between"
                        >
                            <span>{getZoomPercentage(level)}%</span>
                            {level === zoomLevel && (
                                <Monitor className="h-3 w-3 text-primary" />
                            )}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleZoomReset}>
                        <RotateCcw className="h-3 w-3 mr-2" />
                        Reset
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 5}
                title="Zoom In (Ctrl++ or Ctrl+Wheel Up)"
            >
                <ZoomIn className="h-4 w-4" />
            </Button>
        </div>
    )
}