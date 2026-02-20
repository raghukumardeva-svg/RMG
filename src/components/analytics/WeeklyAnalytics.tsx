import { useState, useEffect, useMemo } from 'react';
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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Calendar, Clock, TrendingUp, TrendingDown, Activity, Download, FileDown, FileSpreadsheet } from 'lucide-react';
import { analyticsService, type WeeklyPatternData } from '@/services/analyticsService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

export function WeeklyAnalytics() {
  const [data, setData] = useState<WeeklyPatternData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [category, setCategory] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        startDate: dateFrom,
        endDate: dateTo
      };
      
      if (category && category !== 'all') params.category = category;
      if (priority && priority !== 'all') params.priority = priority;

      const result = await analyticsService.getWeeklyPattern(params);
      setData(result);
    } catch (error) {
      console.error('Error fetching weekly pattern:', error);
      toast.error('Failed to load weekly analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = {
        startDate: dateFrom,
        endDate: dateTo
      };
      
      if (category && category !== 'all') params.category = category;
      if (priority && priority !== 'all') params.priority = priority;

      const blob = await analyticsService.exportWeeklyPattern(params);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weekly-analytics-${dateFrom}-to-${dateTo}.csv`;
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
        ['Weekly Pattern Analytics Report'],
        [`Date Range: ${dateFrom} - ${dateTo}`],
        [],
        ['Summary'],
        ['Total Tickets Created', data.summary.totalCreated],
        ['Total Tickets Resolved', data.summary.totalResolved],
        ['Avg Response Time (hrs)', data.summary.avgResponseTime],
        ['Avg Resolution Time (hrs)', data.summary.avgResolutionTime],
        ['Busiest Day', data.summary.busiestDay],
        ['Peak Hour', data.summary.peakHour],
        ['Peak Hour Tickets', data.summary.peakHourTickets]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Daily breakdown sheet
      const dailyData = [
        ['Day', 'Created', 'Resolved', 'Avg Response Time (hrs)', 'Avg Resolution Time (hrs)'],
        ...data.dailyPattern.map(d => [
          d.day,
          d.created,
          d.resolved,
          d.avgResponseTime.toFixed(2),
          d.avgResolutionTime.toFixed(2)
        ])
      ];
      
      const dailyWs = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, dailyWs, 'Daily Breakdown');
      
      XLSX.writeFile(wb, `weekly-analytics-${dateFrom}-to-${dateTo}.xlsx`);
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
      doc.text('Weekly Pattern Analytics Report', pageWidth / 2, 20, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Period - compact spacing
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Date Range: ${dateFrom} to ${dateTo}`, 14, 36);
      doc.setFont('helvetica', 'normal');
      
      // Summary section - reduced spacing
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 44);
      doc.setFont('helvetica', 'normal');
      
      const summaryData = [
        ['Total Tickets Created', data.summary.totalCreated.toString()],
        ['Total Tickets Resolved', data.summary.totalResolved.toString()],
        ['Avg Response Time (hrs)', data.summary.avgResponseTime.toFixed(2)],
        ['Avg Resolution Time (hrs)', data.summary.avgResolutionTime.toFixed(2)],
        ['Busiest Day', data.summary.busiestDay],
        ['Peak Hour', data.summary.peakHour],
        ['Peak Hour Tickets', data.summary.peakHourTickets.toString()]
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
      
      // Daily breakdown section
      let finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 48;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Daily Breakdown', 14, finalY + 8);
      doc.setFont('helvetica', 'normal');
      
      const dailyData = data.dailyPattern.map(d => [
        d.day,
        d.created.toString(),
        d.resolved.toString(),
        d.avgResponseTime.toFixed(2),
        d.avgResolutionTime.toFixed(2)
      ]);
      
      autoTable(doc, {
        startY: finalY + 12,
        head: [['Day', 'Created', 'Resolved', 'Avg Response (hrs)', 'Avg Resolution (hrs)']],
        body: dailyData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 }
      });
      
      // Capture Charts - Full width layout
      finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 48;
      
      // Add new page for charts
      doc.addPage();
      
      // Charts header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Charts & Visualizations', 14, 15);
      doc.setFont('helvetica', 'normal');
      
      let chartY = 20;
      const chartWidth = pageWidth - 28; // Full width with margins
      
      // Capture Daily Pattern Chart (full width)
      const dailyChart = document.querySelector('[data-chart="daily-pattern"]');
      if (dailyChart) {
        const canvas = await html2canvas(dailyChart as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 1.5
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * chartWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 14, chartY, chartWidth, imgHeight);
        chartY += imgHeight + 8;
      }
      
      // Check if we need a new page for the next chart
      if (chartY > pageHeight - 80) {
        doc.addPage();
        chartY = 20;
      }
      
      // Capture Hourly Pattern Chart (full width)
      const hourlyChart = document.querySelector('[data-chart="hourly-pattern"]');
      if (hourlyChart) {
        const canvas = await html2canvas(hourlyChart as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 1.5
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * chartWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 14, chartY, chartWidth, imgHeight);
      }

      // Add footer with generation date and page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount} | Generated: ${new Date().toLocaleString()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      doc.save(`weekly-analytics-${dateFrom}-to-${dateTo}.pdf`);
      toast.success('PDF report exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, category, priority]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data) return [];
    
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return dayOrder.map(day => {
      const dayData = data.dailyPattern.find(d => d.day === day);
      return {
        day: day.substring(0, 3), // Mon, Tue, etc.
        created: dayData?.created || 0,
        resolved: dayData?.resolved || 0,
        avgResponseTime: dayData?.avgResponseTime || 0,
        avgResolutionTime: dayData?.avgResolutionTime || 0
      };
    });
  }, [data]);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!data) return [];
    
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      const row: Record<string, string | number> = { hour: `${hour.toString().padStart(2, '0')}:00` };
      dayOrder.forEach(day => {
        row[day] = data.hourlyPattern[hour]?.[day] || 0;
      });
      return row;
    });
  }, [data]);

  const maxHeatmapValue = useMemo(() => {
    if (!data) return 0;
    return Math.max(
      ...Object.values(data.hourlyPattern).flatMap(hourData =>
        Object.values(hourData).map(val => Number(val))
      )
    );
  }, [data]);

  const getHeatmapColor = (value: number) => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = value / maxHeatmapValue;
    if (intensity < 0.2) return 'bg-blue-200 dark:bg-blue-900/40';
    if (intensity < 0.4) return 'bg-blue-300 dark:bg-blue-800/60';
    if (intensity < 0.6) return 'bg-blue-400 dark:bg-blue-700/70';
    if (intensity < 0.8) return 'bg-blue-500 dark:bg-blue-600/80';
    return 'bg-blue-600 dark:bg-blue-500';
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-brand-navy dark:text-gray-100">Weekly Pattern Analytics</h2>
          <p className="text-muted-foreground mt-1">Analyze ticket patterns and trends over time</p>
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
            <DateRangePicker
              fromDate={dateFrom}
              toDate={dateTo}
              onFromDateChange={setDateFrom}
              onToDateChange={setDateTo}
              onClear={() => {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                setDateFrom(date.toISOString().split('T')[0]);
                setDateTo(new Date().toISOString().split('T')[0]);
              }}
              placeholder="Select date range"
              className="w-[320px]"
            />
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Hardware Issue">Hardware Issue</SelectItem>
                <SelectItem value="Software Issue">Software Issue</SelectItem>
                <SelectItem value="Network Issue">Network Issue</SelectItem>
                <SelectItem value="Access Request">Access Request</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            {(category !== 'all' || priority !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCategory('all');
                  setPriority('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busiest Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-navy dark:text-gray-100">{data.summary.busiestDay}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.dailyPattern.find(d => d.day === data.summary.busiestDay)?.created} tickets created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-navy dark:text-gray-100">{data.summary.peakHour}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.summary.peakHourTickets} tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-navy dark:text-gray-100">
              {formatHours(data.summary.avgResponseTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Time to first assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-navy dark:text-gray-100">
              {formatHours(data.summary.avgResolutionTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Time to close ticket
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Week-over-Week Comparison */}
      {data.comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Week-over-Week Comparison</CardTitle>
            <CardDescription>Compare current week with previous week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Tickets Created</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{data.comparison.ticketsCreated.current}</span>
                    <div className="flex items-center gap-1 text-xs">
                      {data.comparison.ticketsCreated.change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : data.comparison.ticketsCreated.change < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-500" />
                      )}
                      <span className={cn(
                        data.comparison.ticketsCreated.change > 0 ? "text-green-600" :
                        data.comparison.ticketsCreated.change < 0 ? "text-red-600" :
                        "text-gray-600"
                      )}>
                        {Math.abs(data.comparison.ticketsCreated.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground px-3">
                  Previous week: {data.comparison.ticketsCreated.previous}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Tickets Resolved</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{data.comparison.ticketsResolved.current}</span>
                    <div className="flex items-center gap-1 text-xs">
                      {data.comparison.ticketsResolved.change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : data.comparison.ticketsResolved.change < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-500" />
                      )}
                      <span className={cn(
                        data.comparison.ticketsResolved.change > 0 ? "text-green-600" :
                        data.comparison.ticketsResolved.change < 0 ? "text-red-600" :
                        "text-gray-600"
                      )}>
                        {Math.abs(data.comparison.ticketsResolved.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground px-3">
                  Previous week: {data.comparison.ticketsResolved.previous}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Avg Response Time</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{data.comparison.avgResponseTime.current}h</span>
                    <div className="flex items-center gap-1 text-xs">
                      {data.comparison.avgResponseTime.change < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : data.comparison.avgResponseTime.change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-500" />
                      )}
                      <span className={cn(
                        data.comparison.avgResponseTime.change < 0 ? "text-green-600" :
                        data.comparison.avgResponseTime.change > 0 ? "text-red-600" :
                        "text-gray-600"
                      )}>
                        {Math.abs(data.comparison.avgResponseTime.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground px-3">
                  Previous week: {data.comparison.avgResponseTime.previous}h
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Avg Resolution Time</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{data.comparison.avgResolutionTime.current}h</span>
                    <div className="flex items-center gap-1 text-xs">
                      {data.comparison.avgResolutionTime.change < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : data.comparison.avgResolutionTime.change > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-500" />
                      )}
                      <span className={cn(
                        data.comparison.avgResolutionTime.change < 0 ? "text-green-600" :
                        data.comparison.avgResolutionTime.change > 0 ? "text-red-600" :
                        "text-gray-600"
                      )}>
                        {Math.abs(data.comparison.avgResolutionTime.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground px-3">
                  Previous week: {data.comparison.avgResolutionTime.previous}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Volume Chart */}
      <Card data-chart="daily-pattern">
        <CardHeader>
          <CardTitle>Daily Ticket Volume</CardTitle>
          <CardDescription>Tickets created and resolved per day of the week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="created" fill="#3b82f6" name="Created" />
              <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hourly Heatmap */}
      <Card data-chart="hourly-pattern">
        <CardHeader>
          <CardTitle>Hourly Pattern Heatmap</CardTitle>
          <CardDescription>Ticket creation patterns by hour and day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-8 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
                {/* Header row */}
                <div className="bg-white dark:bg-gray-800 p-2 text-xs font-semibold text-center">
                  Hour
                </div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="bg-white dark:bg-gray-800 p-2 text-xs font-semibold text-center">
                    {day}
                  </div>
                ))}
                
                {/* Data rows */}
                {heatmapData.map((row) => (
                  <>
                    <div key={`${row.hour}-label`} className="bg-white dark:bg-gray-800 p-2 text-xs text-center font-medium">
                      {row.hour}
                    </div>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <div
                        key={`${row.hour}-${day}`}
                        className={cn(
                          'p-2 text-xs text-center font-medium transition-colors',
                          getHeatmapColor(Number(row[day]))
                        )}
                        title={`${day} ${row.hour}: ${row[day]} tickets`}
                      >
                        {row[day] || ''}
                      </div>
                    ))}
                  </>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-xs text-muted-foreground">Less</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800"></div>
                  <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900/40"></div>
                  <div className="w-4 h-4 bg-blue-300 dark:bg-blue-800/60"></div>
                  <div className="w-4 h-4 bg-blue-400 dark:bg-blue-700/70"></div>
                  <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600/80"></div>
                  <div className="w-4 h-4 bg-blue-600 dark:bg-blue-500"></div>
                </div>
                <span className="text-xs text-muted-foreground">More</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
