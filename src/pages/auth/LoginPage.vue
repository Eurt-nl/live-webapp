<template>
  <div class="auth-container">
    <q-card class="auth-card">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">{{ $customT('auth.welcome') }}</div>
        <div class="text-subtitle2 text-center q-mb-lg">{{ $customT('auth.loginTitle') }}</div>

        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            :label="$customT('auth.email')"
            id="email"
            name="email"
            autocomplete="email"
            :rules="[
              (val) => !!val || $customT('auth.emailRequired'),
              (val) => /.+@.+\..+/.test(val) || $customT('auth.invalidEmail'),
            ]"
            lazy-rules
          />

          <q-input
            v-model="password"
            type="password"
            :label="$customT('auth.password')"
            id="password"
            name="password"
            autocomplete="current-password"
            :rules="[(val) => !!val || $customT('auth.passwordRequired')]"
            lazy-rules
          />

          <div class="row justify-between items-center">
            <q-checkbox
              v-model="rememberMe"
              :label="$customT('auth.rememberMe')"
              id="rememberMe"
              name="rememberMe"
            />
            <q-btn
              flat
              color="primary"
              :label="$customT('auth.forgotPassword')"
              to="/auth/forgot-password"
            />
          </div>

          <div>
            <q-btn
              type="submit"
              color="primary"
              class="full-width"
              :loading="loading"
              :label="$customT('auth.login')"
            />
          </div>

          <div class="text-center q-mt-md">
            <span class="text-body2">{{ $customT('auth.noAccount') }} </span>
            <q-btn
              flat
              color="primary"
              :label="$customT('auth.registerLink')"
              to="/auth/register"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import { useProfileCheck } from 'src/composables/useProfileCheck';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();
const { t: $customT } = useI18n();

const { checkProfileCompleteness } = useProfileCheck();

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);

const onSubmit = async () => {
  try {
    loading.value = true;
    const success = await authStore.login(email.value, password.value);

    if (success) {
      $q.notify({
        color: 'positive',
        message: $customT('auth.loginSuccess'),
        icon: 'check',
      });

      // Controleer of het profiel compleet is na succesvolle login
      checkProfileCompleteness();

      void router.push('/');
    } else {
      throw new Error('Inloggen mislukt');
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('auth.loginFailed'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 16px;
}

.auth-card {
  width: 100%;
}
</style>
