import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/admin/courses/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/admin/courses/create"!</div>
}
