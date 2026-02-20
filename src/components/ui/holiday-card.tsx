import { cn } from '@/lib/utils';
import {
  Snowflake,
  Flame,
  Flag,
  Moon,
  Star,
  Sparkles,
  PartyPopper,
  Heart,
  Calendar
} from 'lucide-react';

interface HolidayCardProps {
  name: string;
  date: string;
  className?: string;
}

// Get themed background and icon based on holiday name
const getHolidayTheme = (name: string) => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('christmas') || lowerName.includes('xmas')) {
    return {
      bgClass: 'holiday-christmas',
      icon: Snowflake,
      iconColor: 'text-red-500',
      badgeVariant: 'danger' as const,
      animate: 'animate-float'
    };
  }

  if (lowerName.includes('diwali') || lowerName.includes('deepavali')) {
    return {
      bgClass: 'holiday-diwali',
      icon: Flame,
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeVariant: 'secondary' as const,
      animate: 'animate-sparkle'
    };
  }

  if (lowerName.includes('independence') || lowerName.includes('august 15')) {
    return {
      bgClass: 'holiday-independence',
      icon: Flag,
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeVariant: 'secondary' as const,
      animate: 'animate-swing'
    };
  }

  if (lowerName.includes('republic') || lowerName.includes('january 26')) {
    return {
      bgClass: 'holiday-republic',
      icon: Flag,
      iconColor: 'text-blue-500',
      badgeVariant: 'secondary' as const,
      animate: 'animate-swing'
    };
  }

  if (lowerName.includes('holi')) {
    return {
      bgClass: 'holiday-holi',
      icon: Sparkles,
      iconColor: 'text-pink-500',
      badgeVariant: 'secondary' as const,
      animate: 'animate-bounce'
    };
  }

  if (lowerName.includes('eid') || lowerName.includes('ramadan')) {
    return {
      bgClass: 'holiday-eid',
      icon: Moon,
      iconColor: 'text-emerald-500',
      badgeVariant: 'secondary' as const,
      animate: 'animate-pulse'
    };
  }

  if (lowerName.includes('new year')) {
    return {
      bgClass: 'holiday-default',
      icon: PartyPopper,
      iconColor: 'text-purple-500',
      badgeVariant: 'secondary' as const,
      animate: 'animate-bounce'
    };
  }

  if (lowerName.includes('valentine')) {
    return {
      bgClass: 'holiday-default',
      icon: Heart,
      iconColor: 'text-pink-500',
      badgeVariant: 'secondary' as const,
      animate: 'animate-pulse'
    };
  }

  if (lowerName.includes('ganesh') || lowerName.includes('pongal') || lowerName.includes('onam')) {
    return {
      bgClass: 'holiday-diwali',
      icon: Star,
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeVariant: 'secondary' as const,
      animate: 'animate-sparkle'
    };
  }

  // Default theme
  return {
    bgClass: 'holiday-default',
    icon: Calendar,
    iconColor: 'text-blue-500',
    badgeVariant: 'secondary' as const,
    animate: ''
  };
};

export function HolidayCard({ name, date, className }: HolidayCardProps) {
  const theme = getHolidayTheme(name);
  const Icon = theme.icon;

  return (
    <div
      className={cn(
        "relative flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group",
        theme.bgClass,
        className
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10 transform translate-x-6 -translate-y-6">
        <Icon className="w-full h-full" />
      </div>

      <div className="flex items-center gap-4 z-10">
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800 shadow-sm transition-transform duration-200 group-hover:scale-105",
          theme.animate
        )}>
          <Icon className={cn("h-6 w-6", theme.iconColor)} />
        </div>
        <div>
          <p className="font-bold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{date}</p>
        </div>
      </div>
    </div>
  );
}
