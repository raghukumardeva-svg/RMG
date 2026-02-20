import { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Pencil, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Holiday } from '@/store/holidayStore';

interface HolidaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holidays: Holiday[];
  onEditHoliday?: (holiday: Holiday) => void;
  showEditButton?: boolean;
}

// Color palette for date cards - solid colors, no gradients
const DATE_CARD_COLORS = [
  { bg: 'bg-cyan-500', text: 'text-white' },
  { bg: 'bg-amber-400', text: 'text-slate-900' },
  { bg: 'bg-rose-400', text: 'text-white' },
  { bg: 'bg-stone-300', text: 'text-slate-900' },
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-violet-500', text: 'text-white' },
  { bg: 'bg-orange-400', text: 'text-slate-900' },
  { bg: 'bg-pink-400', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-yellow-400', text: 'text-slate-900' },
  { bg: 'bg-indigo-500', text: 'text-white' },
];

// Get color based on month index
const getDateCardColor = (monthIndex: number) => {
  return DATE_CARD_COLORS[monthIndex % DATE_CARD_COLORS.length];
};

// Parse date string and return date parts
const parseHolidayDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // Try parsing formatted date like "Jan 1, 2026"
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return {
        day: d.getDate(),
        month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        monthIndex: d.getMonth(),
        dayOfWeek: d.toLocaleString('en-US', { weekday: 'long' }),
        year: d.getFullYear(),
      };
    }
    return null;
  }
  return {
    day: date.getDate(),
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    monthIndex: date.getMonth(),
    dayOfWeek: date.toLocaleString('en-US', { weekday: 'long' }),
    year: date.getFullYear(),
  };
};

export function HolidaysDialog({ 
  open, 
  onOpenChange, 
  holidays, 
  onEditHoliday,
  showEditButton = false 
}: HolidaysDialogProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Filter holidays by selected year
  const filteredHolidays = useMemo(() => {
    return holidays.filter(holiday => {
      const parsed = parseHolidayDate(holiday.date);
      return parsed && parsed.year === selectedYear;
    }).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
  }, [holidays, selectedYear]);

  // Split holidays into two columns
  const leftColumn = filteredHolidays.filter((_, index) => index % 2 === 0);
  const rightColumn = filteredHolidays.filter((_, index) => index % 2 === 1);

  const handlePrevYear = () => setSelectedYear(prev => prev - 1);
  const handleNextYear = () => setSelectedYear(prev => prev + 1);

  const HolidayCard = ({ holiday }: { holiday: Holiday }) => {
    const parsed = parseHolidayDate(holiday.date);
    if (!parsed) return null;

    const colors = getDateCardColor(parsed.monthIndex);
    const hasBackgroundImage = holiday.backgroundImage && holiday.backgroundImage.length > 0;

    return (
      <div 
        className="group flex items-stretch gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all duration-200 cursor-default"
        role="listitem"
        aria-label={`${holiday.name} on ${parsed.dayOfWeek}, ${parsed.month} ${parsed.day}`}
      >
        {/* Date Card */}
        <div 
          className={`relative flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center overflow-hidden ${!hasBackgroundImage ? colors.bg : ''}`}
          style={hasBackgroundImage ? {
            backgroundImage: `url(${holiday.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          {hasBackgroundImage && (
            <div className="absolute inset-0 bg-black/40" />
          )}
          <span className={`relative z-10 text-xs font-bold tracking-wider ${hasBackgroundImage ? 'text-white' : colors.text}`}>
            {parsed.month}
          </span>
          <span className={`relative z-10 text-2xl font-bold leading-none ${hasBackgroundImage ? 'text-white' : colors.text}`}>
            {parsed.day}
          </span>
        </div>

        {/* Holiday Details */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">
            {holiday.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {parsed.dayOfWeek}
          </p>
          {holiday.type && (
            <Badge 
              variant="secondary" 
              className="mt-1 w-fit text-[10px] px-1.5 py-0 h-4"
            >
              {holiday.type}
            </Badge>
          )}
        </div>

        {/* Edit Button */}
        {showEditButton && onEditHoliday && (
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-foreground self-center"
            onClick={() => onEditHoliday(holiday)}
            aria-label={`Edit ${holiday.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl p-0 gap-0 bg-background border overflow-hidden [&>button]:hidden"
        aria-labelledby="holidays-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <h2 id="holidays-dialog-title" className="text-xl font-semibold text-foreground">
              Holidays
            </h2>
          </div>
          
          {/* Year Selector */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevYear}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-foreground min-w-[60px] text-center">
              {selectedYear}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextYear}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="h-[60vh] max-h-[500px]">
          <div className="p-6">
            {filteredHolidays.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-lg font-medium">No holidays for {selectedYear}</p>
                <p className="text-muted-foreground/70 text-sm mt-1">Try selecting a different year</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1" role="list">
                {/* Left Column */}
                <div className="space-y-1">
                  {leftColumn.map((holiday, index) => (
                    <HolidayCard key={`left-${index}`} holiday={holiday} />
                  ))}
                </div>
                
                {/* Right Column */}
                <div className="space-y-1">
                  {rightColumn.map((holiday, index) => (
                    <HolidayCard key={`right-${index}`} holiday={holiday} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {filteredHolidays.length} holiday{filteredHolidays.length !== 1 ? 's' : ''} in {selectedYear}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
