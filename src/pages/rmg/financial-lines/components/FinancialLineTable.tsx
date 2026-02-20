import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { FinancialLine } from '@/types/financialLine';
import { useFinancialLineStore } from '@/store/financialLineStore';
import { format } from 'date-fns';

interface FinancialLineTableProps {
  data: FinancialLine[];
  loading: boolean;
}

export function FinancialLineTable({ data, loading }: FinancialLineTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFL, setSelectedFL] = useState<FinancialLine | null>(null);
  const { deleteFL, fetchFLs } = useFinancialLineStore();

  const handleDeleteClick = (fl: FinancialLine) => {
    setSelectedFL(fl);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedFL) {
      await deleteFL(selectedFL._id);
      setIsDeleteOpen(false);
      setSelectedFL(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Draft':
        return 'secondary';
      case 'On Hold':
        return 'outline';
      case 'Closed':
        return 'destructive';
      case 'Completed':
        return 'default';
      default:
        return 'outline';
    }
  };

  const columns: ColumnDef<FinancialLine>[] = [
    {
      accessorKey: 'flNo',
      header: 'FL No',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('flNo')}</div>
      ),
    },
    {
      accessorKey: 'flName',
      header: 'FL Name',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">{row.getValue('flName')}</div>
      ),
    },
    {
      accessorKey: 'projectId',
      header: 'Project',
      cell: ({ row }) => {
        const project = row.original.projectId;
        if (typeof project === 'object' && project !== null) {
          return <div>{project.projectName}</div>;
        }
        return <div>-</div>;
      },
    },
    {
      accessorKey: 'contractType',
      header: 'Contract Type',
    },
    {
      accessorKey: 'locationType',
      header: 'Location',
    },
    {
      accessorKey: 'scheduleStart',
      header: 'Start Date',
      cell: ({ row }) => {
        const date = row.getValue('scheduleStart') as string;
        return <div>{format(new Date(date), 'MMM dd, yyyy')}</div>;
      },
    },
    {
      accessorKey: 'scheduleEnd',
      header: 'End Date',
      cell: ({ row }) => {
        const date = row.getValue('scheduleEnd') as string;
        return <div>{format(new Date(date), 'MMM dd, yyyy')}</div>;
      },
    },
    {
      accessorKey: 'unitRate',
      header: 'Unit Rate',
      cell: ({ row }) => {
        const rate = row.getValue('unitRate') as number;
        const currency = row.original.currency;
        return <div className="font-medium">{currency} {rate.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: 'fundingUnits',
      header: 'Total Units',
      cell: ({ row }) => {
        const units = row.getValue('fundingUnits') as number;
        const uom = row.original.unitUOM;
        return <div>{units.toLocaleString()} {uom}s</div>;
      },
    },
    {
      accessorKey: 'fundingValue',
      header: 'Funding Value',
      cell: ({ row }) => {
        const value = row.getValue('fundingValue') as number;
        const currency = row.original.currency;
        return (
          <div className="font-semibold">
            {currency} {value.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const fl = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(fl)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No financial lines found. Create your first FL to get started.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete FL "{selectedFL?.flNo}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
