import { createFileRoute } from "@tanstack/react-router";

const Page = () => {
	return (
		<div>This is a protected page. You should only see this if you are logged in.
		</div>
	)
};

export const Route = createFileRoute("/protected")({
	component: Page,
});
