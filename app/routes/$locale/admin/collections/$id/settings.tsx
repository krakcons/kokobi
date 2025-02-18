import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/admin/collections/$id/settings')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  return <div>Hello "/$locale/admin/collections/$id/settings"!</div>
}
