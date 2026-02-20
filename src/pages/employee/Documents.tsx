import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, FolderOpen } from 'lucide-react';

export function Documents() {
  const documents = [
    { id: 1, name: 'Employee Handbook', type: 'PDF', category: 'Policy', date: '2025-01-15' },
    { id: 2, name: 'Code of Conduct', type: 'PDF', category: 'Policy', date: '2025-01-15' },
    { id: 3, name: 'Offer Letter', type: 'PDF', category: 'Personal', date: '2020-03-10' },
    { id: 4, name: 'Tax Declaration Form', type: 'PDF', category: 'Finance', date: '2025-04-01' },
    { id: 5, name: 'Leave Policy', type: 'PDF', category: 'Policy', date: '2025-01-15' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <FolderOpen className="h-7 w-7 text-primary" />
            Documents
          </h1>
          <p className="page-description">Access company policies and personal documents</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Documents</CardTitle>
          <CardDescription>Policies, handbooks, and guidelines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.category} • {doc.type} • {doc.date}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
