import {
	createFormHookContexts,
	createFormHook,
	useStore,
} from "@tanstack/react-form";
import { Block } from "@tanstack/react-router";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./alert-dialog";
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
import { Checkbox } from "./checkbox";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/locale";
const { fieldContext, useFieldContext, formContext, useFormContext } =
	createFormHookContexts();

type DefaultOptions = {
	label: string;
	optional?: boolean;
	description?: string;
};

export const Description = ({
	description,
}: {
	description?: DefaultOptions["description"];
}) => {
	if (!description) return null;
	return (
		<p className="text-muted-foreground text-xs whitespace-pre-line">
			{description}
		</p>
	);
};

export const Optional = ({
	optional,
}: {
	optional?: DefaultOptions["optional"];
}) => {
	const t = useTranslations("Form");
	if (!optional) return null;
	return <p className="text-muted-foreground text-xs">({t.optional})</p>;
};

export const Title = (props: DefaultOptions) => {
	if (!props.label) return null;
	return (
		<div className="flex items-center gap-1">
			{props.label}
			<Optional {...props} />
		</div>
	);
};

export const Error = ({ errors = [] }: { errors?: any[] }) => {
	return errors.map((e) => (
		<em role="alert" className="text-destructive text-sm">
			{e.message
				?.toString()
				.split(" ")
				.map((word: string) => {
					if (word.startsWith("t:")) {
						// @ts-ignore
						return t[word.slice(2)];
					}
					return word;
				})
				.join(" ")}
		</em>
	));
};

const TextField = (props: React.ComponentProps<"input"> & DefaultOptions) => {
	const field = useFieldContext<string>();
	return (
		<Label>
			<Title {...props} />
			<Input
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				{...props}
			/>
			<Description {...props} />
			<Error errors={field.getMeta().errors} />
		</Label>
	);
};

const TextAreaField = (props: DefaultOptions) => {
	const field = useFieldContext<string>();
	return (
		<Label>
			<Title {...props} />
			<Textarea
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
			/>
			<Description {...props} />
			<Error errors={field.getMeta().errors} />
		</Label>
	);
};

const CheckboxField = (props: DefaultOptions) => {
	const field = useFieldContext<boolean>();

	return (
		<Label>
			<div className="flex flex-row items-center gap-2">
				<Checkbox
					name={field.name}
					checked={field.state.value ?? false}
					onBlur={field.handleBlur}
					onCheckedChange={(checked: boolean) =>
						field.handleChange(checked)
					}
				/>
				<Title {...props} />
			</div>
			<Description {...props} />
			<Error errors={field.getMeta().errors} />
		</Label>
	);
};

const SelectField = ({
	options,
	...props
}: DefaultOptions & {
	options: {
		label: string;
		value: string;
	}[];
}) => {
	const field = useFieldContext<string>();
	return (
		<Label>
			<Title {...props} />
			<Select
				onValueChange={(value) => field.handleChange(value)}
				defaultValue={field.state.value}
			>
				<SelectTrigger>
					<SelectValue />
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
			<Description {...props} />
			<Error errors={field.getMeta().errors} />
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
			<div className="flex items-center gap-2">
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
			<Description description={`Accepts: ${accept}`} />
			<Error errors={field.getMeta().errors} />
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
					className="bg-muted rounded"
					style={{
						width,
						height,
					}}
				/>
			)}
			<div className="flex items-center gap-2">
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
			<Description
				description={`Suggested image size: ${suggestedWidth}px x ${suggestedHeight}px`}
			/>
			<Error errors={field.getMeta().errors} />
		</div>
	);
};

export const BlockNavigation = () => {
	const form = useFormContext();
	const t = useTranslations("Form");
	const isDirty = useStore(form.store, (formState) => formState.isDirty);
	const isSubmitting = useStore(
		form.store,
		(formState) => formState.isSubmitting,
	);
	const isSubmitted = useStore(
		form.store,
		(formState) => formState.isSubmitted,
	);

	return (
		<Block
			shouldBlockFn={() => isDirty && !(isSubmitting || isSubmitted)}
			withResolver
		>
			{({ status, proceed, reset }) => (
				<AlertDialog open={status === "blocked"}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{t.blockNavigation.title}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{t.blockNavigation.description}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel onClick={reset}>
								{t.blockNavigation.cancel}
							</AlertDialogCancel>
							<AlertDialogAction onClick={proceed}>
								{t.blockNavigation.confirm}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</Block>
	);
};

const SubmitButton = () => {
	const form = useFormContext();
	const t = useTranslations("Form");

	return (
		<form.Subscribe selector={(formState) => [formState.isSubmitting]}>
			{([isSubmitting]) => (
				<Button
					type="submit"
					onClick={() => {
						form.handleSubmit();
					}}
					disabled={isSubmitting}
					className="self-start"
				>
					{isSubmitting && <Loader2 className="animate-spin" />}
					{t.submit}
				</Button>
			)}
		</form.Subscribe>
	);
};

const { useAppForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		TextAreaField,
		SelectField,
		CheckboxField,
		FileField,
		ImageField,
	},
	formComponents: {
		SubmitButton,
		BlockNavigation,
	},
});

export { useAppForm };
