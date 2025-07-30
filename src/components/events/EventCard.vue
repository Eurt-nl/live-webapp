<template>
  <q-card class="my-card">
    <q-card-section>
      <div class="text-h6">{{ event.name }}</div>
      <div class="text-subtitle2">{{ event.location }}</div>
      <div class="text-caption">
        {{ formatDate(event.start_date) }} - {{ formatDate(event.end_date) }}
      </div>
      <div class="text-caption">
        {{ $customT('events.participants') }}: {{ registrationsCount || 0 }}/{{ event.max_players }}
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn
        flat
        color="primary"
        :label="$customT('events.details')"
        :to="`/events/${event.id}/edit`"
      />
      <q-btn
        flat
        color="primary"
        :label="$customT('events.participants')"
        :to="`/events/${event.id}/deelnemers`"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { formatDate } from 'src/utils/dateUtils';

const { t: $customT } = useI18n();

defineProps<{
  event: {
    id: string;
    name: string;
    location: string;
    start_date: string;
    end_date: string;
    max_players: number;
  };
  registrationsCount?: number;
}>();
</script>
