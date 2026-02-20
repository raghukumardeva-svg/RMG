import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, CheckCircle2, XCircle, Send, Route, UserCheck, TrendingUp, MessageSquare, RotateCcw } from 'lucide-react';
import type { HelpdeskTicket } from '@/types/helpdeskNew';

interface HistoryTimelineProps {
  ticket: HelpdeskTicket;
}

export function HistoryTimeline({ ticket }: HistoryTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getEventIcon = (action: string) => {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('submit') || actionLower.includes('created')) {
      return <Send className="h-4 w-4 text-blue-500" />;
    }
    if (actionLower.includes('approv') && !actionLower.includes('reject')) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (actionLower.includes('reject')) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (actionLower.includes('route') || actionLower.includes('queue')) {
      return <Route className="h-4 w-4 text-cyan-500" />;
    }
    if (actionLower.includes('assign')) {
      return <UserCheck className="h-4 w-4 text-purple-500" />;
    }
    if (actionLower.includes('progress') || actionLower.includes('working')) {
      return <TrendingUp className="h-4 w-4 text-orange-500" />;
    }
    if (actionLower.includes('complet') || actionLower.includes('closed')) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (actionLower.includes('reopen')) {
      return <RotateCcw className="h-4 w-4 text-amber-500" />;
    }
    if (actionLower.includes('comment') || actionLower.includes('remark') || actionLower.includes('note')) {
      return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }

    return <Clock className="h-4 w-4 text-brand-slate dark:text-gray-400" />;
  };

  const getEventColor = (action: string): string => {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('submit') || actionLower.includes('created')) {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
    if (actionLower.includes('approv') && !actionLower.includes('reject')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
    if (actionLower.includes('reject')) {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
    if (actionLower.includes('route') || actionLower.includes('queue')) {
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
    }
    if (actionLower.includes('assign')) {
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    }
    if (actionLower.includes('progress') || actionLower.includes('working')) {
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
    if (actionLower.includes('complet') || actionLower.includes('closed')) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
    if (actionLower.includes('reopen')) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }

    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  // Ensure history is available and sorted by timestamp (newest first)
  const sortedHistory = ticket.history
    ? [...ticket.history].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    : [];

  return (
    <Card className="border-gray-200 dark:border-gray-700 h-fit sticky top-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-green" />
          Activity History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-brand-slate dark:text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-brand-slate dark:text-gray-400">
              No activity history available
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedHistory.map((entry, index) => {
              const { date, time } = formatDate(entry.timestamp);

              return (
                <div key={index} className="relative">
                  {/* Timeline connector line */}
                  {index < sortedHistory.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-[-16px] w-0.5 bg-gray-200 dark:bg-gray-700" />
                  )}

                  {/* Timeline entry */}
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0 h-8 w-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      {getEventIcon(entry.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1">
                          <Badge className={`text-xs mb-1 ${getEventColor(entry.action)}`}>
                            {entry.action}
                          </Badge>
                          <p className="text-xs text-brand-slate dark:text-gray-400">
                            {date} at {time}
                          </p>
                        </div>
                      </div>

                      {entry.performedBy && (
                        <div className="flex items-center gap-1.5 mt-1 mb-1">
                          <User className="h-3 w-3 text-brand-slate dark:text-gray-400" />
                          <p className="text-xs text-brand-navy dark:text-gray-300">
                            {entry.performedBy}
                          </p>
                        </div>
                      )}

                      {entry.details && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-brand-navy dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                          {entry.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
