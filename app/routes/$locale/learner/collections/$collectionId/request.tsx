import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/$locale/learner/collections/$collectionId/request',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$locale/learner/collections/$collectionId/request"!</div>
}
