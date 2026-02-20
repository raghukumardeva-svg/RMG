import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface DateRangePickerProps {
  fromDate?: string
  toDate?: string
  onFromDateChange?: (date: string) => void
  onToDateChange?: (date: string) => void
  onClear?: () => void
  className?: string
  placeholder?: string
}

// Helper function to parse YYYY-MM-DD string as local date
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Helper function to format Date as YYYY-MM-DD in local timezone
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DateRangePicker({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
  className,
  placeholder = "Select date range"
}: DateRangePickerProps) {
  const [fromDateObj, setFromDateObj] = React.useState<Date | undefined>(
    fromDate ? parseLocalDate(fromDate) : undefined
  )
  const [toDateObj, setToDateObj] = React.useState<Date | undefined>(
    toDate ? parseLocalDate(toDate) : undefined
  )
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectingFrom, setSelectingFrom] = React.useState(true)

  React.useEffect(() => {
    setFromDateObj(fromDate ? parseLocalDate(fromDate) : undefined)
  }, [fromDate])

  React.useEffect(() => {
    setToDateObj(toDate ? parseLocalDate(toDate) : undefined)
  }, [toDate])

  const handleFromDateSelect = (date: Date | undefined) => {
    setFromDateObj(date)
    if (date) {
      const formatted = formatLocalDate(date)
      onFromDateChange?.(formatted)
      setSelectingFrom(false)
    }
  }

  const handleToDateSelect = (date: Date | undefined) => {
    if (date && fromDateObj && date < fromDateObj) {
      // If selected end date is before start date, swap them
      setToDateObj(fromDateObj)
      setFromDateObj(date)
      onToDateChange?.(formatLocalDate(fromDateObj))
      onFromDateChange?.(formatLocalDate(date))
      setIsOpen(false)
      setSelectingFrom(true)
    } else {
      setToDateObj(date)
      if (date) {
        const formatted = formatLocalDate(date)
        onToDateChange?.(formatted)
        setIsOpen(false)
        setSelectingFrom(true)
      }
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFromDateObj(undefined)
    setToDateObj(undefined)
    onClear?.()
  }

  const formatDateRange = () => {
    if (!fromDateObj && !toDateObj) return null
    
    const formatDate = (date: Date) => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    }

    if (fromDateObj && toDateObj) {
      return `${formatDate(fromDateObj)} - ${formatDate(toDateObj)}`
    } else if (fromDateObj) {
      return `From ${formatDate(fromDateObj)}`
    } else if (toDateObj) {
      return `Until ${formatDate(toDateObj)}`
    }
  }

  const displayText = formatDateRange()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !displayText && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{displayText || placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <p className="text-sm font-medium">
              {selectingFrom ? "Select start date" : "Select end date"}
            </p>
          </div>
          <div className="flex gap-2 p-2">
            <div className="flex-1">
              <Calendar
                selected={selectingFrom ? fromDateObj : toDateObj}
                onSelect={selectingFrom ? handleFromDateSelect : handleToDateSelect}
                rangeStart={fromDateObj}
                rangeEnd={toDateObj}
                isSelectingRange={true}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(23, 59, 59, 999)
                  
                  // Only disable future dates
                  return date > today
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectingFrom(!selectingFrom)}
              disabled={!fromDateObj && !selectingFrom}
            >
              {selectingFrom ? "Skip to end date" : "Back to start date"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                handleClear(e)
                setIsOpen(false)
              }}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {displayText && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
          title="Clear date range"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
