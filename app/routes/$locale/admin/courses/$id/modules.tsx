import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/admin/courses/$id/modules')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/admin/courses/$id/modules"!</div>
}
