import { createFileRoute } from "@tanstack/react-router";
import { Button } from "primereact/button";
import Subheading from "../kit/subheading";

const Page = () => {
	return (
		<div className="surface-ground min-h-screen flex align-items-center justify-content-center px-4 py-6">
			<div
				className="surface-card border-round-2xl shadow-3 p-5 w-full"
				style={{ maxWidth: "30rem" }}
			>
				<div className="flex flex-column gap-3 text-center">
					<Subheading>Anmelden</Subheading>
					<Button
						label="Anmelden"
						className="justify-content-center"
					/>
				</div>
			</div>
		</div>
	);
};

export const Route = createFileRoute("/login")({
	component: Page,
});
