import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, Clock } from 'lucide-react';
import type { HelpdeskTicket } from '@/types/helpdeskNew';
import { sanitizeHtml } from '@/utils/sanitize';
import { format, formatDistanceToNow } from 'date-fns';

interface TicketDetailsProps {
  ticket: HelpdeskTicket;
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-green" />
          Request Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Creation Information */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-2 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <Label className="text-xs text-blue-700 dark:text-blue-400 font-medium">Created By</Label>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mt-0.5">
                {ticket.userName}
              </p>
              {ticket.userEmail && (
                <p className="text-xs text-blue-600 dark:text-blue-400">{ticket.userEmail}</p>
              )}
              {ticket.userDepartment && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {ticket.userDepartment}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <Label className="text-xs text-blue-700 dark:text-blue-400 font-medium">Creation Date</Label>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mt-0.5">
                {format(new Date(ticket.createdAt), 'MMMM dd, yyyy')}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {format(new Date(ticket.createdAt), 'hh:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <Label className="text-xs text-blue-700 dark:text-blue-400 font-medium">Age</Label>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mt-0.5">
                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-xs text-brand-slate dark:text-gray-400">Subject</Label>
          <p className="text-sm font-medium text-brand-navy dark:text-gray-100 mt-1">
            {ticket.subject}
          </p>
        </div>

        <div>
          <Label className="text-xs text-brand-slate dark:text-gray-400">Description</Label>
          <div 
            className="text-sm text-brand-navy dark:text-gray-100 mt-1 whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(ticket.description) }}
          />
        </div>

        {ticket.attachments && ticket.attachments.length > 0 && (
          <div>
            <Label className="text-xs text-brand-slate dark:text-gray-400">Attachments</Label>
            <div className="mt-2 space-y-1">
              {ticket.attachments.map((attachment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  <span>{attachment}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

