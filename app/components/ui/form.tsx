import { createFormHookContexts, createFormHook } from "@tanstack/react-form";
import { Label } from "./label";
import { Input } from "./input";
import { Button, buttonVariants } from "./button";
import { Textarea } from "./textarea";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { InputHTMLAttributes } from "react";
const { fieldContext, useFieldContext, formContext } = createFormHookContexts();

type DefaultOptions = {
	label: string;
	description?: string;
};

export const Description = ({ children }: { children: React.ReactNode }) => {
	return <p className="text-xs text-muted-foreground">{children}</p>;
};

const TextField = ({ label, description }: DefaultOptions) => {
	const field = useFieldContext<string>();
	return (
		<Label>
			<div>{label}</div>
			<Input
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
			/>
			{description && <Description>{description}</Description>}
		</Label>
	);
};

const TextAreaField = ({ label, description }: DefaultOptions) => {
	const field = useFieldContext<string>();
	return (
		<Label>
			{label}
			<Textarea
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
			/>
			{description && <Description>{description}</Description>}
		</Label>
	);
};

const SelectField = ({
	label,
	description,
	options,
}: DefaultOptions & {
	options: {
		label: string;
		value: string;
	}[];
}) => {
	const field = useFieldContext<string>();
	return (
		<Label>
			{label}
			<Select
				onValueChange={(value) => field.handleChange(value)}
				defaultValue={field.state.value}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select language" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{options.map((option) => (
							<SelectItem key={option.label} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			{description && <Description>{description}</Description>}
		</Label>
	);
};

const FileField = ({
	label,
	accept,
}: Omit<DefaultOptions, "description"> & {
	accept: InputHTMLAttributes<HTMLInputElement>["accept"];
}) => {
	const field = useFieldContext<File | "">();
	return (
		<div className="flex flex-col items-start gap-2">
			<Label>
				File {field.state.value ? `(${field.state.value.name})` : ""}
			</Label>
			<div className="flex gap-2 items-center">
				<Label
					htmlFor={field.name}
					className={buttonVariants({
						size: "sm",
						variant: "secondary",
						className: "cursor-pointer",
					})}
				>
					Add {label}
				</Label>
				{field.state.value && (
					<Button
						size="sm"
						variant="secondary"
						onClick={() => {
							field.handleChange("");
						}}
					>
						Remove
					</Button>
				)}
			</div>
			<Input
				id={field.name}
				name={field.name}
				type="file"
				className="hidden"
				accept={accept}
				onChange={(event) => {
					field.handleChange(
						event.target.files ? event.target.files[0] : "",
					);
				}}
			/>
			<Description>Accepts: {accept}</Description>
		</div>
	);
};

const ImageField = ({
	label,
	size,
}: {
	label: string;
	size: {
		width: number;
		height: number;
		suggestedWidth?: number;
		suggestedHeight?: number;
	};
}) => {
	const { width, height } = size;
	const suggestedWidth = size.suggestedWidth ?? width;
	const suggestedHeight = size.suggestedHeight ?? height;

	const field = useFieldContext<File | "">();

	const imageUrl = field.state.value
		? URL.createObjectURL(field.state.value).toString()
		: null;

	return (
		<div className="flex flex-col items-start gap-2">
			<Label>{label}</Label>
			{imageUrl ? (
				<img
					src={imageUrl}
					width={width}
					height={height}
					alt={label}
					className="rounded"
				/>
			) : (
				<div
					className="rounded bg-muted"
					style={{
						width,
						height,
					}}
				/>
			)}
			<div className="flex gap-2 items-center">
				<Label
					htmlFor={field.name}
					className={buttonVariants({
						size: "sm",
						variant: "secondary",
						className: "cursor-pointer",
					})}
				>
					Change {label}
				</Label>
				{field.state.value && (
					<Button
						size="sm"
						variant="secondary"
						onClick={() => {
							field.handleChange("");
						}}
					>
						Remove
					</Button>
				)}
			</div>
			<Input
				id={field.name}
				name={field.name}
				placeholder="Logo"
				type="file"
				className="hidden"
				accept="image/*"
				onChange={(event) => {
					field.handleChange(
						event.target.files ? event.target.files[0] : "",
					);
				}}
			/>
			<Description>
				Suggested image size: {suggestedWidth}px x {suggestedHeight}px
			</Description>
		</div>
	);
};

const { useAppForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		TextAreaField,
		SelectField,
		FileField,
		ImageField,
	},
	formComponents: {},
});

export { useAppForm };
