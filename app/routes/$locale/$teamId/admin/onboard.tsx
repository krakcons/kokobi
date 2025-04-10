import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/$teamId/admin/onboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/admin/onboard"!</div>
}
