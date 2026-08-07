import LoginPage from '../pages/auth/login.vue';
import RegisterPage from '../pages/auth/register.vue';
import HomeDashboardPage from '../pages/home/index.vue';
import HomePage from '../pages/demo/home.vue';
import AboutPage from '../pages/demo/about.vue';
import FormPage from '../pages/demo/form.vue';
import CatalogPage from '../pages/demo/catalog.vue';
import ProductPage from '../pages/demo/product.vue';
import SettingsPage from '../pages/demo/settings.vue';
import DynamicRoutePage from '../pages/demo/dynamic-route.vue';
import RequestAndLoad from '../pages/demo/request-and-load.vue';
import NotFoundPage from '../pages/demo/404.vue';
import PeoplePage from '../pages/people/index.vue';
import EventsPage from '../pages/events/index.vue';
import EventDetailPage from '../pages/events/detail.vue';
import EvSessionsPage from '../pages/ev-sessions/index.vue';
import EvSessionDetailPage from '../pages/ev-sessions/session-detail.vue';
import MorePage from '../pages/more/index.vue';

import { isAuthenticated } from './auth';
import { can, hasAnyPermission } from './rbac';

interface RouteUser {
  firstName: string;
  lastName: string;
  about: string;
  links: { title: string; url: string }[];
}

interface RouteParams {
  router: any;
  to: { params: Record<string, string> };
  resolve: (component: object, options?: object) => void;
}

// ── Guards ────────────────────────────────────────────────────────────────────

/**
 * Requires the user to be authenticated.
 * Redirects to the login screen (main view `/`) on failure.
 * Uses a regular function so Framework7 sets `this` to the router instance.
 */
function requireAuth(
  this: any,
  _to: unknown,
  _from: unknown,
  resolve: () => void,
  reject: () => void,
): void {
  if (isAuthenticated()) {
    resolve();
  } else {
    reject();
    this.navigate('/', { reloadCurrent: true });
  }
}

/**
 * Returns a guard that requires at least one of the given permissions.
 * Falls back to the home dashboard if the user lacks all of them.
 */
function requireAnyPermission(permissions: string[]) {
  return function(
    this: any,
    _to: unknown,
    _from: unknown,
    resolve: () => void,
    reject: () => void,
  ): void {
    if (!isAuthenticated()) {
      reject();
      this.navigate('/', { reloadCurrent: true });
      return;
    }
    if (hasAnyPermission(permissions)) {
      resolve();
    } else {
      reject();
      // Navigate the main view to home — this guard fires in a tab view router,
      // so we activate the home tab rather than pushing into the current tab.
      this.app?.tab?.show?.('#view-home');
    }
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

const routes = [
  {
    path: '/',
    component: LoginPage,
  },
  {
    path: '/home/',
    component: HomeDashboardPage,
    beforeEnter: [requireAuth],
  },
  {
    path: '/register/',
    component: RegisterPage,
  },
  {
    path: '/demo/home/',
    component: HomePage,
  },
  {
    path: '/demo/about/',
    component: AboutPage,
  },
  {
    path: '/demo/form/',
    component: FormPage,
  },
  {
    path: '/demo/catalog/',
    component: CatalogPage,
  },
  {
    path: '/demo/product/:id/',
    component: ProductPage,
  },
  {
    path: '/demo/settings/',
    component: SettingsPage,
  },
  {
    path: '/people/',
    component: PeoplePage,
    beforeEnter: [requireAnyPermission(['view_people', 'view_contacts'])],
  },
  {
    path: '/events/',
    component: EventsPage,
    beforeEnter: [requireAnyPermission(['view_events'])],
  },
  {
    path: '/events/:id/',
    component: EventDetailPage,
    beforeEnter: [requireAnyPermission(['view_events'])],
  },
  {
    path: '/ev-sessions/',
    component: EvSessionsPage,
    beforeEnter: [requireAnyPermission(['view_campaigns'])],
  },
  {
    path: '/ev-sessions/:id/',
    component: EvSessionDetailPage,
    beforeEnter: [requireAnyPermission(['view_campaigns'])],
  },
  {
    path: '/more/',
    component: MorePage,
    beforeEnter: [requireAuth],
  },
  {
    path: '/demo/dynamic-route/blog/:blogId/post/:postId/',
    component: DynamicRoutePage,
  },
  {
    path: '/demo/request-and-load/user/:userId/',
    async: ({ router, to, resolve }: RouteParams) => {
      const app = router.app;
      app.preloader.show();

      const userId = to.params.userId;

      setTimeout(() => {
        const user: RouteUser = {
          firstName: 'Vladimir',
          lastName: 'Kharlampidi',
          about: 'Hello, i am creator of Framework7! Hope you like it!',
          links: [
            {
              title: 'Framework7 Website',
              url: 'http://framework7.io',
            },
            {
              title: 'Framework7 Forum',
              url: 'http://forum.framework7.io',
            },
          ],
        };
        app.preloader.hide();

        resolve(
          { component: RequestAndLoad },
          { props: { user } }
        );
      }, 1000);
    },
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;
