import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Download, 
  FileDown, 
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Users,
  BarChart3
} from 'lucide-react';
import { analyticsService, type MonthlyStatisticsData } from '@/services/analyticsService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6'];

const PRIORITY_COLORS = {
  'Low': '#10b981',
  'Medium': '#f59e0b',
  'High': '#f97316',
  'Critical': '#ef4444',
  'Urgent': '#dc2626'
};

const STATUS_COLORS = {
  'Open': '#3b82f6',
  'In Progress': '#f59e0b',
  'Pending': '#f97316',
  'Resolved': '#10b981',
  'Closed': '#6b7280',
  'Completed': '#059669',
  'Cancelled': '#ef4444'
};

export function MonthlyStatistics() {
  const [data, setData] = useState<MonthlyStatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [category, setCategory] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {
          year: selectedYear,
          month: selectedMonth
        };
        
        if (category && category !== 'all') params.category = category;
        if (priority && priority !== 'all') params.priority = priority;

        const result = await analyticsService.getMonthlyStatistics(params);
        setData(result);
      } catch (error) {
        console.error('Error fetching monthly statistics:', error);
        toast.error('Failed to load monthly statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth, category, priority]);

  const handleClearFilters = () => {
    setCategory('all');
    setPriority('all');
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    setIsExporting(true);
    try {
      let csv = `Monthly Statistics Report\n`;
      csv += `Period: ${data.period.monthName} ${data.period.year}\n\n`;
      
      csv += `Summary\n`;
      csv += `Total Tickets Created,${data.currentMonth.totalCreated}\n`;
      csv += `Total Tickets Resolved,${data.currentMonth.totalResolved}\n`;
      csv += `Open Tickets,${data.currentMonth.openTickets}\n`;
      csv += `Resolution Rate (%),${data.currentMonth.resolutionRate.toFixed(2)}\n`;
      csv += `Avg Response Time (hrs),${data.currentMonth.avgResponseTime.toFixed(2)}\n`;
      csv += `Avg Resolution Time (hrs),${data.currentMonth.avgResolutionTime.toFixed(2)}\n`;
      csv += `Reopened Tickets,${data.currentMonth.reopenedTickets}\n\n`;
      
      csv += `Month-over-Month Comparison\n`;
      csv += `Metric,Current,Previous,Change (%)\n`;
      csv += `Tickets Created,${data.monthOverMonth.ticketsCreated.current},${data.monthOverMonth.ticketsCreated.previous},${data.monthOverMonth.ticketsCreated.change.toFixed(2)}\n`;
      csv += `Tickets Resolved,${data.monthOverMonth.ticketsResolved.current},${data.monthOverMonth.ticketsResolved.previous},${data.monthOverMonth.ticketsResolved.change.toFixed(2)}\n`;
      csv += `Avg Resolution Time,${data.monthOverMonth.avgResolutionTime.current.toFixed(2)},${data.monthOverMonth.avgResolutionTime.previous.toFixed(2)},${data.monthOverMonth.avgResolutionTime.change.toFixed(2)}\n\n`;
      
      csv += `Agent Performance\n`;
      csv += `Agent,Tickets Handled,Tickets Resolved,Avg Resolution Time (hrs),Resolution Rate (%)\n`;
      data.agentPerformance.forEach(agent => {
        csv += `${agent.name},${agent.ticketsHandled},${agent.ticketsResolved},${agent.avgResolutionTime.toFixed(2)},${agent.resolutionRate.toFixed(2)}\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly-statistics-${data.period.year}-${String(data.period.month).padStart(2, '0')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV report exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;
    
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Monthly Statistics Report'],
        [`Period: ${data.period.monthName} ${data.period.year}`],
        [],
        ['Summary'],
        ['Total Tickets Created', data.currentMonth.totalCreated],
        ['Total Tickets Resolved', data.currentMonth.totalResolved],
        ['Open Tickets', data.currentMonth.openTickets],
        ['Resolution Rate (%)', data.currentMonth.resolutionRate.toFixed(2)],
        ['Avg Response Time (hrs)', data.currentMonth.avgResponseTime.toFixed(2)],
        ['Avg Resolution Time (hrs)', data.currentMonth.avgResolutionTime.toFixed(2)],
        ['Reopened Tickets', data.currentMonth.reopenedTickets]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Month-over-Month sheet
      const momData = [
        ['Month-over-Month Comparison'],
        [],
        ['Metric', 'Current', 'Previous', 'Change (%)'],
        ['Tickets Created', data.monthOverMonth.ticketsCreated.current, data.monthOverMonth.ticketsCreated.previous, data.monthOverMonth.ticketsCreated.change.toFixed(2)],
        ['Tickets Resolved', data.monthOverMonth.ticketsResolved.current, data.monthOverMonth.ticketsResolved.previous, data.monthOverMonth.ticketsResolved.change.toFixed(2)],
        ['Avg Resolution Time', data.monthOverMonth.avgResolutionTime.current.toFixed(2), data.monthOverMonth.avgResolutionTime.previous.toFixed(2), data.monthOverMonth.avgResolutionTime.change.toFixed(2)],
        ['Resolution Rate', data.monthOverMonth.resolutionRate.current.toFixed(2), data.monthOverMonth.resolutionRate.previous.toFixed(2), data.monthOverMonth.resolutionRate.change.toFixed(2)]
      ];
      
      const momWs = XLSX.utils.aoa_to_sheet(momData);
      XLSX.utils.book_append_sheet(wb, momWs, 'Month-over-Month');
      
      // Agent Performance sheet
      const agentData = [
        ['Agent Performance'],
        [],
        ['Agent', 'Tickets Handled', 'Tickets Resolved', 'Avg Resolution Time (hrs)', 'Resolution Rate (%)'],
        ...data.agentPerformance.map(agent => [
          agent.name,
          agent.ticketsHandled,
          agent.ticketsResolved,
          agent.avgResolutionTime.toFixed(2),
          agent.resolutionRate.toFixed(2)
        ])
      ];
      
      const agentWs = XLSX.utils.aoa_to_sheet(agentData);
      XLSX.utils.book_append_sheet(wb, agentWs, 'Agent Performance');
      
      // Daily Trend sheet
      const trendData = [
        ['Daily Trend'],
        [],
        ['Date', 'Created', 'Resolved'],
        ...data.dailyTrend.map(day => [day.date, day.created, day.resolved])
      ];
      
      const trendWs = XLSX.utils.aoa_to_sheet(trendData);
      XLSX.utils.book_append_sheet(wb, trendWs, 'Daily Trend');
      
      XLSX.writeFile(wb, `monthly-statistics-${data.period.year}-${String(data.period.month).padStart(2, '0')}.xlsx`);
      toast.success('Excel report exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!data) return;
    
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add Company Logo Header - Enhanced visibility
      doc.setFillColor(59, 130, 246); // Blue color
      doc.rect(0, 0, pageWidth, 28, 'F');
      
      // Company Name/Logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RMG PORTAL', pageWidth / 2, 12, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Monthly Statistics Report', pageWidth / 2, 20, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Period - compact spacing
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Period: ${data.period.monthName} ${data.period.year}`, 14, 36);
      doc.setFont('helvetica', 'normal');
      
      // Summary section - reduced spacing
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 44);
      doc.setFont('helvetica', 'normal');
      
      doc.setFontSize(10);
      const summaryData = [
        ['Total Tickets Created', data.currentMonth.totalCreated.toString()],
        ['Total Tickets Resolved', data.currentMonth.totalResolved.toString()],
        ['Open Tickets', data.currentMonth.openTickets.toString()],
        ['Resolution Rate (%)', data.currentMonth.resolutionRate.toFixed(2)],
        ['Avg Response Time (hrs)', data.currentMonth.avgResponseTime.toFixed(2)],
        ['Avg Resolution Time (hrs)', data.currentMonth.avgResolutionTime.toFixed(2)],
        ['Reopened Tickets', data.currentMonth.reopenedTickets.toString()]
      ];
      
      autoTable(doc, {
        startY: 48,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 80, halign: 'right' }
        },
        margin: { top: 48 }
      });
      
      // Month-over-Month comparison
      let finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 48;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Month-over-Month Comparison', 14, finalY + 8);
      doc.setFont('helvetica', 'normal');
      
      const momData = [
        ['Tickets Created', data.monthOverMonth.ticketsCreated.current.toString(), data.monthOverMonth.ticketsCreated.previous.toString(), data.monthOverMonth.ticketsCreated.change.toFixed(2) + '%'],
        ['Tickets Resolved', data.monthOverMonth.ticketsResolved.current.toString(), data.monthOverMonth.ticketsResolved.previous.toString(), data.monthOverMonth.ticketsResolved.change.toFixed(2) + '%'],
        ['Avg Resolution Time', data.monthOverMonth.avgResolutionTime.current.toFixed(2), data.monthOverMonth.avgResolutionTime.previous.toFixed(2), data.monthOverMonth.avgResolutionTime.change.toFixed(2) + '%'],
        ['Resolution Rate', data.monthOverMonth.resolutionRate.current.toFixed(2) + '%', data.monthOverMonth.resolutionRate.previous.toFixed(2) + '%', data.monthOverMonth.resolutionRate.change.toFixed(2) + '%']
      ];
      
      autoTable(doc, {
        startY: finalY + 12,
        head: [['Metric', 'Current', 'Previous', 'Change (%)']],
        body: momData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 }
      });
      
      // Capture Charts - Compact layout
      finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 48;
      
      // Add new page for charts
      doc.addPage();
      
      // Charts header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Charts & Visualizations', 14, 15);
      doc.setFont('helvetica', 'normal');
      
      let chartY = 20;
      const chartWidth = 85;
      const chartSpacing = 5;
      
      // Capture Daily Trend Chart (left)
      const trendChart = document.querySelector('[data-chart="daily-trend"]');
      if (trendChart) {
        const canvas = await html2canvas(trendChart as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 1.5
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * chartWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 14, chartY, chartWidth, imgHeight);
      }
      
      // Capture Category Distribution Chart (right)
      const categoryChart = document.querySelector('[data-chart="category-distribution"]');
      if (categoryChart) {
        const canvas = await html2canvas(categoryChart as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 1.5
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * chartWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', pageWidth - chartWidth - 14, chartY, chartWidth, imgHeight);
        chartY += imgHeight + chartSpacing;
      }
      
      // Capture Priority Distribution Chart (left)
      const priorityChart = document.querySelector('[data-chart="priority-distribution"]');
      if (priorityChart) {
        const canvas = await html2canvas(priorityChart as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 1.5
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * chartWidth) / canvas.width;
        
        if (chartY + imgHeight > pageHeight - 20) {
          doc.addPage();
          chartY = 20;
        }
        
        doc.addImage(imgData, 'PNG', 14, chartY, chartWidth, imgHeight);
      }
      
      // Capture Status Distribution Chart (right)
      const statusChart = document.querySelector('[data-chart="status-distribution"]');
      if (statusChart) {
        const canvas = await html2canvas(statusChart as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 1.5
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * chartWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', pageWidth - chartWidth - 14, chartY, chartWidth, imgHeight);
      }
      
      // Agent Performance (top 10) on new page
      doc.addPage();
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Agent Performance', 14, 15);
      doc.setFont('helvetica', 'normal');
      
      const agentData = data.agentPerformance.slice(0, 10).map(agent => [
        agent.name,
        agent.ticketsHandled.toString(),
        agent.ticketsResolved.toString(),
        agent.avgResolutionTime.toFixed(2),
        agent.resolutionRate.toFixed(2) + '%'
      ]);
      
      autoTable(doc, {
        startY: 20,
        head: [['Agent', 'Handled', 'Resolved', 'Avg Time (hrs)', 'Rate (%)']],
        body: agentData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 }
      });
      
      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      doc.save(`monthly-statistics-${data.period.year}-${String(data.period.month).padStart(2, '0')}.pdf`);
      toast.success('PDF report with charts exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year);
    }
    return years;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monthly Statistics</h2>
          <p className="text-muted-foreground">
            {data.period.monthName} {data.period.year}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={isExporting || isLoading}>
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileDown className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-32">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateYearOptions().map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Network">Network</SelectItem>
                  <SelectItem value="Access">Access</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(category !== 'all' || priority !== 'all') && (
              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Created</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentMonth.totalCreated}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getChangeIcon(data.monthOverMonth.ticketsCreated.change)}
              <span className={getChangeColor(data.monthOverMonth.ticketsCreated.change)}>
                {Math.abs(data.monthOverMonth.ticketsCreated.change).toFixed(1)}%
              </span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentMonth.totalResolved}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getChangeIcon(data.monthOverMonth.ticketsResolved.change)}
              <span className={getChangeColor(data.monthOverMonth.ticketsResolved.change)}>
                {Math.abs(data.monthOverMonth.ticketsResolved.change).toFixed(1)}%
              </span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentMonth.openTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.currentMonth.resolutionRate.toFixed(1)}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentMonth.avgResolutionTime.toFixed(1)}h</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getChangeIcon(-data.monthOverMonth.avgResolutionTime.change)}
              <span className={getChangeColor(-data.monthOverMonth.avgResolutionTime.change)}>
                {Math.abs(data.monthOverMonth.avgResolutionTime.change).toFixed(1)}%
              </span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Daily Trend + Category Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card data-chart="daily-trend">
          <CardHeader>
            <CardTitle>Daily Ticket Trend</CardTitle>
            <CardDescription>Created vs Resolved tickets per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyTrend}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="created" 
                  stroke="#3b82f6" 
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                  strokeWidth={2}
                  name="Created" 
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                  strokeWidth={2}
                  name="Resolved" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-chart="category-distribution">
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Tickets by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.categoryDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ paddingTop: '10px', bottom: '25px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Priority + Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card data-chart="priority-distribution">
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Tickets by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.priorityDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-chart="status-distribution">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current ticket status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agent Performance
          </CardTitle>
          <CardDescription>Top performing agents this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Agent</th>
                  <th className="text-right py-3 px-4 font-medium">Handled</th>
                  <th className="text-right py-3 px-4 font-medium">Resolved</th>
                  <th className="text-right py-3 px-4 font-medium">Avg Time (hrs)</th>
                  <th className="text-right py-3 px-4 font-medium">Resolution Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.agentPerformance.slice(0, 10).map((agent, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{agent.name}</td>
                    <td className="text-right py-3 px-4">{agent.ticketsHandled}</td>
                    <td className="text-right py-3 px-4">{agent.ticketsResolved}</td>
                    <td className="text-right py-3 px-4">{agent.avgResolutionTime.toFixed(2)}</td>
                    <td className="text-right py-3 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        agent.resolutionRate >= 80 ? "bg-green-100 text-green-800" :
                        agent.resolutionRate >= 60 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      )}>
                        {agent.resolutionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year Comparison</CardTitle>
          <CardDescription>Comparing {data.period.monthName} {data.period.year} vs {data.period.monthName} {data.period.year - 1}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Tickets Created</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{data.yearOverYear.ticketsCreated.current}</span>
                  <div className="flex items-center gap-1 text-xs">
                    {getChangeIcon(data.yearOverYear.ticketsCreated.change)}
                    <span className={getChangeColor(data.yearOverYear.ticketsCreated.change)}>
                      {Math.abs(data.yearOverYear.ticketsCreated.change).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground px-3">
                Last year: {data.yearOverYear.ticketsCreated.lastYear}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Tickets Resolved</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{data.yearOverYear.ticketsResolved.current}</span>
                  <div className="flex items-center gap-1 text-xs">
                    {getChangeIcon(data.yearOverYear.ticketsResolved.change)}
                    <span className={getChangeColor(data.yearOverYear.ticketsResolved.change)}>
                      {Math.abs(data.yearOverYear.ticketsResolved.change).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground px-3">
                Last year: {data.yearOverYear.ticketsResolved.lastYear}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
