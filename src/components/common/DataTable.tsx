import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRestore?: (item: T) => void;
  /** Quando true, oculta editar/excluir e exibe restaurar (se onRestore definido). */
  isRowInactive?: (item: T) => boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  getRowId?: (item: T, index: number) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  onRestore,
  isRowInactive,
  isLoading,
  emptyMessage = 'Nenhum registro encontrado',
  getRowId = (item, index) => item.id ?? index,
}: DataTableProps<T>) {
  const showActions = onView || onEdit || onDelete || onRestore;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col, idx) => (
                <TableHead key={idx} className="font-semibold">
                  {col.label}
                </TableHead>
              ))}
              {showActions && (
                <TableHead className="font-semibold text-right">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, idx) => (
              <TableRow key={idx}>
                {columns.map((_, colIdx) => (
                  <TableCell key={colIdx}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell>
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col, idx) => (
                <TableHead key={idx} className="font-semibold">
                  {col.label}
                </TableHead>
              ))}
              {showActions && (
                <TableHead className="font-semibold text-right">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIdx) => (
                <TableRow key={getRowId(item, rowIdx)} className="hover:bg-muted/30">
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx}>
                      {col.render
                        ? col.render(item)
                        : String(item[col.key] ?? '-')}
                    </TableCell>
                  ))}
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(item)}
                            className="h-8 w-8 text-info hover:text-info hover:bg-info/10"
                            aria-label="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {isRowInactive?.(item) ? (
                          onRestore && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRestore(item)}
                              className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                              aria-label="Restaurar"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )
                        ) : (
                          <>
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(item)}
                                className="h-8 w-8 text-warning hover:text-warning hover:bg-warning/10"
                                aria-label="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(item)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                aria-label="Deletar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
