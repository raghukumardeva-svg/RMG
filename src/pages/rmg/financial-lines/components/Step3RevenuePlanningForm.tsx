import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, InfoIcon } from 'lucide-react';
import type { FLRevenuePlanning, RevenuePlanning } from '@/types/financialLine';
import { format, eachMonthOfInterval, parseISO } from 'date-fns';

interface Step3FormProps {
  scheduleStart: string;
  scheduleEnd: string;
  unitRate: number;
  fundingValue: number;
  defaultValues?: Partial<FLRevenuePlanning>;
  onNext: (data: FLRevenuePlanning) => void;
  onBack: () => void;
}

export function Step3RevenuePlanningForm({
  scheduleStart,
  scheduleEnd,
  unitRate,
  fundingValue,
  defaultValues,
  onNext,
  onBack,
}: Step3FormProps) {
  const [revenuePlanning, setRevenuePlanning] = useState<RevenuePlanning[]>([]);

  useEffect(() => {
    if (defaultValues?.revenuePlanning && defaultValues.revenuePlanning.length > 0) {
      setRevenuePlanning(defaultValues.revenuePlanning);
    } else {
      // Generate monthly rows from scheduleStart to scheduleEnd
      const months = eachMonthOfInterval({
        start: parseISO(scheduleStart),
        end: parseISO(scheduleEnd),
      });

      const planning = months.map((date) => ({
        month: format(date, 'MMM yyyy'),
        plannedUnits: 0,
        plannedRevenue: 0,
        actualUnits: 0,
        forecastedUnits: 0,
        variance: 0,
      }));

      setRevenuePlanning(planning);
    }
  }, [scheduleStart, scheduleEnd, defaultValues]);

  const handlePlannedUnitsChange = (index: number, value: string) => {
    const units = parseFloat(value) || 0;
    const revenue = units * unitRate;
    
    setRevenuePlanning((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, plannedUnits: units, plannedRevenue: revenue }
          : item
      )
    );
  };

  const handleForecastedUnitsChange = (index: number, value: string) => {
    const units = parseFloat(value) || 0;
    const variance = units - revenuePlanning[index].plannedUnits;
    
    setRevenuePlanning((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, forecastedUnits: units, variance }
          : item
      )
    );
  };

  const totalPlannedRevenue = revenuePlanning.reduce(
    (sum, item) => sum + item.plannedRevenue,
    0
  );

  const exceedsFunding = totalPlannedRevenue > fundingValue;

  const handleNext = () => {
    onNext({ revenuePlanning });
  };

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <div className="flex justify-between">
            <span>Total Funding Value: <strong>{fundingValue.toLocaleString()}</strong></span>
            <span>Unit Rate: <strong>{unitRate}</strong></span>
          </div>
        </AlertDescription>
      </Alert>

      <div className="rounded-md border max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Planned Units</TableHead>
              <TableHead className="text-right">Planned Revenue</TableHead>
              <TableHead className="text-right">Forecasted Units</TableHead>
              <TableHead className="text-right">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenuePlanning.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.month}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.plannedUnits}
                    onChange={(e) => handlePlannedUnitsChange(index, e.target.value)}
                    className="text-right"
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.plannedRevenue.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.forecastedUnits}
                    onChange={(e) => handleForecastedUnitsChange(index, e.target.value)}
                    className="text-right"
                  />
                </TableCell>
                <TableCell className={`text-right ${item.variance < 0 ? 'text-destructive' : item.variance > 0 ? 'text-green-600' : ''}`}>
                  {item.variance.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                {revenuePlanning.reduce((sum, item) => sum + item.plannedUnits, 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {totalPlannedRevenue.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {revenuePlanning.reduce((sum, item) => sum + item.forecastedUnits, 0).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {revenuePlanning.reduce((sum, item) => sum + item.variance, 0).toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {exceedsFunding && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Total planned revenue ({totalPlannedRevenue.toLocaleString()}) exceeds funding value ({fundingValue.toLocaleString()})!
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={exceedsFunding}>
          Next
        </Button>
      </div>
    </div>
  );
}
