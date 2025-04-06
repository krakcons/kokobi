/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as LocaleIndexImport } from './routes/$locale/index'
import { Route as LocaleCreateTeamImport } from './routes/$locale/create-team'
import { Route as LocaleAiImport } from './routes/$locale/ai'
import { Route as LocaleAdminImport } from './routes/$locale/admin'
import { Route as LocaleLearnerIndexImport } from './routes/$locale/learner/index'
import { Route as LocaleAdminIndexImport } from './routes/$locale/admin/index'
import { Route as LocaleAdminSettingsImport } from './routes/$locale/admin/settings'
import { Route as LocaleAdminOnboardImport } from './routes/$locale/admin/onboard'
import { Route as LocaleAdminMembersImport } from './routes/$locale/admin/members'
import { Route as LocaleAdminKeysImport } from './routes/$locale/admin/keys'
import { Route as LocaleAdminCertificateImport } from './routes/$locale/admin/certificate'
import { Route as LocaleAdminCoursesCreateImport } from './routes/$locale/admin/courses/create'
import { Route as LocaleAdminCollectionsCreateImport } from './routes/$locale/admin/collections/create'
import { Route as LocaleLearnerCoursesCourseIdIndexImport } from './routes/$locale/learner/courses/$courseId/index'
import { Route as LocaleLearnerCollectionsCollectionIdIndexImport } from './routes/$locale/learner/collections/$collectionId/index'
import { Route as LocaleLearnerCoursesCourseIdRequestImport } from './routes/$locale/learner/courses/$courseId/request'
import { Route as LocaleLearnerCoursesCourseIdPlayImport } from './routes/$locale/learner/courses/$courseId/play'
import { Route as LocaleLearnerCoursesCourseIdInviteImport } from './routes/$locale/learner/courses/$courseId/invite'
import { Route as LocaleLearnerCollectionsCollectionIdRequestImport } from './routes/$locale/learner/collections/$collectionId/request'
import { Route as LocaleLearnerCollectionsCollectionIdInviteImport } from './routes/$locale/learner/collections/$collectionId/invite'
import { Route as LocaleAdminCoursesIdWebhooksImport } from './routes/$locale/admin/courses/$id/webhooks'
import { Route as LocaleAdminCoursesIdSettingsImport } from './routes/$locale/admin/courses/$id/settings'
import { Route as LocaleAdminCoursesIdModulesImport } from './routes/$locale/admin/courses/$id/modules'
import { Route as LocaleAdminCoursesIdLearnersImport } from './routes/$locale/admin/courses/$id/learners'
import { Route as LocaleAdminCollectionsIdSettingsImport } from './routes/$locale/admin/collections/$id/settings'
import { Route as LocaleAdminCollectionsIdLearnersImport } from './routes/$locale/admin/collections/$id/learners'
import { Route as LocaleAdminCollectionsIdCoursesImport } from './routes/$locale/admin/collections/$id/courses'

// Create/Update Routes

const LocaleIndexRoute = LocaleIndexImport.update({
  id: '/$locale/',
  path: '/$locale/',
  getParentRoute: () => rootRoute,
} as any)

const LocaleCreateTeamRoute = LocaleCreateTeamImport.update({
  id: '/$locale/create-team',
  path: '/$locale/create-team',
  getParentRoute: () => rootRoute,
} as any)

const LocaleAiRoute = LocaleAiImport.update({
  id: '/$locale/ai',
  path: '/$locale/ai',
  getParentRoute: () => rootRoute,
} as any)

const LocaleAdminRoute = LocaleAdminImport.update({
  id: '/$locale/admin',
  path: '/$locale/admin',
  getParentRoute: () => rootRoute,
} as any)

const LocaleLearnerIndexRoute = LocaleLearnerIndexImport.update({
  id: '/$locale/learner/',
  path: '/$locale/learner/',
  getParentRoute: () => rootRoute,
} as any)

const LocaleAdminIndexRoute = LocaleAdminIndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => LocaleAdminRoute,
} as any)

const LocaleAdminSettingsRoute = LocaleAdminSettingsImport.update({
  id: '/settings',
  path: '/settings',
  getParentRoute: () => LocaleAdminRoute,
} as any)

const LocaleAdminOnboardRoute = LocaleAdminOnboardImport.update({
  id: '/onboard',
  path: '/onboard',
  getParentRoute: () => LocaleAdminRoute,
} as any)

const LocaleAdminMembersRoute = LocaleAdminMembersImport.update({
  id: '/members',
  path: '/members',
  getParentRoute: () => LocaleAdminRoute,
} as any)

const LocaleAdminKeysRoute = LocaleAdminKeysImport.update({
  id: '/keys',
  path: '/keys',
  getParentRoute: () => LocaleAdminRoute,
} as any)

const LocaleAdminCertificateRoute = LocaleAdminCertificateImport.update({
  id: '/certificate',
  path: '/certificate',
  getParentRoute: () => LocaleAdminRoute,
} as any)

const LocaleAdminCoursesCreateRoute = LocaleAdminCoursesCreateImport.update({
  id: '/courses/create',
  path: '/courses/create',
  getParentRoute: () => LocaleAdminRoute,
} as any)

const LocaleAdminCollectionsCreateRoute =
  LocaleAdminCollectionsCreateImport.update({
    id: '/collections/create',
    path: '/collections/create',
    getParentRoute: () => LocaleAdminRoute,
  } as any)

const LocaleLearnerCoursesCourseIdIndexRoute =
  LocaleLearnerCoursesCourseIdIndexImport.update({
    id: '/$locale/learner/courses/$courseId/',
    path: '/$locale/learner/courses/$courseId/',
    getParentRoute: () => rootRoute,
  } as any)

const LocaleLearnerCollectionsCollectionIdIndexRoute =
  LocaleLearnerCollectionsCollectionIdIndexImport.update({
    id: '/$locale/learner/collections/$collectionId/',
    path: '/$locale/learner/collections/$collectionId/',
    getParentRoute: () => rootRoute,
  } as any)

const LocaleLearnerCoursesCourseIdRequestRoute =
  LocaleLearnerCoursesCourseIdRequestImport.update({
    id: '/$locale/learner/courses/$courseId/request',
    path: '/$locale/learner/courses/$courseId/request',
    getParentRoute: () => rootRoute,
  } as any)

const LocaleLearnerCoursesCourseIdPlayRoute =
  LocaleLearnerCoursesCourseIdPlayImport.update({
    id: '/$locale/learner/courses/$courseId/play',
    path: '/$locale/learner/courses/$courseId/play',
    getParentRoute: () => rootRoute,
  } as any)

const LocaleLearnerCoursesCourseIdInviteRoute =
  LocaleLearnerCoursesCourseIdInviteImport.update({
    id: '/$locale/learner/courses/$courseId/invite',
    path: '/$locale/learner/courses/$courseId/invite',
    getParentRoute: () => rootRoute,
  } as any)

const LocaleLearnerCollectionsCollectionIdRequestRoute =
  LocaleLearnerCollectionsCollectionIdRequestImport.update({
    id: '/$locale/learner/collections/$collectionId/request',
    path: '/$locale/learner/collections/$collectionId/request',
    getParentRoute: () => rootRoute,
  } as any)

const LocaleLearnerCollectionsCollectionIdInviteRoute =
  LocaleLearnerCollectionsCollectionIdInviteImport.update({
    id: '/$locale/learner/collections/$collectionId/invite',
    path: '/$locale/learner/collections/$collectionId/invite',
    getParentRoute: () => rootRoute,
  } as any)

const LocaleAdminCoursesIdWebhooksRoute =
  LocaleAdminCoursesIdWebhooksImport.update({
    id: '/courses/$id/webhooks',
    path: '/courses/$id/webhooks',
    getParentRoute: () => LocaleAdminRoute,
  } as any)

const LocaleAdminCoursesIdSettingsRoute =
  LocaleAdminCoursesIdSettingsImport.update({
    id: '/courses/$id/settings',
    path: '/courses/$id/settings',
    getParentRoute: () => LocaleAdminRoute,
  } as any)

const LocaleAdminCoursesIdModulesRoute =
  LocaleAdminCoursesIdModulesImport.update({
    id: '/courses/$id/modules',
    path: '/courses/$id/modules',
    getParentRoute: () => LocaleAdminRoute,
  } as any)

const LocaleAdminCoursesIdLearnersRoute =
  LocaleAdminCoursesIdLearnersImport.update({
    id: '/courses/$id/learners',
    path: '/courses/$id/learners',
    getParentRoute: () => LocaleAdminRoute,
  } as any)

const LocaleAdminCollectionsIdSettingsRoute =
  LocaleAdminCollectionsIdSettingsImport.update({
    id: '/collections/$id/settings',
    path: '/collections/$id/settings',
    getParentRoute: () => LocaleAdminRoute,
  } as any)

const LocaleAdminCollectionsIdLearnersRoute =
  LocaleAdminCollectionsIdLearnersImport.update({
    id: '/collections/$id/learners',
    path: '/collections/$id/learners',
    getParentRoute: () => LocaleAdminRoute,
  } as any)

const LocaleAdminCollectionsIdCoursesRoute =
  LocaleAdminCollectionsIdCoursesImport.update({
    id: '/collections/$id/courses',
    path: '/collections/$id/courses',
    getParentRoute: () => LocaleAdminRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/$locale/admin': {
      id: '/$locale/admin'
      path: '/$locale/admin'
      fullPath: '/$locale/admin'
      preLoaderRoute: typeof LocaleAdminImport
      parentRoute: typeof rootRoute
    }
    '/$locale/ai': {
      id: '/$locale/ai'
      path: '/$locale/ai'
      fullPath: '/$locale/ai'
      preLoaderRoute: typeof LocaleAiImport
      parentRoute: typeof rootRoute
    }
    '/$locale/create-team': {
      id: '/$locale/create-team'
      path: '/$locale/create-team'
      fullPath: '/$locale/create-team'
      preLoaderRoute: typeof LocaleCreateTeamImport
      parentRoute: typeof rootRoute
    }
    '/$locale/': {
      id: '/$locale/'
      path: '/$locale'
      fullPath: '/$locale'
      preLoaderRoute: typeof LocaleIndexImport
      parentRoute: typeof rootRoute
    }
    '/$locale/admin/certificate': {
      id: '/$locale/admin/certificate'
      path: '/certificate'
      fullPath: '/$locale/admin/certificate'
      preLoaderRoute: typeof LocaleAdminCertificateImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/keys': {
      id: '/$locale/admin/keys'
      path: '/keys'
      fullPath: '/$locale/admin/keys'
      preLoaderRoute: typeof LocaleAdminKeysImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/members': {
      id: '/$locale/admin/members'
      path: '/members'
      fullPath: '/$locale/admin/members'
      preLoaderRoute: typeof LocaleAdminMembersImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/onboard': {
      id: '/$locale/admin/onboard'
      path: '/onboard'
      fullPath: '/$locale/admin/onboard'
      preLoaderRoute: typeof LocaleAdminOnboardImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/settings': {
      id: '/$locale/admin/settings'
      path: '/settings'
      fullPath: '/$locale/admin/settings'
      preLoaderRoute: typeof LocaleAdminSettingsImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/': {
      id: '/$locale/admin/'
      path: '/'
      fullPath: '/$locale/admin/'
      preLoaderRoute: typeof LocaleAdminIndexImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/learner/': {
      id: '/$locale/learner/'
      path: '/$locale/learner'
      fullPath: '/$locale/learner'
      preLoaderRoute: typeof LocaleLearnerIndexImport
      parentRoute: typeof rootRoute
    }
    '/$locale/admin/collections/create': {
      id: '/$locale/admin/collections/create'
      path: '/collections/create'
      fullPath: '/$locale/admin/collections/create'
      preLoaderRoute: typeof LocaleAdminCollectionsCreateImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/courses/create': {
      id: '/$locale/admin/courses/create'
      path: '/courses/create'
      fullPath: '/$locale/admin/courses/create'
      preLoaderRoute: typeof LocaleAdminCoursesCreateImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/collections/$id/courses': {
      id: '/$locale/admin/collections/$id/courses'
      path: '/collections/$id/courses'
      fullPath: '/$locale/admin/collections/$id/courses'
      preLoaderRoute: typeof LocaleAdminCollectionsIdCoursesImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/collections/$id/learners': {
      id: '/$locale/admin/collections/$id/learners'
      path: '/collections/$id/learners'
      fullPath: '/$locale/admin/collections/$id/learners'
      preLoaderRoute: typeof LocaleAdminCollectionsIdLearnersImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/collections/$id/settings': {
      id: '/$locale/admin/collections/$id/settings'
      path: '/collections/$id/settings'
      fullPath: '/$locale/admin/collections/$id/settings'
      preLoaderRoute: typeof LocaleAdminCollectionsIdSettingsImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/courses/$id/learners': {
      id: '/$locale/admin/courses/$id/learners'
      path: '/courses/$id/learners'
      fullPath: '/$locale/admin/courses/$id/learners'
      preLoaderRoute: typeof LocaleAdminCoursesIdLearnersImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/courses/$id/modules': {
      id: '/$locale/admin/courses/$id/modules'
      path: '/courses/$id/modules'
      fullPath: '/$locale/admin/courses/$id/modules'
      preLoaderRoute: typeof LocaleAdminCoursesIdModulesImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/courses/$id/settings': {
      id: '/$locale/admin/courses/$id/settings'
      path: '/courses/$id/settings'
      fullPath: '/$locale/admin/courses/$id/settings'
      preLoaderRoute: typeof LocaleAdminCoursesIdSettingsImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/admin/courses/$id/webhooks': {
      id: '/$locale/admin/courses/$id/webhooks'
      path: '/courses/$id/webhooks'
      fullPath: '/$locale/admin/courses/$id/webhooks'
      preLoaderRoute: typeof LocaleAdminCoursesIdWebhooksImport
      parentRoute: typeof LocaleAdminImport
    }
    '/$locale/learner/collections/$collectionId/invite': {
      id: '/$locale/learner/collections/$collectionId/invite'
      path: '/$locale/learner/collections/$collectionId/invite'
      fullPath: '/$locale/learner/collections/$collectionId/invite'
      preLoaderRoute: typeof LocaleLearnerCollectionsCollectionIdInviteImport
      parentRoute: typeof rootRoute
    }
    '/$locale/learner/collections/$collectionId/request': {
      id: '/$locale/learner/collections/$collectionId/request'
      path: '/$locale/learner/collections/$collectionId/request'
      fullPath: '/$locale/learner/collections/$collectionId/request'
      preLoaderRoute: typeof LocaleLearnerCollectionsCollectionIdRequestImport
      parentRoute: typeof rootRoute
    }
    '/$locale/learner/courses/$courseId/invite': {
      id: '/$locale/learner/courses/$courseId/invite'
      path: '/$locale/learner/courses/$courseId/invite'
      fullPath: '/$locale/learner/courses/$courseId/invite'
      preLoaderRoute: typeof LocaleLearnerCoursesCourseIdInviteImport
      parentRoute: typeof rootRoute
    }
    '/$locale/learner/courses/$courseId/play': {
      id: '/$locale/learner/courses/$courseId/play'
      path: '/$locale/learner/courses/$courseId/play'
      fullPath: '/$locale/learner/courses/$courseId/play'
      preLoaderRoute: typeof LocaleLearnerCoursesCourseIdPlayImport
      parentRoute: typeof rootRoute
    }
    '/$locale/learner/courses/$courseId/request': {
      id: '/$locale/learner/courses/$courseId/request'
      path: '/$locale/learner/courses/$courseId/request'
      fullPath: '/$locale/learner/courses/$courseId/request'
      preLoaderRoute: typeof LocaleLearnerCoursesCourseIdRequestImport
      parentRoute: typeof rootRoute
    }
    '/$locale/learner/collections/$collectionId/': {
      id: '/$locale/learner/collections/$collectionId/'
      path: '/$locale/learner/collections/$collectionId'
      fullPath: '/$locale/learner/collections/$collectionId'
      preLoaderRoute: typeof LocaleLearnerCollectionsCollectionIdIndexImport
      parentRoute: typeof rootRoute
    }
    '/$locale/learner/courses/$courseId/': {
      id: '/$locale/learner/courses/$courseId/'
      path: '/$locale/learner/courses/$courseId'
      fullPath: '/$locale/learner/courses/$courseId'
      preLoaderRoute: typeof LocaleLearnerCoursesCourseIdIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

interface LocaleAdminRouteChildren {
  LocaleAdminCertificateRoute: typeof LocaleAdminCertificateRoute
  LocaleAdminKeysRoute: typeof LocaleAdminKeysRoute
  LocaleAdminMembersRoute: typeof LocaleAdminMembersRoute
  LocaleAdminOnboardRoute: typeof LocaleAdminOnboardRoute
  LocaleAdminSettingsRoute: typeof LocaleAdminSettingsRoute
  LocaleAdminIndexRoute: typeof LocaleAdminIndexRoute
  LocaleAdminCollectionsCreateRoute: typeof LocaleAdminCollectionsCreateRoute
  LocaleAdminCoursesCreateRoute: typeof LocaleAdminCoursesCreateRoute
  LocaleAdminCollectionsIdCoursesRoute: typeof LocaleAdminCollectionsIdCoursesRoute
  LocaleAdminCollectionsIdLearnersRoute: typeof LocaleAdminCollectionsIdLearnersRoute
  LocaleAdminCollectionsIdSettingsRoute: typeof LocaleAdminCollectionsIdSettingsRoute
  LocaleAdminCoursesIdLearnersRoute: typeof LocaleAdminCoursesIdLearnersRoute
  LocaleAdminCoursesIdModulesRoute: typeof LocaleAdminCoursesIdModulesRoute
  LocaleAdminCoursesIdSettingsRoute: typeof LocaleAdminCoursesIdSettingsRoute
  LocaleAdminCoursesIdWebhooksRoute: typeof LocaleAdminCoursesIdWebhooksRoute
}

const LocaleAdminRouteChildren: LocaleAdminRouteChildren = {
  LocaleAdminCertificateRoute: LocaleAdminCertificateRoute,
  LocaleAdminKeysRoute: LocaleAdminKeysRoute,
  LocaleAdminMembersRoute: LocaleAdminMembersRoute,
  LocaleAdminOnboardRoute: LocaleAdminOnboardRoute,
  LocaleAdminSettingsRoute: LocaleAdminSettingsRoute,
  LocaleAdminIndexRoute: LocaleAdminIndexRoute,
  LocaleAdminCollectionsCreateRoute: LocaleAdminCollectionsCreateRoute,
  LocaleAdminCoursesCreateRoute: LocaleAdminCoursesCreateRoute,
  LocaleAdminCollectionsIdCoursesRoute: LocaleAdminCollectionsIdCoursesRoute,
  LocaleAdminCollectionsIdLearnersRoute: LocaleAdminCollectionsIdLearnersRoute,
  LocaleAdminCollectionsIdSettingsRoute: LocaleAdminCollectionsIdSettingsRoute,
  LocaleAdminCoursesIdLearnersRoute: LocaleAdminCoursesIdLearnersRoute,
  LocaleAdminCoursesIdModulesRoute: LocaleAdminCoursesIdModulesRoute,
  LocaleAdminCoursesIdSettingsRoute: LocaleAdminCoursesIdSettingsRoute,
  LocaleAdminCoursesIdWebhooksRoute: LocaleAdminCoursesIdWebhooksRoute,
}

const LocaleAdminRouteWithChildren = LocaleAdminRoute._addFileChildren(
  LocaleAdminRouteChildren,
)

export interface FileRoutesByFullPath {
  '/$locale/admin': typeof LocaleAdminRouteWithChildren
  '/$locale/ai': typeof LocaleAiRoute
  '/$locale/create-team': typeof LocaleCreateTeamRoute
  '/$locale': typeof LocaleIndexRoute
  '/$locale/admin/certificate': typeof LocaleAdminCertificateRoute
  '/$locale/admin/keys': typeof LocaleAdminKeysRoute
  '/$locale/admin/members': typeof LocaleAdminMembersRoute
  '/$locale/admin/onboard': typeof LocaleAdminOnboardRoute
  '/$locale/admin/settings': typeof LocaleAdminSettingsRoute
  '/$locale/admin/': typeof LocaleAdminIndexRoute
  '/$locale/learner': typeof LocaleLearnerIndexRoute
  '/$locale/admin/collections/create': typeof LocaleAdminCollectionsCreateRoute
  '/$locale/admin/courses/create': typeof LocaleAdminCoursesCreateRoute
  '/$locale/admin/collections/$id/courses': typeof LocaleAdminCollectionsIdCoursesRoute
  '/$locale/admin/collections/$id/learners': typeof LocaleAdminCollectionsIdLearnersRoute
  '/$locale/admin/collections/$id/settings': typeof LocaleAdminCollectionsIdSettingsRoute
  '/$locale/admin/courses/$id/learners': typeof LocaleAdminCoursesIdLearnersRoute
  '/$locale/admin/courses/$id/modules': typeof LocaleAdminCoursesIdModulesRoute
  '/$locale/admin/courses/$id/settings': typeof LocaleAdminCoursesIdSettingsRoute
  '/$locale/admin/courses/$id/webhooks': typeof LocaleAdminCoursesIdWebhooksRoute
  '/$locale/learner/collections/$collectionId/invite': typeof LocaleLearnerCollectionsCollectionIdInviteRoute
  '/$locale/learner/collections/$collectionId/request': typeof LocaleLearnerCollectionsCollectionIdRequestRoute
  '/$locale/learner/courses/$courseId/invite': typeof LocaleLearnerCoursesCourseIdInviteRoute
  '/$locale/learner/courses/$courseId/play': typeof LocaleLearnerCoursesCourseIdPlayRoute
  '/$locale/learner/courses/$courseId/request': typeof LocaleLearnerCoursesCourseIdRequestRoute
  '/$locale/learner/collections/$collectionId': typeof LocaleLearnerCollectionsCollectionIdIndexRoute
  '/$locale/learner/courses/$courseId': typeof LocaleLearnerCoursesCourseIdIndexRoute
}

export interface FileRoutesByTo {
  '/$locale/ai': typeof LocaleAiRoute
  '/$locale/create-team': typeof LocaleCreateTeamRoute
  '/$locale': typeof LocaleIndexRoute
  '/$locale/admin/certificate': typeof LocaleAdminCertificateRoute
  '/$locale/admin/keys': typeof LocaleAdminKeysRoute
  '/$locale/admin/members': typeof LocaleAdminMembersRoute
  '/$locale/admin/onboard': typeof LocaleAdminOnboardRoute
  '/$locale/admin/settings': typeof LocaleAdminSettingsRoute
  '/$locale/admin': typeof LocaleAdminIndexRoute
  '/$locale/learner': typeof LocaleLearnerIndexRoute
  '/$locale/admin/collections/create': typeof LocaleAdminCollectionsCreateRoute
  '/$locale/admin/courses/create': typeof LocaleAdminCoursesCreateRoute
  '/$locale/admin/collections/$id/courses': typeof LocaleAdminCollectionsIdCoursesRoute
  '/$locale/admin/collections/$id/learners': typeof LocaleAdminCollectionsIdLearnersRoute
  '/$locale/admin/collections/$id/settings': typeof LocaleAdminCollectionsIdSettingsRoute
  '/$locale/admin/courses/$id/learners': typeof LocaleAdminCoursesIdLearnersRoute
  '/$locale/admin/courses/$id/modules': typeof LocaleAdminCoursesIdModulesRoute
  '/$locale/admin/courses/$id/settings': typeof LocaleAdminCoursesIdSettingsRoute
  '/$locale/admin/courses/$id/webhooks': typeof LocaleAdminCoursesIdWebhooksRoute
  '/$locale/learner/collections/$collectionId/invite': typeof LocaleLearnerCollectionsCollectionIdInviteRoute
  '/$locale/learner/collections/$collectionId/request': typeof LocaleLearnerCollectionsCollectionIdRequestRoute
  '/$locale/learner/courses/$courseId/invite': typeof LocaleLearnerCoursesCourseIdInviteRoute
  '/$locale/learner/courses/$courseId/play': typeof LocaleLearnerCoursesCourseIdPlayRoute
  '/$locale/learner/courses/$courseId/request': typeof LocaleLearnerCoursesCourseIdRequestRoute
  '/$locale/learner/collections/$collectionId': typeof LocaleLearnerCollectionsCollectionIdIndexRoute
  '/$locale/learner/courses/$courseId': typeof LocaleLearnerCoursesCourseIdIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/$locale/admin': typeof LocaleAdminRouteWithChildren
  '/$locale/ai': typeof LocaleAiRoute
  '/$locale/create-team': typeof LocaleCreateTeamRoute
  '/$locale/': typeof LocaleIndexRoute
  '/$locale/admin/certificate': typeof LocaleAdminCertificateRoute
  '/$locale/admin/keys': typeof LocaleAdminKeysRoute
  '/$locale/admin/members': typeof LocaleAdminMembersRoute
  '/$locale/admin/onboard': typeof LocaleAdminOnboardRoute
  '/$locale/admin/settings': typeof LocaleAdminSettingsRoute
  '/$locale/admin/': typeof LocaleAdminIndexRoute
  '/$locale/learner/': typeof LocaleLearnerIndexRoute
  '/$locale/admin/collections/create': typeof LocaleAdminCollectionsCreateRoute
  '/$locale/admin/courses/create': typeof LocaleAdminCoursesCreateRoute
  '/$locale/admin/collections/$id/courses': typeof LocaleAdminCollectionsIdCoursesRoute
  '/$locale/admin/collections/$id/learners': typeof LocaleAdminCollectionsIdLearnersRoute
  '/$locale/admin/collections/$id/settings': typeof LocaleAdminCollectionsIdSettingsRoute
  '/$locale/admin/courses/$id/learners': typeof LocaleAdminCoursesIdLearnersRoute
  '/$locale/admin/courses/$id/modules': typeof LocaleAdminCoursesIdModulesRoute
  '/$locale/admin/courses/$id/settings': typeof LocaleAdminCoursesIdSettingsRoute
  '/$locale/admin/courses/$id/webhooks': typeof LocaleAdminCoursesIdWebhooksRoute
  '/$locale/learner/collections/$collectionId/invite': typeof LocaleLearnerCollectionsCollectionIdInviteRoute
  '/$locale/learner/collections/$collectionId/request': typeof LocaleLearnerCollectionsCollectionIdRequestRoute
  '/$locale/learner/courses/$courseId/invite': typeof LocaleLearnerCoursesCourseIdInviteRoute
  '/$locale/learner/courses/$courseId/play': typeof LocaleLearnerCoursesCourseIdPlayRoute
  '/$locale/learner/courses/$courseId/request': typeof LocaleLearnerCoursesCourseIdRequestRoute
  '/$locale/learner/collections/$collectionId/': typeof LocaleLearnerCollectionsCollectionIdIndexRoute
  '/$locale/learner/courses/$courseId/': typeof LocaleLearnerCoursesCourseIdIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/$locale/admin'
    | '/$locale/ai'
    | '/$locale/create-team'
    | '/$locale'
    | '/$locale/admin/certificate'
    | '/$locale/admin/keys'
    | '/$locale/admin/members'
    | '/$locale/admin/onboard'
    | '/$locale/admin/settings'
    | '/$locale/admin/'
    | '/$locale/learner'
    | '/$locale/admin/collections/create'
    | '/$locale/admin/courses/create'
    | '/$locale/admin/collections/$id/courses'
    | '/$locale/admin/collections/$id/learners'
    | '/$locale/admin/collections/$id/settings'
    | '/$locale/admin/courses/$id/learners'
    | '/$locale/admin/courses/$id/modules'
    | '/$locale/admin/courses/$id/settings'
    | '/$locale/admin/courses/$id/webhooks'
    | '/$locale/learner/collections/$collectionId/invite'
    | '/$locale/learner/collections/$collectionId/request'
    | '/$locale/learner/courses/$courseId/invite'
    | '/$locale/learner/courses/$courseId/play'
    | '/$locale/learner/courses/$courseId/request'
    | '/$locale/learner/collections/$collectionId'
    | '/$locale/learner/courses/$courseId'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/$locale/ai'
    | '/$locale/create-team'
    | '/$locale'
    | '/$locale/admin/certificate'
    | '/$locale/admin/keys'
    | '/$locale/admin/members'
    | '/$locale/admin/onboard'
    | '/$locale/admin/settings'
    | '/$locale/admin'
    | '/$locale/learner'
    | '/$locale/admin/collections/create'
    | '/$locale/admin/courses/create'
    | '/$locale/admin/collections/$id/courses'
    | '/$locale/admin/collections/$id/learners'
    | '/$locale/admin/collections/$id/settings'
    | '/$locale/admin/courses/$id/learners'
    | '/$locale/admin/courses/$id/modules'
    | '/$locale/admin/courses/$id/settings'
    | '/$locale/admin/courses/$id/webhooks'
    | '/$locale/learner/collections/$collectionId/invite'
    | '/$locale/learner/collections/$collectionId/request'
    | '/$locale/learner/courses/$courseId/invite'
    | '/$locale/learner/courses/$courseId/play'
    | '/$locale/learner/courses/$courseId/request'
    | '/$locale/learner/collections/$collectionId'
    | '/$locale/learner/courses/$courseId'
  id:
    | '__root__'
    | '/$locale/admin'
    | '/$locale/ai'
    | '/$locale/create-team'
    | '/$locale/'
    | '/$locale/admin/certificate'
    | '/$locale/admin/keys'
    | '/$locale/admin/members'
    | '/$locale/admin/onboard'
    | '/$locale/admin/settings'
    | '/$locale/admin/'
    | '/$locale/learner/'
    | '/$locale/admin/collections/create'
    | '/$locale/admin/courses/create'
    | '/$locale/admin/collections/$id/courses'
    | '/$locale/admin/collections/$id/learners'
    | '/$locale/admin/collections/$id/settings'
    | '/$locale/admin/courses/$id/learners'
    | '/$locale/admin/courses/$id/modules'
    | '/$locale/admin/courses/$id/settings'
    | '/$locale/admin/courses/$id/webhooks'
    | '/$locale/learner/collections/$collectionId/invite'
    | '/$locale/learner/collections/$collectionId/request'
    | '/$locale/learner/courses/$courseId/invite'
    | '/$locale/learner/courses/$courseId/play'
    | '/$locale/learner/courses/$courseId/request'
    | '/$locale/learner/collections/$collectionId/'
    | '/$locale/learner/courses/$courseId/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  LocaleAdminRoute: typeof LocaleAdminRouteWithChildren
  LocaleAiRoute: typeof LocaleAiRoute
  LocaleCreateTeamRoute: typeof LocaleCreateTeamRoute
  LocaleIndexRoute: typeof LocaleIndexRoute
  LocaleLearnerIndexRoute: typeof LocaleLearnerIndexRoute
  LocaleLearnerCollectionsCollectionIdInviteRoute: typeof LocaleLearnerCollectionsCollectionIdInviteRoute
  LocaleLearnerCollectionsCollectionIdRequestRoute: typeof LocaleLearnerCollectionsCollectionIdRequestRoute
  LocaleLearnerCoursesCourseIdInviteRoute: typeof LocaleLearnerCoursesCourseIdInviteRoute
  LocaleLearnerCoursesCourseIdPlayRoute: typeof LocaleLearnerCoursesCourseIdPlayRoute
  LocaleLearnerCoursesCourseIdRequestRoute: typeof LocaleLearnerCoursesCourseIdRequestRoute
  LocaleLearnerCollectionsCollectionIdIndexRoute: typeof LocaleLearnerCollectionsCollectionIdIndexRoute
  LocaleLearnerCoursesCourseIdIndexRoute: typeof LocaleLearnerCoursesCourseIdIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  LocaleAdminRoute: LocaleAdminRouteWithChildren,
  LocaleAiRoute: LocaleAiRoute,
  LocaleCreateTeamRoute: LocaleCreateTeamRoute,
  LocaleIndexRoute: LocaleIndexRoute,
  LocaleLearnerIndexRoute: LocaleLearnerIndexRoute,
  LocaleLearnerCollectionsCollectionIdInviteRoute:
    LocaleLearnerCollectionsCollectionIdInviteRoute,
  LocaleLearnerCollectionsCollectionIdRequestRoute:
    LocaleLearnerCollectionsCollectionIdRequestRoute,
  LocaleLearnerCoursesCourseIdInviteRoute:
    LocaleLearnerCoursesCourseIdInviteRoute,
  LocaleLearnerCoursesCourseIdPlayRoute: LocaleLearnerCoursesCourseIdPlayRoute,
  LocaleLearnerCoursesCourseIdRequestRoute:
    LocaleLearnerCoursesCourseIdRequestRoute,
  LocaleLearnerCollectionsCollectionIdIndexRoute:
    LocaleLearnerCollectionsCollectionIdIndexRoute,
  LocaleLearnerCoursesCourseIdIndexRoute:
    LocaleLearnerCoursesCourseIdIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/$locale/admin",
        "/$locale/ai",
        "/$locale/create-team",
        "/$locale/",
        "/$locale/learner/",
        "/$locale/learner/collections/$collectionId/invite",
        "/$locale/learner/collections/$collectionId/request",
        "/$locale/learner/courses/$courseId/invite",
        "/$locale/learner/courses/$courseId/play",
        "/$locale/learner/courses/$courseId/request",
        "/$locale/learner/collections/$collectionId/",
        "/$locale/learner/courses/$courseId/"
      ]
    },
    "/$locale/admin": {
      "filePath": "$locale/admin.tsx",
      "children": [
        "/$locale/admin/certificate",
        "/$locale/admin/keys",
        "/$locale/admin/members",
        "/$locale/admin/onboard",
        "/$locale/admin/settings",
        "/$locale/admin/",
        "/$locale/admin/collections/create",
        "/$locale/admin/courses/create",
        "/$locale/admin/collections/$id/courses",
        "/$locale/admin/collections/$id/learners",
        "/$locale/admin/collections/$id/settings",
        "/$locale/admin/courses/$id/learners",
        "/$locale/admin/courses/$id/modules",
        "/$locale/admin/courses/$id/settings",
        "/$locale/admin/courses/$id/webhooks"
      ]
    },
    "/$locale/ai": {
      "filePath": "$locale/ai.tsx"
    },
    "/$locale/create-team": {
      "filePath": "$locale/create-team.tsx"
    },
    "/$locale/": {
      "filePath": "$locale/index.tsx"
    },
    "/$locale/admin/certificate": {
      "filePath": "$locale/admin/certificate.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/keys": {
      "filePath": "$locale/admin/keys.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/members": {
      "filePath": "$locale/admin/members.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/onboard": {
      "filePath": "$locale/admin/onboard.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/settings": {
      "filePath": "$locale/admin/settings.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/": {
      "filePath": "$locale/admin/index.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/learner/": {
      "filePath": "$locale/learner/index.tsx"
    },
    "/$locale/admin/collections/create": {
      "filePath": "$locale/admin/collections/create.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/courses/create": {
      "filePath": "$locale/admin/courses/create.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/collections/$id/courses": {
      "filePath": "$locale/admin/collections/$id/courses.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/collections/$id/learners": {
      "filePath": "$locale/admin/collections/$id/learners.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/collections/$id/settings": {
      "filePath": "$locale/admin/collections/$id/settings.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/courses/$id/learners": {
      "filePath": "$locale/admin/courses/$id/learners.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/courses/$id/modules": {
      "filePath": "$locale/admin/courses/$id/modules.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/courses/$id/settings": {
      "filePath": "$locale/admin/courses/$id/settings.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/admin/courses/$id/webhooks": {
      "filePath": "$locale/admin/courses/$id/webhooks.tsx",
      "parent": "/$locale/admin"
    },
    "/$locale/learner/collections/$collectionId/invite": {
      "filePath": "$locale/learner/collections/$collectionId/invite.tsx"
    },
    "/$locale/learner/collections/$collectionId/request": {
      "filePath": "$locale/learner/collections/$collectionId/request.tsx"
    },
    "/$locale/learner/courses/$courseId/invite": {
      "filePath": "$locale/learner/courses/$courseId/invite.tsx"
    },
    "/$locale/learner/courses/$courseId/play": {
      "filePath": "$locale/learner/courses/$courseId/play.tsx"
    },
    "/$locale/learner/courses/$courseId/request": {
      "filePath": "$locale/learner/courses/$courseId/request.tsx"
    },
    "/$locale/learner/collections/$collectionId/": {
      "filePath": "$locale/learner/collections/$collectionId/index.tsx"
    },
    "/$locale/learner/courses/$courseId/": {
      "filePath": "$locale/learner/courses/$courseId/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
