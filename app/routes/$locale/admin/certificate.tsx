import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/admin/certificate')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/admin/certificate"!</div>
}
