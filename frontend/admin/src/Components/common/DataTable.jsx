import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from '@tanstack/react-table';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/Components/ui/table.jsx';
import { Skeleton } from '@/Components/ui/skeleton.jsx';

/**
 * 공통 데이터 테이블 컴포넌트
 *
 * @tanstack/react-table 기반 재사용 가능한 테이블.
 * Shadcn/ui Table 컴포넌트로 스타일링한다.
 *
 * @param {Array} columns - @tanstack/react-table 컬럼 정의 배열
 * @param {Array} data - 테이블에 표시할 데이터 배열
 * @param {boolean} isLoading - 로딩 상태 여부
 * @param {string} emptyMessage - 데이터 없을 때 표시할 메시지
 * @param {Function} onRowClick - 행 클릭 핸들러 (선택)
 * @param {Array<string|{width: string, align: string}>} colWidths - 컬럼 너비/정렬 배열
 *   문자열이면 너비만 적용, 객체이면 { width, align } 지정 가능 (align 기본값: 'left')
 */
export function DataTable({
    columns,
    data,
    isLoading = false,
    emptyMessage = '데이터가 없습니다',
    onRowClick,
    colWidths,
}) {
    // colWidths 항목을 { width, align } 객체로 정규화
    const colDefs = colWidths?.map((col) =>
        typeof col === 'string' ? { width: col } : col,
    );

    const alignClass = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
    };

    const table = useReactTable({
        data: data || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    // 로딩 상태: Skeleton 행 표시
    if (isLoading) {
        return (
            <Table className="dataTable">
                {colDefs && (
                    <colgroup>
                        {colDefs.map((col, i) => (
                            <col key={i} style={{ width: col.width }} />
                        ))}
                    </colgroup>
                )}
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header, i) => (
                                <TableHead key={header.id}>
                                    <div
                                        className={`flex ${alignClass[colDefs?.[i]?.align] || 'justify-start'}`}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext(),
                                              )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 1 }).map((_, i) => (
                        <TableRow key={`skeleton-${i}`}>
                            {columns.map((_, j) => (
                                <TableCell key={`skeleton-cell-${i}-${j}`}>
                                    <div
                                        className={`flex ${alignClass[colDefs?.[j]?.align] || 'justify-start'}`}
                                    >
                                        <Skeleton className="h-5 w-full" />
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    return (
        <Table className="dataTable">
            {colDefs && (
                <colgroup>
                    {colDefs.map((col, i) => (
                        <col key={i} style={{ width: col.width }} />
                    ))}
                </colgroup>
            )}
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header, i) => (
                            <TableHead key={header.id}>
                                <div
                                    className={`flex ${alignClass[colDefs?.[i]?.align] || 'justify-start'}`}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                          )}
                                </div>
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow
                            key={row.id}
                            onClick={() => onRowClick?.(row.original)}
                            className={onRowClick ? 'cursor-pointer' : ''}
                        >
                            {row.getVisibleCells().map((cell, i) => (
                                <TableCell key={cell.id}>
                                    <div
                                        className={`flex ${alignClass[colDefs?.[i]?.align] || 'justify-start'}`}
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                        )}
                                    </div>
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center text-muted-foreground"
                        >
                            {emptyMessage}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
