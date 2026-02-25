import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import employeeHoursReportService from "@/services/employeeHoursReportService";
import type { ReportSummary } from "@/services/employeeHoursReportService";

const COLORS = {
  billable: "#10b981",
  nonBillable: "#f59e42",
  allocation: "#3B82F6",
  approved: "#22c55e",
  approvedNonBillable: "#f97316",
  allocated: "#6366f1",
  actual: "#0ea5e9",
};

export default function EmployeeHoursReport() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const response = await employeeHoursReportService.getReport({
          role: "EMPLOYEE",
          month,
        });
        setSummary(response.summary);
      } catch (err) {
        setError("Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare chart data for recharts
  const pieData = summary
    ? [
        {
          name: "Billable Hours",
          value: summary.totalActualBillableHours,
          color: COLORS.billable,
        },
        {
          name: "Non-Billable Hours",
          value: summary.totalActualNonBillableHours,
          color: COLORS.nonBillable,
        },
        {
          name: "Allocation Hours",
          value: summary.totalAllocationHours,
          color: COLORS.allocation,
        },
      ]
    : [];

  const approvedPieData = summary
    ? [
        {
          name: "Billable Approved",
          value: summary.totalBillableApprovedHours,
          color: COLORS.approved,
        },
        {
          name: "Non-Billable Approved",
          value: summary.totalNonBillableApprovedHours,
          color: COLORS.approvedNonBillable,
        },
      ]
    : [];

  const allocationVsActualPieData = summary
    ? [
        {
          name: "Allocated Hours",
          value: summary.totalAllocationHours,
          color: COLORS.allocated,
        },
        {
          name: "Actual Hours",
          value: summary.totalActualHours,
          color: COLORS.actual,
        },
      ]
    : [];

  return (
    <div className="p-6 max-w-6xl mx-auto mt-8 space-y-8">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Allocation Hours Report</h2>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : summary ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} hrs`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-xs text-green-600 font-medium">
                  Billable Hours
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {summary.totalActualBillableHours}
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-xs text-orange-600 font-medium">
                  Non-Billable Hours
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {summary.totalActualNonBillableHours}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600 font-medium">
                  Allocation Hours
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {summary.totalAllocationHours}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-600 font-medium">
                  Total Hours
                </div>
                <div className="text-2xl font-bold text-slate-700">
                  {summary.totalActualHours}
                </div>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg">
                <div className="text-xs text-teal-600 font-medium">
                  Approved Hours
                </div>
                <div className="text-2xl font-bold text-teal-700">
                  {summary.totalApprovedHours}
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-xs text-yellow-600 font-medium">
                  Pending Hours
                </div>
                <div className="text-2xl font-bold text-yellow-700">
                  {summary.totalPendingApprovedHours}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">No data available.</div>
        )}
      </Card>

      {/* New Chart: Billable vs Non-Billable Approved Hours */}
      {summary && (
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">
            Approved Hours Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={approvedPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {approvedPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} hrs`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* New Chart: Allocation vs Actual Hours */}
      {summary && (
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Allocation vs Actual Hours</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationVsActualPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationVsActualPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} hrs`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
