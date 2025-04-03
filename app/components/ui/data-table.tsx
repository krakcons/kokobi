"use client";

import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Sliders } from "lucide-react";
import React from "react";
import ExportCSVButton from "../ExportCSVButton";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	onRowClick?: (row: TData) => void;
	deleteMultiple?: (rows: TData[]) => void;
	deleteMultiplePending?: boolean;
}

const flattenObject = (obj: any, prefix = ""): Record<string, any> => {
	return Object.keys(obj).reduce(
		(acc, key) => {
			const prefixKey = prefix ? `${prefix}.${key}` : key;

			if (prefixKey === "data") {
				return acc;
			}

			if (
				obj[key] &&
				typeof obj[key] === "object" &&
				!Array.isArray(obj[key]) &&
				!(obj[key] instanceof Date)
			) {
				Object.assign(acc, flattenObject(obj[key], prefixKey));
			} else {
				acc[prefixKey] =
					obj[key] instanceof Date
						? obj[key].toISOString()
						: obj[key];
			}
			return acc;
		},
		{} as Record<string, any>
	);
};

export const DataTable = <TData, TValue>({
	columns,
	data,
	filter,
	onRowClick,
	name,
	deleteMultiple,
	deleteMultiplePending,
}: DataTableProps<TData, TValue> & {
	filter: {
		column: string;
		placeholder: string;
	};
	name: string;
}) => {
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({
			id: false,
		});
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [rowSelection, setRowSelection] = React.useState({});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			columnFilters,
			columnVisibility,
			sorting,
			rowSelection,
		},
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onRowSelectionChange: setRowSelection,
	});

	return (
		<div>
			<div className="flex items-center justify-between gap-3 pb-4">
				<Input
					placeholder={filter.placeholder}
					value={
						(table
							.getColumn(filter.column)
							?.getFilterValue() as string) ?? ""
					}
					onChange={(event) =>
						table
							.getColumn(filter.column)
							?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
				<div className="flex gap-3">
					{table.getFilteredSelectedRowModel().rows.length > 0 && (
						<Button
							variant="destructive"
							onClick={() => {
								if (deleteMultiple)
									deleteMultiple(
										table
											.getFilteredSelectedRowModel()
											.rows.map((row) => row.original)
									);
							}}
							isPending={deleteMultiplePending}
						>
							Delete{" "}
							{table.getFilteredSelectedRowModel().rows.length}{" "}
							learners
						</Button>
					)}
					<ExportCSVButton
						data={data.map((row) => flattenObject(row))}
						filename={name}
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								<Sliders size={16} />
								Filter
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<div className="rounded-md border">
				<div className="block w-full overflow-x-auto">
					<Table className="w-full min-w-max">
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										return (
											<TableHead
												key={header.id}
												className="min-w-fit"
											>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column
																.columnDef
																.header,
															header.getContext()
														)}
											</TableHead>
										);
									})}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										tabIndex={0}
										key={row.id}
										data-state={
											row.getIsSelected() && "selected"
										}
										onClick={() => {
											if (onRowClick) {
												onRowClick(row.original);
											}
										}}
										className={`${
											onRowClick && "cursor-pointer"
										}`}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className="whitespace-nowrap"
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
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
										No results.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of{" "}
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					Next
				</Button>
			</div>
		</div>
	);
};
