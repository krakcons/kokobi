import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/admin/api-keys')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/admin/api-keys"!</div>
}
