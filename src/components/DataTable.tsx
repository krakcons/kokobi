import { Header, Row, Table as TanstackTable } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/locale";
import { Input } from "@/components/ui/input";
import { Column } from "@tanstack/react-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { z } from "zod";
import {
	MoreHorizontal,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUpDown,
	ArrowDown,
	ArrowUp,
	EyeOff,
	Download,
} from "lucide-react";

export const TableSearchSchema = z.object({
	globalFilter: z.string().optional(),
	pagination: z
		.object({
			pageIndex: z.number().default(0),
			pageSize: z.number().default(10),
		})
		.optional(),
	sorting: z
		.array(z.object({ id: z.string(), desc: z.boolean() }))
		.optional(),
});
export type TableParams = z.infer<typeof TableSearchSchema>;

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	onRowClick?: (row: TData) => void;
	search: TableParams;
	onSearchChange: (search: TableParams) => void;
}

export const getHeaderNames = (headers: Header<any, unknown>[]): string[] =>
	headers.map((header) => {
		if (typeof header.column.columnDef.header === "function") {
			const headerContext = header.column.columnDef.header(
				header.getContext(),
			);
			if (typeof headerContext === "string") {
				return headerContext;
			}
			return headerContext.props.title;
		} else {
			return header.column.columnDef.header ?? header.id;
		}
	});

const getRowsData = (rows: Row<any>[]): string[][] => {
	return rows.map((row: Row<any>) => {
		const cells = row.getAllCells();
		const cellsContent = cells
			.filter((x) => x.column.getIsVisible())
			.map((x) => (x.getValue() ? (x.getValue() as string) : ""));
		return cellsContent;
	});
};

const escapeCsvValue = (value: string) => {
	if (value === null || value === undefined) return "";
	const stringValue = String(value);
	if (
		stringValue.includes(",") ||
		stringValue.includes('"') ||
		stringValue.includes("\n")
	) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}
	return stringValue;
};

const getCsvBlob = (
	headers: Header<any, unknown>[],

	rows: Row<any>[],
): Blob => {
	let csvContent = "";
	const headerNames = getHeaderNames(headers).filter(
		(h) => !["Actions", "Actes"].includes(h),
	);
	csvContent += headerNames.join(",") + "\n";

	const data = getRowsData(rows);
	data.forEach((row) => {
		const escapedRow = row.slice(0, headerNames.length).map(escapeCsvValue);
		csvContent += escapedRow.join(",") + "\n";
	});

	return new Blob([csvContent], { type: "text/csv" });
};

const exportToCsv = (
	fileName = "data",
	headers: Header<any, unknown>[],
	rows: Row<any>[],
): void => {
	const blob = getCsvBlob(headers, rows);
	const link = document.createElement("a");
	const url = window.URL.createObjectURL(blob);
	link.href = url;
	link.setAttribute("download", fileName);
	document.body.appendChild(link);
	link.click();
	link.remove();
};

export function DataTable<TData, TValue>({
	columns,
	data,
	onRowClick,
	search,
	onSearchChange,
}: DataTableProps<TData, TValue>) {
	const t = useTranslations("Table");

	const {
		pagination = { pageIndex: 0, pageSize: 10 },
		sorting = [],
		globalFilter = "",
	} = search;

	const table = useReactTable({
		data,
		columns,
		onPaginationChange: (updater) => {
			const newPagination =
				typeof updater === "function" ? updater(pagination) : updater;
			if (
				pagination.pageIndex === newPagination.pageIndex &&
				pagination.pageSize === newPagination.pageSize
			) {
				return;
			}
			onSearchChange({
				...search,
				pagination: newPagination,
			});
		},
		onSortingChange: (updater) => {
			const newSorting =
				typeof updater === "function" ? updater(sorting) : updater;
			if (
				sorting.length === newSorting.length &&
				sorting.every(
					(s, i) =>
						s.id === newSorting[i]?.id &&
						s.desc === newSorting[i]?.desc,
				)
			) {
				return;
			}
			onSearchChange({
				...search,
				sorting: newSorting,
				pagination: {
					...pagination,
					pageIndex: 0,
				},
			});
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onGlobalFilterChange: (updater) => {
			const newGlobalFilter =
				typeof updater === "function" ? updater(globalFilter) : updater;
			if (globalFilter === newGlobalFilter) {
				return;
			}
			onSearchChange({
				...search,
				globalFilter: newGlobalFilter,
			});
		},
		getFilteredRowModel: getFilteredRowModel(),
		autoResetPageIndex: false,
		state: {
			sorting,
			pagination,
			globalFilter,
		},
	});

	return (
		<div className="w-[calc(100vw-32px)] rounded-md sm:w-full">
			<div className="flex items-center pb-4 gap-2 justify-between">
				<Input
					placeholder={t.filter}
					defaultValue={globalFilter}
					onChange={(event) =>
						table.setGlobalFilter(event.target.value)
					}
					className="max-w-sm"
				/>
				<Button
					variant="outline"
					onClick={() =>
						exportToCsv(
							"users.csv",
							table
								.getHeaderGroups()
								.map((x) => x.headers)
								.flat(),
							table.getRowModel().rows,
						)
					}
				>
					<Download size={18} />
					Export
				</Button>
			</div>
			<ScrollArea>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="p-4">
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody className="px-2">
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && "selected"
									}
									onClick={() => {
										if (onRowClick) {
											onRowClick(row.original);
										}
									}}
									className={cn(
										onRowClick && "cursor-pointer",
									)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									{t.empty}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
			<div className="p-2">
				<DataTablePagination table={table} />
			</div>
		</div>
	);
}

interface DataTablePaginationProps<TData> {
	table: TanstackTable<TData>;
}

export function DataTablePagination<TData>({
	table,
}: DataTablePaginationProps<TData>) {
	const t = useTranslations("Table");
	return (
		<div className="flex items-center justify-end px-2">
			{/* <div className="flex-1 text-sm text-muted-foreground">
				{table.getFilteredSelectedRowModel().rows.length} of{" "}
				{table.getFilteredRowModel().rows.length} row(s) selected.
			</div> */}
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<p className="hidden text-sm font-medium sm:block">
						{t.rowsPerPage}
					</p>
					<Select
						value={`${table.getState().pagination.pageSize}`}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue
								placeholder={
									table.getState().pagination.pageSize
								}
							/>
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<SelectItem
									key={pageSize}
									value={`${pageSize}`}
								>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center justify-center text-sm font-medium sm:block">
						{`${t.page} ${table.getState().pagination.pageIndex + 1} ${t.of} ${table.getPageCount()}`}
					</div>
					<div className="flex items-center gap-1">
						<Button
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">{t.goToFirstPage}</span>
							<ChevronsLeft />
						</Button>
						<Button
							className="h-8 w-8 p-0"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">
								{t.goToPreviousPage}
							</span>
							<ChevronLeft />
						</Button>
						<Button
							className="h-8 w-8 p-0"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">{t.goToNextPage}</span>
							<ChevronRight />
						</Button>
						<Button
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() =>
								table.setPageIndex(table.getPageCount() - 1)
							}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">{t.goToLastPage}</span>
							<ChevronsRight />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

interface DataTableColumnHeaderProps<TData, TValue>
	extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>;
	title: string;
}

export function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	className,
}: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>;
	}
	const t = useTranslations("Table");

	return (
		<div className={cn("flex items-center space-x-2", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="-ml-3 h-8 data-[state=open]:bg-accent"
					>
						<span className="text-sm">{title}</span>
						{column.getIsSorted() === "desc" ? (
							<ArrowDown />
						) : column.getIsSorted() === "asc" ? (
							<ArrowUp />
						) : (
							<ChevronsUpDown />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuItem
						onClick={() => column.toggleSorting(false)}
					>
						<ArrowUp className="h-3.5 w-3.5 text-muted-foreground/70" />
						{t.sort.asc}
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => column.toggleSorting(true)}
					>
						<ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70" />
						{t.sort.desc}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => column.toggleVisibility(false)}
					>
						<EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
						{t.sort.hide}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export const createDataTableActionsColumn = <TData extends object>(
	actions: {
		name: string;
		onClick: (data: TData) => void;
		visible?: (data: TData) => boolean;
	}[],
) => {
	const t = useTranslations("Actions");
	return {
		id: "actions",
		header: ({ column }: any) => (
			<DataTableColumnHeader title={t.title} column={column} />
		),
		cell: ({ cell }: any) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon">
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>{t.title}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{actions.map(
						(action) =>
							(!action.visible ||
								action.visible(cell.row.original)) && (
								<DropdownMenuItem
									key={action.name}
									onClick={() =>
										action.onClick(cell.row.original)
									}
								>
									{action.name}
								</DropdownMenuItem>
							),
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		),
	};
};
