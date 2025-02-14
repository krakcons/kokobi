import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/admin/team')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/admin/team"!</div>
}
