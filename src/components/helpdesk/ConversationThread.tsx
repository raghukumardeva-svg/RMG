import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Paperclip, FileText, MessageSquare, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationMessage } from '@/types/helpdesk';
import { toast } from 'sonner';

interface ConversationThreadProps {
  messages: ConversationMessage[];
  currentUserType: 'employee' | 'itadmin';
  currentUserName: string;
  onSendMessage: (message: string, attachments?: string[]) => Promise<void>;
  isLoading?: boolean;
  ticketStatus: string;
}

export const ConversationThread = React.memo<ConversationThreadProps>(({
  messages,
  currentUserType,
  onSendMessage,
  isLoading,
  ticketStatus,
}: ConversationThreadProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isSending, onSendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const isTicketClosed = ticketStatus === 'Closed';

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Messages Yet</h3>
            <p className="text-sm text-muted-foreground">
              Start the conversation by sending a message below.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender === currentUserType;
            const isSystemMessage = message.sender === 'system';
            const messageKey = `${message.timestamp}-${index}`;

            if (isSystemMessage) {
              return (
                <div key={messageKey} className="flex justify-center my-4 animate-fade-in">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 px-4 py-2 rounded-lg text-xs text-blue-700 dark:text-blue-400 max-w-md text-center shadow-sm">
                    <span className="font-medium">{message.senderName}:</span> {message.message}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={messageKey}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-sm">
                  <AvatarFallback className={cn(
                    "font-semibold text-xs",
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : message.sender === 'itadmin'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  )}>
                    {getInitials(message.senderName)}
                  </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div className={cn(
                  'flex flex-col max-w-[70%]',
                  isOwnMessage ? 'items-end' : 'items-start'
                )}>
                  <div className={cn(
                    'px-4 py-2.5 rounded-lg shadow-sm transition-shadow hover:shadow-md',
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn(
                        'text-xs font-semibold',
                        isOwnMessage ? 'text-primary-foreground' : 'text-gray-900 dark:text-gray-100'
                      )}>
                        {message.senderName}
                      </p>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        isOwnMessage
                          ? 'bg-white/20 text-primary-foreground'
                          : message.sender === 'itadmin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      )}>
                        {message.sender === 'employee' ? 'Employee' : message.sender === 'itadmin' ? 'IT Admin' : message.sender.toUpperCase()}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm whitespace-pre-wrap leading-relaxed",
                      isOwnMessage ? 'text-primary-foreground' : 'text-gray-700 dark:text-gray-300'
                    )}>
                      {message.message}
                    </p>

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs p-2 rounded bg-black/10"
                          >
                            <FileText className="h-3 w-3" />
                            <span>{attachment}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {!isTicketClosed && (
        <div className="border-t p-4 bg-background">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Press Enter to send)"
                className="resize-none min-h-[60px] max-h-[120px]"
                disabled={isSending || isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={isSending || isLoading}
                title="Attach file (coming soon)"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim() || isSending || isLoading}
                size="icon"
              >
                {isSending ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to send,{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded">Shift+Enter</kbd> for new line
          </p>
        </div>
      )}

      {isTicketClosed && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/30 dark:to-gray-900/10 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/30 mb-1">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              This ticket has been successfully closed
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              No further messages can be sent. Thank you for using our support services.
            </p>
            <button className="text-xs text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors">
              Need further help? Create a new request
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ConversationThread.displayName = 'ConversationThread';
