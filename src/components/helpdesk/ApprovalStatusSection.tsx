import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HelpdeskTicket, ApprovalLevel } from '@/types/helpdeskNew';
import { useState } from 'react';

interface ApprovalStatusSectionProps {
  ticket: HelpdeskTicket;
}

export function ApprovalStatusSection({ ticket }: ApprovalStatusSectionProps) {
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});

  if (!ticket.approval?.required || ticket.approval.bypassed) {
    return null; // No approval required
  }

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderApprovalLevel = (level: ApprovalLevel, levelNumber: number) => {
    const isApproved = level.status === 'Approved';
    const isRejected = level.status === 'Rejected';
    const isPending = level.status === 'Pending';
    const hasComments = !!(level.remarks || level.comments);
    const isExpanded = expandedLevels[levelNumber];

    return (
      <div
        key={levelNumber}
        className={cn(
          "border rounded-lg transition-all",
          isApproved && "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
          isRejected && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20",
          isPending && "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20"
        )}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isApproved && "bg-green-100 dark:bg-green-900/40",
                isRejected && "bg-red-100 dark:bg-red-900/40",
                isPending && "bg-gray-100 dark:bg-gray-800"
              )}>
                {isApproved && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
                {isRejected && <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                {isPending && <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
              </div>

              {/* Level Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-semibold",
                    isApproved && "text-green-900 dark:text-green-100",
                    isRejected && "text-red-900 dark:text-red-100",
                    isPending && "text-gray-900 dark:text-gray-100"
                  )}>
                    Level {levelNumber} - {level.status}
                  </span>
                </div>

                {level.approverName && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {level.approverName || level.managerName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamp & Expand Button */}
            <div className="flex items-center gap-2">
              {(level.actionTimestamp || level.actionDate || level.timestamp) && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(level.actionTimestamp || level.actionDate || level.timestamp)}
                </span>
              )}

              {hasComments && (
                <button
                  onClick={() => toggleLevel(levelNumber)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label={isExpanded ? "Collapse comments" : "Expand comments"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Comments/Remarks - Expandable */}
          {hasComments && isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRejected ? 'Rejection Reason:' : 'Comments:'}
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                {level.remarks || level.comments}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {ticket.approval.level1 && renderApprovalLevel(ticket.approval.level1, 1)}
      {ticket.approval.level2 && renderApprovalLevel(ticket.approval.level2, 2)}
      {ticket.approval.level3 && renderApprovalLevel(ticket.approval.level3, 3)}
    </div>
  );
}
