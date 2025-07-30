<template>
  <div class="auth-container">
    <q-card class="auth-card">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">{{ $customT('auth.resetPasswordTitle') }}</div>
        <div class="text-subtitle2 text-center q-mb-lg">
          {{ $customT('auth.resetPasswordSubtitle') }}
        </div>

        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="password"
            type="password"
            :label="$customT('auth.newPassword')"
            :rules="[
              (val) => !!val || $customT('auth.passwordRequired'),
              (val) => val.length >= 8 || $customT('auth.passwordMinLength'),
            ]"
            lazy-rules
          />

          <q-input
            v-model="passwordConfirm"
            type="password"
            :label="$customT('auth.confirmPassword')"
            :rules="[
              (val) => !!val || $customT('auth.confirmPasswordRequired'),
              (val) => val === password || $customT('auth.passwordsNotMatch'),
            ]"
            lazy-rules
          />

          <div>
            <q-btn
              type="submit"
              color="primary"
              class="full-width"
              :loading="loading"
              :label="$customT('auth.resetPassword')"
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
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t: $customT } = useI18n();

const password = ref('');
const passwordConfirm = ref('');
const loading = ref(false);
const token = ref('');
const email = ref('');

onMounted(() => {
  // Haal token en email uit URL parameters
  token.value = route.query.token as string;
  email.value = route.query.email as string;

  if (!token.value || !email.value) {
    $q.notify({
      color: 'negative',
      message: $customT('auth.invalidResetLink'),
      icon: 'error',
    });
    void router.push('/auth/login');
  }
});

const onSubmit = async () => {
  try {
    loading.value = true;
    const success = await authStore.confirmPasswordReset(token.value, email.value, password.value);

    if (success) {
      $q.notify({
        color: 'positive',
        message: $customT('auth.passwordResetSuccess'),
        icon: 'check',
      });
      void router.push('/auth/login');
    } else {
      throw new Error('Password reset mislukt');
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('auth.passwordResetFailed'),
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