import React from 'react'
import { Badge } from '@/components/ui/badge'

export function ResponsiveIndicator() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
        <span className="block sm:hidden">XS</span>
        <span className="hidden sm:block md:hidden">SM</span>
        <span className="hidden md:block lg:hidden">MD</span>
        <span className="hidden lg:block xl:hidden">LG</span>
        <span className="hidden xl:block 2xl:hidden">XL</span>
        <span className="hidden 2xl:block">2XL</span>
      </Badge>
    </div>
  )
}