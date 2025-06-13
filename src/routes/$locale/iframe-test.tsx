import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/iframe-test")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex  justify-center p-8 flex-col gap-8">
			<h1>iframe-test</h1>
			<iframe
				src="http://localhost:3000/en/learner/courses/019663c0-a24a-7000-a116-d27f5ae2fc29"
				style={{ width: "100%", height: "100vh" }}
			></iframe>
		</div>
	);
}
