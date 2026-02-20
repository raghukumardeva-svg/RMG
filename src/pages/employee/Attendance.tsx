import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, CheckCircle, XCircle, Circle, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FilterPeriod = '30Days' | 'Oct' | 'Sep' | 'Aug' | 'Jul' | 'Jun' | 'May';

export function Attendance() {
  const user = useAuthStore((state) => state.user);
  const { getRecordsByUserId } = useAttendanceStore();
  const [activePeriod, setActivePeriod] = useState<FilterPeriod>('30Days');

  const records = getRecordsByUserId(user?.employeeId || '');

  // Filter records based on selected period
  const filterRecordsByPeriod = (period: FilterPeriod) => {
    const now = new Date();
    
    if (period === '30Days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return records.filter(r => new Date(r.date) >= thirtyDaysAgo);
    }
    
    // For month filters, get records from that month
    const monthMap: Record<string, number> = {
      'Oct': 9, 'Sep': 8, 'Aug': 7, 'Jul': 6, 'Jun': 5, 'May': 4
    };
    
    const monthNum = monthMap[period];
    return records.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === monthNum && recordDate.getFullYear() === now.getFullYear();
    });
  };

  const filteredRecords = filterRecordsByPeriod(activePeriod);

  const getAttendanceIcon = (record: typeof records[0]) => {
    if (record.status === 'Present') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (record.status === 'Absent') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const getRowClassName = (record: typeof records[0], index: number) => {
    if (record.status === 'W-Off' || record.status === 'Holiday') {
      return 'bg-blue-50 dark:bg-blue-950/20';
    } else if (record.status === 'Leave') {
      return 'bg-orange-100 dark:bg-orange-900/20';
    } else if (!record.checkIn) {
      return 'bg-red-50 dark:bg-red-950/20';
    }
    // Alternating row colors for normal records
    return index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const periods: { label: string; value: FilterPeriod }[] = [
    { label: '30 Days', value: '30Days' },
    { label: 'Oct', value: 'Oct' },
    { label: 'Sep', value: 'Sep' },
    { label: 'Aug', value: 'Aug' },
    { label: 'Jul', value: 'Jul' },
    { label: 'Jun', value: 'Jun' },
    { label: 'May', value: 'May' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Calendar className="h-7 w-7 text-primary" />
            Last 30 Days
          </h1>
          <p className="page-description">Your attendance records and working hours</p>
        </div>
      </div>

      {/* Month Filters */}
      <div className="flex gap-2 flex-wrap">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant={activePeriod === period.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePeriod(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 p-4 border-b bg-muted-color/50 font-semibold text-sm">
            <div>Date</div>
            <div>Attendance</div>
            <div>Effective Hours</div>
            <div>Gross Hours</div>
            <div className="text-center">Log</div>
          </div>

          {/* Table Body */}
          {filteredRecords.length > 0 ? (
            <div>
              {filteredRecords.map((record, index) => (
                <div
                  key={`${record.date}-${record.userId}`}
                  className={`grid grid-cols-5 gap-4 p-4 border-b last:border-b-0 items-center ${getRowClassName(record, index)}`}
                >
                  {/* Date Column */}
                  <div>
                    <p className="font-medium">{formatDate(record.date)}</p>
                  </div>

                  {/* Attendance Visual Column */}
                  <div className="flex items-center gap-2">
                    {getAttendanceIcon(record)}
                    <div>
                      {record.checkIn ? (
                        <>
                          <p className="text-sm font-medium">{record.checkIn}</p>
                          {record.checkOut && (
                            <p className="text-xs text-muted-foreground">{record.checkOut}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {record.status === 'W-Off' ? 'Week Off' :
                           record.status === 'Holiday' ? 'Holiday' :
                           record.status === 'Leave' ? 'On Leave' :
                           'No Time Entries Logged'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Effective Hours Column */}
                  <div>
                    {record.effectiveHours ? (
                      <Badge variant="secondary" className="font-mono">
                        {record.effectiveHours}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Gross Hours Column */}
                  <div>
                    {record.grossHours ? (
                      <Badge variant="outline" className="font-mono">
                        {record.grossHours}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Log Menu Column */}
                  <div className="flex justify-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-2" align="end">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={() => {
                              toast.info('View details coming soon');
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={() => {
                              toast.info('Edit feature coming soon');
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              toast.info('Delete feature coming soon');
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-lg">No attendance records found for this period</p>
              <p className="text-sm mt-2">Check in from your dashboard to start tracking attendance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

