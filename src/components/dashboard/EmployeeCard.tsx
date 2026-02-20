import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Mail, Phone, MapPin, Briefcase, Building, Building2 } from 'lucide-react';

export interface EmployeeDetail {
  id: string;
  name: string;
  date: string;
  fullDate: string;
  isToday?: boolean;
  isUpcoming?: boolean;
  department: string;
  avatar: string;
  profilePhoto?: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  businessUnit: string;
  years?: number;
  role?: string;
  joinDate?: string;
}

interface EmployeeCardProps {
  person: EmployeeDetail;
  type: 'birthday' | 'anniversary' | 'newjoinee';
  onHover: (id: string | null) => void;
  isHovered: boolean;
}

export function EmployeeCard({ person, type, onHover, isHovered }: EmployeeCardProps) {
  const getBadgeVariant = () => {
    switch (type) {
      case 'birthday':
        return 'default';
      case 'anniversary':
        return 'secondary';
      case 'newjoinee':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getAvatarColor = () => {
    switch (type) {
      case 'birthday':
        return 'bg-pink-600';
      case 'anniversary':
        return 'bg-purple-600';
      case 'newjoinee':
        return 'bg-green-600';
      default:
        return 'bg-primary';
    }
  };

  const getTooltipText = () => {
    if (type === 'birthday') {
      return `${person.name}'s birthday on ${person.fullDate}`;
    } else if (type === 'anniversary') {
      return `${person.name}'s ${person.years} year work anniversary on ${person.fullDate}`;
    } else {
      return `${person.name} joined on ${person.fullDate}`;
    }
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => onHover(person.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Tooltip */}
      {isHovered && (
        <div 
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md shadow-lg border whitespace-nowrap animate-in fade-in-0 zoom-in-95"
          role="tooltip"
        >
          {getTooltipText()}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-popover border-r border-b rotate-45"></div>
        </div>
      )}

      {/* Card with Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button 
            className="flex items-center gap-3 w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer bg-white dark:bg-gray-900 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={`View details for ${person.name}`}
          >
            {person.profilePhoto ? (
              <img
                src={person.profilePhoto}
                alt={person.name}
                className="h-12 w-12 rounded-full object-cover flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className={`h-12 w-12 rounded-full ${getAvatarColor()} flex items-center justify-center text-white font-medium text-base flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                {person.avatar}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate text-gray-900 dark:text-white">{person.name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {type === 'birthday' && person.fullDate}
                {type === 'anniversary' && `${person.years ?? 0} year${(person.years ?? 0) > 1 ? 's' : ''} • ${person.fullDate}`}
                {type === 'newjoinee' && person.role}
              </p>
            </div>
            {type === 'birthday' && person.isToday && (
              <Badge variant={getBadgeVariant()} className="flex-shrink-0">
                Today
              </Badge>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <EmployeeDetails employee={person} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Employee Details Component for Popover
function EmployeeDetails({ employee }: { employee: EmployeeDetail }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b">
        {employee.profilePhoto ? (
          <img
            src={employee.profilePhoto}
            alt={employee.name}
            className="h-12 w-12 rounded-full object-cover flex-shrink-0 shadow-sm"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-medium text-base shadow-sm flex-shrink-0">
            {employee.avatar}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base truncate">{employee.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{employee.jobTitle}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <DetailRow icon={Mail} label="Email" value={employee.email} />
        <DetailRow icon={Phone} label="Phone" value={employee.phone} />
        <DetailRow icon={MapPin} label="Location" value={employee.location} />
        <DetailRow icon={Briefcase} label="Job Title" value={employee.jobTitle} />
        <DetailRow icon={Building} label="Department" value={employee.department} />
        <DetailRow icon={Building2} label="Business Unit" value={employee.businessUnit} />
      </div>
    </div>
  );
}

interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="p-1.5 rounded-md bg-primary/10 text-primary mt-0.5">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5 font-normal">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
