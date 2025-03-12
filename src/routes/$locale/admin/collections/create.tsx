import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/admin/collections/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/admin/collections/create"!</div>
}
