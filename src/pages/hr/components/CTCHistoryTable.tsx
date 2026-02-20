import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CTCHistory, Currency, UOM } from "@/types/ctc";

interface CTCHistoryTableProps {
  readonly history: CTCHistory[];
  readonly onChange: (history: CTCHistory[]) => void;
}

export function CTCHistoryTable({ history, onChange }: CTCHistoryTableProps) {
  const [rows, setRows] = useState<CTCHistory[]>(
    history.length > 0 ? history : [],
  );

  const addRow = () => {
    const newRow: CTCHistory = {
      actualCTC: 0,
      fromDate: "",
      toDate: "",
      currency: "INR",
      uom: "Annual",
    };
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    onChange(updatedRows);
  };

  const deleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
    onChange(updatedRows);
  };

  const updateRow = (
    index: number,
    field: keyof CTCHistory,
    value: string | number,
  ) => {
    const updatedRows = rows.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setRows(updatedRows);
    onChange(updatedRows);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">CTC History</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          className="h-8"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border rounded-md">
          No CTC history records. Click "Add Row" to create one.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px] flex-1">
                  Actual CTC
                </TableHead>
                <TableHead className="min-w-[120px] flex-1">
                  From Date
                </TableHead>
                <TableHead className="min-w-[120px] flex-1">To Date</TableHead>
                <TableHead className="min-w-[100px] w-[120px]">
                  Currency
                </TableHead>
                <TableHead className="min-w-[100px] w-[100px]">UOM</TableHead>
                <TableHead className="w-[80px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${row.fromDate}-${row.toDate}-${index}`}>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.actualCTC}
                      onChange={(e) =>
                        updateRow(
                          index,
                          "actualCTC",
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={row.fromDate}
                      onChange={(e) =>
                        updateRow(index, "fromDate", e.target.value)
                      }
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={row.toDate}
                      onChange={(e) =>
                        updateRow(index, "toDate", e.target.value)
                      }
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.currency}
                      onValueChange={(value) =>
                        updateRow(index, "currency", value as Currency)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.uom}
                      onValueChange={(value) =>
                        updateRow(index, "uom", value as UOM)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Annual">Annual</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRow(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
