import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import type { CustomerPO } from '@/types/customerPO';
import { useCustomerPOStore } from '@/store/customerPOStore';
import { CreateCustomerPODialog } from './CreateCustomerPODialog';
import { format } from 'date-fns';

interface CustomerPOTableProps {
  data: CustomerPO[];
  loading: boolean;
}

export function CustomerPOTable({ data, loading }: CustomerPOTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<CustomerPO | null>(null);
  const { deletePO, fetchPOs } = useCustomerPOStore();

  const handleEdit = (po: CustomerPO) => {
    setSelectedPO(po);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (po: CustomerPO) => {
    setSelectedPO(po);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedPO) {
      await deletePO(selectedPO._id);
      setIsDeleteOpen(false);
      setSelectedPO(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Closed':
        return 'secondary';
      case 'Expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const columns: ColumnDef<CustomerPO>[] = [
    {
      accessorKey: 'contractNo',
      header: 'Contract No',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('contractNo')}</div>
      ),
    },
    {
      accessorKey: 'poNo',
      header: 'PO No',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('poNo')}</div>
      ),
    },
    {
      accessorKey: 'customerId',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original.customerId;
        if (typeof customer === 'object' && customer !== null) {
          return <div>{customer.customerName}</div>;
        }
        return <div>-</div>;
      },
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
      accessorKey: 'bookingEntity',
      header: 'Booking Entity',
    },
    {
      accessorKey: 'poAmount',
      header: 'PO Amount',
      cell: ({ row }) => {
        const amount = row.getValue('poAmount') as number;
        const currency = row.original.poCurrency;
        return (
          <div className="font-medium">
            {currency} {amount.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'poValidityDate',
      header: 'Validity Date',
      cell: ({ row }) => {
        const date = row.getValue('poValidityDate') as string;
        return <div>{format(new Date(date), 'MMM dd, yyyy')}</div>;
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
        const po = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(po)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteClick(po)}
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
        No customer POs found. Create your first PO to get started.
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

      {selectedPO && (
        <CreateCustomerPODialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          po={selectedPO}
          onSuccess={() => {
            setIsEditOpen(false);
            setSelectedPO(null);
            fetchPOs();
          }}
        />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the PO "{selectedPO?.poNo}". This action cannot be undone.
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
