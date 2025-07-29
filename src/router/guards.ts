import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from 'stores/auth';
import { debug } from 'src/utils/debug';
import { useProfileCheck } from 'src/composables/useProfileCheck';

export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  try {
    const authStore = useAuthStore();

    // Controleer eerst of we al een token hebben
    if (!authStore.token) {
      const storedAuth = localStorage.getItem('pb_auth');
      if (storedAuth) {
        try {
          const { token, model } = JSON.parse(storedAuth);
          if (token && model) {
            authStore.pb.authStore.save(token, model);
          }
        } catch {
          localStorage.removeItem('pb_auth');
        }
      }
    }

    const isAuthenticated = await authStore.checkAuth();

    // Als we op de login pagina zijn en al ingelogd, redirect naar home
    if (to.path === '/auth/login' && isAuthenticated) {
      next('/');
      return;
    }

    // Als de route authenticatie vereist en we niet ingelogd zijn, redirect naar login
    if (to.meta.requiresAuth && !isAuthenticated) {
      next('/auth/login');
      return;
    }

    // Anders, ga door met navigatie
    next();
  } catch {
    // Bij een fout, redirect naar login
    next('/auth/login');
  }
};

/**
 * Router guard voor profiel compleetheid check
 * Voert een profiel check uit voor ingelogde gebruikers (behalve op de profielpagina zelf)
 */
export const profileCheckGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  try {
    const authStore = useAuthStore();

    // Alleen uitvoeren als gebruiker is ingelogd
    if (authStore.isAuthenticated && authStore.user) {
      // Niet uitvoeren op de profielpagina zelf om oneindige loops te voorkomen
      if (to.path !== '/profile') {
        const { checkProfileCompleteness } = useProfileCheck();
        checkProfileCompleteness();
      }
    }

    next();
  } catch {
    debug('Profile check guard error');
    next();
  }
};
