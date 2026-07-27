import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/change-password',
      name: 'ChangePassword',
      component: () => import('../views/auth/ChangePasswordView.vue'),
    },
    {
      path: '/',
      component: () => import('../components/layout/AppLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/dashboard/DashboardView.vue'),
        },
        {
          path: 'kanban',
          name: 'Kanban',
          component: () => import('../views/dashboard/KanbanView.vue'),
        },
        {
          path: 'prediction/occupancy',
          name: 'OccupancyPrediction',
          component: () => import('../views/prediction/OccupancyPredictionView.vue'),
        },
        {
          path: 'prediction/revenue',
          name: 'RevenuePrediction',
          component: () => import('../views/prediction/RevenuePredictionView.vue'),
        },
        {
          path: 'prediction/price',
          name: 'PricePrediction',
          component: () => import('../views/prediction/PricePredictionView.vue'),
        },
        {
          path: 'suggestions',
          name: 'Suggestions',
          component: () => import('../views/suggestions/SuggestionListView.vue'),
        },
        {
          path: 'suggestions/:id',
          name: 'SuggestionDetail',
          component: () => import('../views/suggestions/SuggestionDetailView.vue'),
        },
        {
          path: 'approvals',
          name: 'Approvals',
          component: () => import('../views/approvals/ApprovalListView.vue'),
        },
        {
          path: 'approvals/:id',
          name: 'ApprovalDetail',
          component: () => import('../views/approvals/ApprovalDetailView.vue'),
        },
        {
          path: 'rooms',
          name: 'Rooms',
          component: () => import('../views/rooms/RoomListView.vue'),
        },
        {
          path: 'room-types',
          name: 'RoomTypes',
          component: () => import('../views/rooms/RoomTypeView.vue'),
        },
        {
          path: 'competitors',
          name: 'Competitors',
          component: () => import('../views/dashboard/CompetitorView.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('../views/settings/SettingsView.vue'),
        },
        {
          path: 'onboarding',
          name: 'Onboarding',
          component: () => import('../views/onboarding/OnboardingWizardView.vue'),
        },
        {
          path: 'config',
          name: 'Config',
          component: () => import('../views/config/ConfigManagementView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (!to.meta.public && !token) {
    return { name: 'Login' }
  }
})

export default router
