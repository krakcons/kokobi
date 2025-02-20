import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/admin/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/admin/settings"!</div>
}
