import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from './RichTextEditor';
import FileAttachmentUpload from './FileAttachment';
import StatusNotifications from './StatusNotifications';
import EmailNotifications from './EmailNotifications';

/**
 * Phase 1 Priority 2: Essential Communication Components
 * 
 * This example demonstrates how to integrate the new communication features:
 * 1. Rich Text Editor - Enhanced message composition with formatting
 * 2. File Attachments - Drag-drop file upload with preview
 * 3. Status Notifications - Real-time updates for users
 * 4. Email Notifications - Automated email templates and tracking
 * 
 * Usage Example:
 * ```tsx
 * import { CommunicationExample } from '@/components/helpdesk/CommunicationExample';
 * 
 * function TicketDetailPage() {
 *   return <CommunicationExample />;
 * }
 * ```
 */
export const CommunicationExample: React.FC = () => {
  const [editorContent, setEditorContent] = React.useState('');
  const [attachedFiles, setAttachedFiles] = React.useState<File[]>([]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Essential Communication Features</h1>
          <p className="text-muted-foreground">
            Phase 1 Priority 2 - Enhanced communication tools for helpdesk
          </p>
        </div>
        
        {/* Status Notifications in Header */}
        <StatusNotifications 
          onNotificationClick={(notification) => {
            console.log('Notification clicked:', notification);
          }}
        />
      </div>

      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor">Rich Text Editor</TabsTrigger>
          <TabsTrigger value="attachments">File Attachments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="emails">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rich Text Editor</CardTitle>
              <CardDescription>
                Compose messages with formatting, attachments, and screenshots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={editorContent}
                onChange={setEditorContent}
                placeholder="Type your message here..."
                showAttachments={true}
                onAttachmentsChange={setAttachedFiles}
                minHeight="300px"
              />
              
              {attachedFiles.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {attachedFiles.length} file(s) attached
                </div>
              )}
              
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
                <h4 className="font-medium mb-2">Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>WYSIWYG formatting (Bold, Italic, Underline, etc.)</li>
                  <li>Lists, links, images, and code blocks</li>
                  <li>Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)</li>
                  <li>Attachment management with preview</li>
                  <li>Live preview mode</li>
                  <li>Character count and clear functionality</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drag & Drop File Attachments</CardTitle>
              <CardDescription>
                Upload files with preview, progress tracking, and validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileAttachmentUpload
                maxFiles={10}
                maxFileSize={10}
                allowedTypes={['image/*', '.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.xls']}
                onFilesChange={(files) => {
                  console.log('Files changed:', files);
                  setAttachedFiles(files);
                }}
                autoUpload={false}
              />
              
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
                <h4 className="font-medium mb-2">Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Drag and drop interface</li>
                  <li>File type and size validation</li>
                  <li>Image preview for supported formats</li>
                  <li>Upload progress tracking</li>
                  <li>Retry failed uploads</li>
                  <li>Multiple file support with limits</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Status Notifications</CardTitle>
              <CardDescription>
                Live updates for ticket status changes, comments, and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      The notification bell is displayed in the header above.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click the bell icon to view notifications panel
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Real-time notification delivery (simulated WebSocket)</li>
                    <li>Desktop notifications (with permission)</li>
                    <li>Sound alerts for new notifications</li>
                    <li>Filter by notification type</li>
                    <li>Mark as read/unread functionality</li>
                    <li>Customizable notification preferences</li>
                    <li>Priority-based categorization</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <EmailNotifications />
          
          <Card>
            <CardHeader>
              <CardTitle>Integration Guide</CardTitle>
              <CardDescription>
                How to use email notifications in your helpdesk workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Automated Email Triggers:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Ticket Created - Instant confirmation to customer</li>
                    <li>Ticket Assigned - Notify customer of assigned agent</li>
                    <li>Ticket Resolved - Resolution notification</li>
                    <li>SLA Warning - Alert agents about approaching deadlines</li>
                    <li>Comment Added - Update stakeholders on new activity</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Template Variables:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>{'{{customerName}}'} - Customer's name</li>
                    <li>{'{{agentName}}'} - Assigned agent's name</li>
                    <li>{'{{ticketNumber}}'} - Ticket reference number</li>
                    <li>{'{{ticketSubject}}'} - Ticket subject line</li>
                    <li>{'{{ticketStatus}}'} - Current ticket status</li>
                    <li>{'{{companyName}}'} - Your company name</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Component Integration Examples</CardTitle>
          <CardDescription>
            Code snippets for integrating these components into your helpdesk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ticket-reply">
            <TabsList>
              <TabsTrigger value="ticket-reply">Ticket Reply</TabsTrigger>
              <TabsTrigger value="notification-setup">Notifications</TabsTrigger>
              <TabsTrigger value="email-trigger">Email Trigger</TabsTrigger>
            </TabsList>

            <TabsContent value="ticket-reply" className="mt-4">
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`// Ticket Reply Form with Rich Text Editor
import { RichTextEditor } from '@/components/helpdesk/RichTextEditor';
import { FileAttachmentUpload } from '@/components/helpdesk/FileAttachment';

function TicketReplyForm({ ticketId }) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);

  const handleSubmit = async () => {
    await api.addTicketComment({
      ticketId,
      content,
      attachments: files,
    });
  };

  return (
    <div>
      <RichTextEditor
        value={content}
        onChange={setContent}
        showAttachments={true}
        onAttachmentsChange={setFiles}
      />
      <Button onClick={handleSubmit}>Send Reply</Button>
    </div>
  );
}`}
              </pre>
            </TabsContent>

            <TabsContent value="notification-setup" className="mt-4">
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`// Notifications in App Header
import { StatusNotifications } from '@/components/helpdesk/StatusNotifications';

function AppHeader() {
  const router = useRouter();

  return (
    <header>
      <StatusNotifications
        userId={currentUser.id}
        onNotificationClick={(notification) => {
          if (notification.ticketId) {
            router.push(\`/tickets/\${notification.ticketId}\`);
          }
        }}
      />
    </header>
  );
}`}
              </pre>
            </TabsContent>

            <TabsContent value="email-trigger" className="mt-4">
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`// Trigger Email on Ticket Status Change
async function updateTicketStatus(ticketId, newStatus) {
  await api.updateTicket(ticketId, { status: newStatus });
  
  // Trigger appropriate email notification
  if (newStatus === 'resolved') {
    await emailService.send({
      trigger: 'ticket_resolved',
      ticketId,
      variables: {
        customerName: ticket.customerName,
        ticketNumber: ticket.number,
        resolutionSummary: ticket.resolution,
      },
    });
  }
}`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationExample;
