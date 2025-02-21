import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/create-team')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/create-team"!</div>
}
