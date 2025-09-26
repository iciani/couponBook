export const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/dashboard.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'account-settings',
        component: () => import('@/pages/account-settings.vue'),
      },
      {
        path: 'typography',
        component: () => import('@/pages/typography.vue'),
      },
      {
        path: 'icons',
        component: () => import('@/pages/icons.vue'),
      },
      {
        path: 'cards',
        component: () => import('@/pages/cards.vue'),
      },
      {
        path: 'tables',
        component: () => import('@/pages/tables.vue'),
      },
      {
        path: 'form-layouts',
        component: () => import('@/pages/form-layouts.vue'),
      },
    ],
  },
  {
    path: '/usuarios',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: 'index',
        name: 'usuarios.index',
        component: () => import('@/views/usuarios/UsuariosIndex.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
      {
        path: '/books',
        component: () => import('@/layouts/default.vue'),
        children: [
          {
            path: 'index',
            name: 'books.index',
            component: () => import('@/views/books/BooksIndex.vue'),
            meta: { requiresAuth: true },
          },
        ],
      },
      {
        path: '/cupones',
        component: () => import('@/layouts/default.vue'),
        children: [
          {
            path: 'index',
            name: 'cupones.index',
            component: () => import('@/views/cupones/CuponesIndex.vue'),
            meta: { requiresAuth: true },
          },
        ],
      },
      {
        path: '/asignaciones',
        component: () => import('@/layouts/default.vue'),
        children: [
          {
            path: 'index',
            name: 'asignaciones.index',
            component: () => import('@/views/asignaciones/AsignacionesIndex.vue'),
            meta: { requiresAuth: true },
          },
        ],
      },
      {
        path: '/canjes',
        component: () => import('@/layouts/default.vue'),
        children: [
          {
            path: 'index',
            name: 'canjes.index',
            component: () => import('@/views/canjes/CanjesIndex.vue'),
            meta: { requiresAuth: true },
          },
          {
            path: 'validar',
            name: 'canjes.validar',
            component: () => import('@/views/canjes/ValidarCanje.vue'),
            meta: { requiresAuth: true },
          },
        ],
      },
  {
    path: '/info',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: 'index',
        name: 'info.index',
        component: () => import('@/views/info/InfoIndex.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/sistema',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: 'bull-monitor',
        name: 'sistema.bull-monitor',
        component: () => import('@/views/sistema/BullMonitor.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: 'mi-perfil',
        name: 'usuarios.perfil',
        component: () => import('@/views/usuarios/MiPerfil.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        meta: { requiresAuth: false },
        component: () => import('@/pages/login.vue'),
      },
      {
        path: '/error',
        name: 'error',
        component: () => import('@/pages/[...error].vue'),
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: '/error?code=404',
      },
    ],
  },
]
