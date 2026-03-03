import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "primereact/button";
import Subheading from "../../kit/subheading";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import z from "zod";
import { useForm } from "@tanstack/react-form";
import { appwriteAccount } from "@repo/lib";
import { AppwriteException } from "appwrite";

const Page = () => {
	const formValidator = z.object({
		email: z.email(),
		password: z.string().min(8),
	});
	const navigate = useNavigate();
	const { redirectUrl } = Route.useSearch();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: formValidator,
		},
		onSubmit: (props) => {
			appwriteAccount
				.createEmailPasswordSession({
					email: props.value.email,
					password: props.value.password,
				})
				.then(async () => {
					navigate({
						to: redirectUrl,
					});
				})
				.catch((error) => {
					if (!(error instanceof AppwriteException)) {
						appwriteAccount.deleteSession({
							sessionId: "current",
						});
					}
				});
		},
	});

	return (
		<div className="surface-ground min-h-screen flex align-items-center justify-content-center px-4 py-6">
			<div
				className="surface-card border-round-2xl shadow-3 p-5 w-full flex flex-column align-items-center gap-3"
				style={{ maxWidth: "25rem" }}
			>
				<img
					src="/public/logo_text.png"
					className="h-2rem w-auto mx-auto"
					alt="Logo"
				/>
				<Subheading>Anmelden</Subheading>
				<div className="flex flex-column gap-3 w-full">
					<form.Field name="email">
						{(field) => (
							<InputText
								placeholder="E-Mail Adresse"
								className="w-full"
								value={field.state.value}
								onChange={(event) =>
									field.handleChange(event.target.value)
								}
								invalid={!field.state.meta.isValid}
								autoComplete="email"
							/>
						)}
					</form.Field>
					<form.Field name="password">
						{(field) => (
							<Password
								placeholder="Passwort"
								className="w-full"
								inputClassName="w-full"
								value={field.state.value}
								onChange={(event) =>
									field.handleChange(event.target.value)
								}
								feedback={false}
							/>
						)}
					</form.Field>
				</div>
				<form.Subscribe selector={(state) => [state.canSubmit]}>
					{([canSubmit]) => (
						<Button
							label="Anmelden"
							type="submit"
							className="justify-content-center w-full"
							disabled={!canSubmit}
							onClick={() => form.handleSubmit()}
						/>
					)}
				</form.Subscribe>
			</div>
		</div>
	);
};

export const Route = createFileRoute("/(public)/login")({
	component: Page,
	validateSearch: (
		search: Record<string, string>,
	): { redirectUrl: string } => {
		return {
			redirectUrl: search.redirectUrl ? String(search.redirectUrl) : "/",
		};
	},
});
