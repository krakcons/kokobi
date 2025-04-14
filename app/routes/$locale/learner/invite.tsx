import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/learner/invite')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/learner/invite"!</div>
}
