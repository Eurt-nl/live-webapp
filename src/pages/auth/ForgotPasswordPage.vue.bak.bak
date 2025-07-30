<template>
  <div class="auth-container">
    <q-card class="auth-card">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">{{ $customT('auth.forgotPasswordTitle') }}</div>
        <div class="text-subtitle2 text-center q-mb-lg">
          {{ $customT('auth.forgotPasswordSubtitle') }}
        </div>

        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            :label="$customT('auth.email')"
            :rules="[
              (val) => !!val || $customT('auth.emailRequired'),
              (val) => /.+@.+\..+/.test(val) || $customT('auth.invalidEmail'),
            ]"
            lazy-rules
          />

          <div>
            <q-btn
              type="submit"
              color="primary"
              class="full-width"
              :loading="loading"
              :label="$customT('auth.requestResetLink')"
            />
          </div>

          <div class="text-center q-mt-md">
            <span class="text-body2">{{ $customT('auth.backToLogin') }} </span>
            <q-btn flat color="primary" :label="$customT('auth.loginLink')" to="/auth/login" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const $customT = inject('$customT') as (key: string, params?: Record<string, any>) => string;

const email = ref('');
const loading = ref(false);

const onSubmit = async () => {
  try {
    loading.value = true;
    const success = await authStore.requestPasswordRese$customT(email.value);

    if (success) {
      $q.notify({
        color: 'positive',
        message: $customT('auth.resetLinkSent'),
        icon: 'check',
      });
      void router.push('/auth/login');
    } else {
      throw new Error('Reset link aanvragen mislukt');
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('auth.resetLinkFailed'),
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
