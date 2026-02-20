import { useEffect, useState } from 'react';
import { helpdeskService } from '@/services/helpdeskService';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApprovalHistoryProps {
  ticketId: string;
}

interface ApprovalRecord {
  level: string;
  approverId: string;
  approverName?: string;
  status: string;
  comments?: string;
  timestamp: Date;
}

export function ApprovalHistory({ ticketId }: ApprovalHistoryProps) {
  const [history, setHistory] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await helpdeskService.getApprovalHistory(ticketId);
      setHistory(data);
    } catch (error) {
      console.error('Error loading approval history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Approval History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Approval History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center py-4">
            No approval history available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Approval History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((record, index) => (
            <div
              key={index}
              className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0"
            >
              <div className="mt-1">
                {record.status === 'Approved' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : record.status === 'Rejected' ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      record.status === 'Approved'
                        ? 'default'
                        : record.status === 'Rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {record.level}
                  </Badge>
                  <span className="text-sm font-semibold">
                    {record.status}
                  </span>
                </div>

                {record.approverName && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                    <User className="w-3 h-3" />
                    {record.approverName}
                  </div>
                )}

                {record.comments && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                    {record.comments}
                  </p>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                  <Clock className="w-3 h-3" />
                  {new Date(record.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
