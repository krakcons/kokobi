import { useAppForm } from "../ui/form";
import { useTranslations } from "@/lib/locale";
import {
	eventTypes,
	WebhookFormSchema,
	type WebhookFormType,
} from "@/types/webhooks";

export const WebhookForm = ({
	defaultValues,
	onSubmit,
}: {
	defaultValues?: WebhookFormType;
	onSubmit: (value: WebhookFormType) => Promise<any>;
}) => {
	const t = useTranslations("WebhookForm");
	const form = useAppForm({
		validators: {
			onSubmit: WebhookFormSchema,
		},
		defaultValues: {
			enabled: defaultValues?.enabled ?? true,
			url: defaultValues?.url ?? "",
			headers: defaultValues?.headers ?? {
				"": "",
			},
			description: defaultValues?.description ?? undefined,
			events: defaultValues?.events ?? undefined,
		} as WebhookFormType,
		onSubmit: ({ value }) => {
			return onSubmit({
				...value,
				// Remove empty headers
				headers:
					value.headers && Object.keys(value.headers).length > 0
						? Object.fromEntries(
								Object.entries(value.headers).filter(
									(entry) => entry[1] !== "",
								),
							)
						: undefined,
			});
		},
	});

	return (
		<form.AppForm>
			<form.BlockNavigation />
			<form
				onSubmit={(e) => e.preventDefault()}
				className="flex flex-col gap-6"
			>
				<form.AppField name="enabled">
					{(field) => <field.CheckboxField label={t.enabled} />}
				</form.AppField>
				<form.AppField name="url">
					{(field) => <field.TextField label={t.url} />}
				</form.AppField>
				<form.AppField name="description">
					{(field) => <field.TextAreaField label={t.description} />}
				</form.AppField>
				<form.AppField name="events">
					{(field) => (
						<field.MultiSelectField
							label={t.events}
							selectAll={false}
							placeholder={t.eventsPlaceholder}
							description={t.eventsDescription}
							options={eventTypes.map((event) => ({
								label: event,
								value: event,
							}))}
						/>
					)}
				</form.AppField>
				<form.AppField name="headers">
					{(field) => <field.KeyValueField label={t.headers} />}
				</form.AppField>
				<form.SubmitButton />
			</form>
		</form.AppForm>
	);
};
