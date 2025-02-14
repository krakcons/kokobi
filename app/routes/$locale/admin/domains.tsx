import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/admin/domains')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/admin/domains"!</div>
}
