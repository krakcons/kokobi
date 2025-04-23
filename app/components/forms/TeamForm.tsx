import { Button } from "@/components/ui/button";
import { TeamFormType, TeamFormSchema } from "@/types/team";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "../ui/collapsible";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useAppForm } from "../ui/form";

const CollapsibleWrapper = ({ children }: { children: React.ReactNode }) => {
	const [open, setOpen] = useState(false);
	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="group/collapsible -mt-4 mb-0"
		>
			<CollapsibleTrigger asChild>
				<Button variant="link" className="self-start -ml-3 mb-4">
					Other settings (optional)
					<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="space-y-8 mb-8">
				{children}
			</CollapsibleContent>
		</Collapsible>
	);
};

const BlankWrapper = ({ children }: { children: React.ReactNode }) => (
	<>{children}</>
);

export const TeamForm = ({
	defaultValues,
	collapsible,
	onSubmit,
}: {
	defaultValues?: TeamFormType;
	collapsible?: boolean;
	onSubmit: (value: TeamFormType) => Promise<any>;
}) => {
	const form = useAppForm({
		validators: {
			onSubmit: TeamFormSchema,
			onChange: ({ value }) => {
				console.log(value);
			},
		},
		defaultValues: {
			name: "",
			favicon: "",
			logo: "",
			...defaultValues,
		} as TeamFormType,
		onSubmit: ({ value }) => onSubmit(value),
	});

	const Wrapper = collapsible ? CollapsibleWrapper : BlankWrapper;

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-8 items-start"
			>
				{!collapsible && <form.BlockNavigation />}
				<form.AppField name="name">
					{(field) => <field.TextField label="Name" />}
				</form.AppField>
				<Wrapper>
					<form.AppField name="logo">
						{(field) => (
							<field.ImageField
								label="Logo"
								size={{
									width: 350,
									height: 100,
									suggestedWidth: 350,
									suggestedHeight: 100,
								}}
							/>
						)}
					</form.AppField>
					<form.AppField name="favicon">
						{(field) => (
							<field.ImageField
								label="Favicon"
								size={{
									width: 512 / 8,
									height: 512 / 8,
									suggestedWidth: 512,
									suggestedHeight: 512,
								}}
							/>
						)}
					</form.AppField>
				</Wrapper>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
