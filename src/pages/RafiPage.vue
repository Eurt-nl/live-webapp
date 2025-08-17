<template>
  <q-page class="rafi-page">
    <div v-if="!authStore.isAuthenticated" class="login-required-container">
      <div class="text-center q-pa-lg">
        <q-avatar size="120px" class="q-mb-md">
          <img src="/rafi-avatar.png" alt="Rafi" />
        </q-avatar>
        <div class="text-h5 q-mb-md">Meet Rafi: AI Pitch & Putt Referee</div>
        <div class="text-body1 q-mb-lg">
          {{ $customT('rafi.loginRequired') }}
        </div>
        <q-btn
          color="primary"
          :label="$customT('auth.login')"
          @click="$router.push('/auth/login')"
          size="lg"
        />
      </div>
    </div>
    <div v-else class="rafi-container">
      <RafiChat />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import RafiChat from '../components/RafiChat.vue';

const router = useRouter();
const { t: $customT } = useI18n();
const authStore = useAuthStore();
</script>

<style scoped>
.rafi-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.rafi-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
}

/* Login required container */
.login-required-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-required-container .q-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Responsive design */
@media (max-width: 600px) {
  .rafi-container {
    max-width: 100%;
    margin: 0;
  }

  .login-required-container {
    min-height: 50vh;
    padding: 20px;
  }
}
</style>
