import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  initialFocus?: boolean
  // Range selection props
  rangeStart?: Date
  rangeEnd?: Date
  isSelectingRange?: boolean
}

export function Calendar({ 
  selected, 
  onSelect, 
  disabled, 
  className,
  rangeStart,
  rangeEnd,
  isSelectingRange = false
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
  )

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleMonthChange = (monthIndex: string) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(monthIndex), 1))
  }

  const handleYearChange = (year: string) => {
    setCurrentMonth(new Date(parseInt(year), currentMonth.getMonth(), 1))
  }

  const years = []
  const currentYear = new Date().getFullYear()
  for (let year = currentYear - 5; year <= currentYear + 10; year++) {
    years.push(year)
  }

  const days = []
  const totalDays = daysInMonth(currentMonth)
  const startDay = firstDayOfMonth(currentMonth)

  // Add empty cells for days before the month starts
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="p-2"></div>)
  }

  // Add days of the month
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const isSelected = selected &&
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()

    const isDisabled = disabled ? disabled(date) : false
    const isWeekend = date.getDay() === 0 || date.getDay() === 6

    // Range selection logic
    const isRangeStart = rangeStart &&
      date.getDate() === rangeStart.getDate() &&
      date.getMonth() === rangeStart.getMonth() &&
      date.getFullYear() === rangeStart.getFullYear()

    const isRangeEnd = rangeEnd &&
      date.getDate() === rangeEnd.getDate() &&
      date.getMonth() === rangeEnd.getMonth() &&
      date.getFullYear() === rangeEnd.getFullYear()

    const isInRange = isSelectingRange && rangeStart && !rangeEnd &&
      date > rangeStart && date < new Date()

    const isInSelectedRange = rangeStart && rangeEnd &&
      date >= rangeStart && date <= rangeEnd

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => !isDisabled && onSelect?.(date)}
        disabled={isDisabled}
        className={cn(
          "p-2 text-sm rounded-md transition-colors relative",
          isDisabled ? "text-muted-foreground/40 cursor-not-allowed" : "hover:bg-muted",
          isSelected && !isRangeStart && !isRangeEnd && "bg-primary text-primary-foreground hover:bg-primary/90",
          isRangeStart && "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold",
          isRangeEnd && "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold",
          (isInRange || (isInSelectedRange && !isRangeStart && !isRangeEnd)) && "bg-primary/20 text-primary",
          isWeekend && !isDisabled && !isSelected && !isRangeStart && !isRangeEnd && !isInRange && !isInSelectedRange && "text-orange-600 dark:text-orange-400 font-medium"
        )}
      >
        {day}
        {isRangeStart && isSelectingRange && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-primary">
            Start
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={cn("p-3", className)}>
      {/* Month and Year Selectors */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={previousMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2 flex-1">
          <Select
            value={currentMonth.getMonth().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentMonth.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={nextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary"></div>
          <span>Selected</span>
        </div>
        {isSelectingRange && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/20"></div>
            <span>In Range</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900"></div>
          <span>Weekend</span>
        </div>
      </div>
    </div>
  )
}
