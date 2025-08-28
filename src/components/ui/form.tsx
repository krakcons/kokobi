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
import { Button } from "./button";
import { Textarea } from "./textarea";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { InputHTMLAttributes } from "react";
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

export const Title = (props: DefaultOptions & { htmlFor: string }) => {
	if (!props.label) return null;
	return (
		<Label
			htmlFor={props.htmlFor}
			className="flex flex-row items-center gap-1"
		>
			{props.label}
			<Optional {...props} />
		</Label>
	);
};

export const Error = ({ errors = [] }: { errors?: any[] }) => {
	return errors.map((e, i) => (
		<em key={i} role="alert" className="text-destructive text-sm">
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

export const Field = ({ children }: { children: React.ReactNode }) => {
	return <div className="flex flex-col gap-2 items-start">{children}</div>;
};

const TextField = (props: React.ComponentProps<"input"> & DefaultOptions) => {
	const field = useFieldContext<string>();
	return (
		<Field>
			<Title {...props} htmlFor={field.name} />
			<Input
				id={field.name}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				{...props}
			/>
			<Description {...props} />
			<Error errors={field.getMeta().errors} />
		</Field>
	);
};

const TextAreaField = (
	props: React.ComponentProps<"textarea"> & DefaultOptions,
) => {
	const field = useFieldContext<string>();
	return (
		<Field>
			<Title htmlFor={field.name} {...props} />
			<Textarea
				id={field.name}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				{...props}
			/>
			<Description {...props} />
			<Error errors={field.getMeta().errors} />
		</Field>
	);
};

const CheckboxField = (props: DefaultOptions) => {
	const field = useFieldContext<boolean>();

	return (
		<Field>
			<div className="flex flex-row items-center gap-2">
				<Checkbox
					id={field.name}
					name={field.name}
					checked={field.state.value ?? false}
					onBlur={field.handleBlur}
					onCheckedChange={(checked: boolean) =>
						field.handleChange(checked)
					}
				/>
				<Title htmlFor={field.name} {...props} />
			</div>
			<Description {...props} />
			<Error errors={field.getMeta().errors} />
		</Field>
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
		<Field>
			<Title {...props} htmlFor={field.name} />
			<Select
				onValueChange={(value) => field.handleChange(value)}
				defaultValue={field.state.value}
			>
				<SelectTrigger className="gap-1" id={field.name}>
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
		</Field>
	);
};

const FileField = ({
	label,
	accept,
}: Omit<DefaultOptions, "description"> & {
	accept: InputHTMLAttributes<HTMLInputElement>["accept"];
}) => {
	const t = useTranslations("Form");
	const field = useFieldContext<File | "">();
	return (
		<Field>
			<Title label={label} htmlFor={field.name} />
			<Input
				id={field.name}
				name={field.name}
				type="file"
				accept={accept}
				onChange={(event) => {
					field.handleChange(
						event.target.files ? event.target.files[0] : "",
					);
				}}
			/>
			<Description description={`${t.accepts} ${accept}`} />
			<Error errors={field.getMeta().errors} />
		</Field>
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
	const t = useTranslations("Form");
	const tAction = useTranslations("Actions");

	const field = useFieldContext<File | "">();

	const imageUrl = field.state.value
		? URL.createObjectURL(field.state.value).toString()
		: null;

	return (
		<Field>
			<Label htmlFor={field.name} className="items-start">
				{label}
				{imageUrl ? (
					<img
						src={imageUrl}
						height={height}
						style={{
							maxHeight: size.height,
						}}
						alt={label}
						className="rounded-md border"
					/>
				) : (
					<div
						className="bg-muted rounded-md"
						style={{
							width,
							height,
						}}
					/>
				)}
			</Label>
			<div className="flex items-center gap-2">
				<Input
					id={field.name}
					name={field.name}
					type="file"
					accept="image/*"
					onChange={(event) => {
						field.handleChange(
							event.target.files ? event.target.files[0] : "",
						);
					}}
				/>
				{field.state.value && (
					<Button
						type="button"
						variant="secondary"
						onClick={(e) => {
							e.preventDefault();
							field.handleChange("");
						}}
					>
						{tAction.delete}
					</Button>
				)}
			</div>
			{size.suggestedWidth && size.suggestedHeight && (
				<Description
					description={`${t.suggestedImageSize} ${size.suggestedWidth}px x ${size.suggestedHeight}px`}
				/>
			)}
			<Error errors={field.getMeta().errors} />
		</Field>
	);
};

export const BlockNavigation = () => {
	const form = useFormContext();
	const t = useTranslations("Form");

	const shouldBlock = useStore(
		form.store,
		(formState) =>
			formState.isDirty &&
			!(formState.isSubmitting || formState.isSubmitted),
	);

	return (
		<Block
			enableBeforeUnload={() => shouldBlock}
			shouldBlockFn={() => shouldBlock}
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
