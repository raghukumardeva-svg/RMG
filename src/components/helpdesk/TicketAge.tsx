import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface TicketAgeProps {
  createdAt: string | Date
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'badge' | 'text'
}

export function TicketAge({ 
  createdAt, 
  className, 
  showIcon = false,
  variant = 'default' 
}: TicketAgeProps) {
  const calculateAge = (date: string | Date) => {
    const created = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return { value: diffMins, unit: diffMins === 1 ? 'min' : 'mins', totalHours: diffHours }
    } else if (diffHours < 24) {
      return { value: diffHours, unit: diffHours === 1 ? 'hour' : 'hours', totalHours: diffHours }
    } else {
      return { value: diffDays, unit: diffDays === 1 ? 'day' : 'days', totalHours: diffDays * 24 }
    }
  }

  const getAgeColor = (totalHours: number) => {
    if (totalHours < 24) {
      return {
        badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200',
        text: 'text-green-600 dark:text-green-400',
        label: 'New'
      }
    } else if (totalHours < 72) { // 3 days
      return {
        badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200',
        text: 'text-yellow-600 dark:text-yellow-500',
        label: 'Recent'
      }
    } else {
      return {
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-200',
        text: 'text-red-600 dark:text-red-400',
        label: 'Old'
      }
    }
  }

  const age = calculateAge(createdAt)
  const colorScheme = getAgeColor(age.totalHours)

  if (variant === 'badge') {
    return (
      <Badge 
        variant="outline" 
        className={cn(colorScheme.badge, "font-medium", className)}
      >
        {showIcon && <Clock className="h-3 w-3 mr-1" />}
        {age.value} {age.unit}
      </Badge>
    )
  }

  if (variant === 'text') {
    return (
      <span className={cn("text-sm font-medium flex items-center gap-1", colorScheme.text, className)}>
        {showIcon && <Clock className="h-3 w-3" />}
        {age.value} {age.unit}
      </span>
    )
  }

  // Default variant - compact view
  return (
    <div className={cn("flex flex-col", className)}>
      <span className={cn("text-xs font-medium", colorScheme.text)}>
        {age.value} {age.unit}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {colorScheme.label}
      </span>
    </div>
  )
}
