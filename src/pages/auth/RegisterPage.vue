<template>
  <div class="auth-container">
    <q-card class="auth-card">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">{{ $customT('auth.registerTitle') }}</div>
        <div class="text-subtitle2 text-center q-mb-lg">
          {{ $customT('auth.registerSubtitle') }}
        </div>

        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="name"
            :label="$customT('profile.name')"
            :rules="[(val) => !!val || $customT('profile.nameRequired')]"
            lazy-rules
          />

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

          <q-input
            v-model="birthyear"
            type="number"
            :label="$customT('profile.birthyear')"
            :rules="[
              (val) => !!val || $customT('profile.birthyearRequired'),
              (val) =>
                (val >= 1900 && val <= new Date().getFullYear()) ||
                $customT('profile.birthyearInvalid'),
            ]"
            lazy-rules
          />

          <q-input
            v-model="password"
            type="password"
            :label="$customT('auth.password')"
            :rules="[
              (val) => !!val || $customT('auth.passwordRequired'),
              (val) => val.length >= 8 || $customT('auth.passwordMinLength'),
            ]"
            lazy-rules
          />

          <q-input
            v-model="confirmPassword"
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
              :label="$customT('auth.registering')"
            />
          </div>

          <div class="text-center q-mt-md">
            <span class="text-body2">{{ $customT('auth.hasAccount') }} </span>
            <q-btn flat color="primary" :label="$customT('auth.loginLink')" to="/auth/login" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const $customT = inject('$customT') as (key: string, params?: Record<string, any>) => string

const name = ref('');
const email = ref('');
const birthyear = ref<number | null>(null);
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);

const onSubmit = async () => {
  try {
    loading.value = true;
    const data = {
      name: name.value,
      email: email.value,
      password: password.value,
      passwordConfirm: confirmPassword.value,
      birthyear: birthyear.value,
    };

    const success = await authStore.register(data);

    if (success) {
      $q.notify({
        color: 'positive',
        message: $customT('auth.registerSuccess'),
        icon: 'check',
      });
      void router.push('/auth/login');
    } else {
      throw new Error('Registreren mislukt');
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('auth.registerFailed'),
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
