<template>
  <div class="local-rules-manager">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h6">{{ $customT('courses.localRules') }}</div>
      <q-btn
        color="primary"
        icon="add"
        :label="$customT('courses.addLocalRule')"
        @click="openAddDialog"
        unelevated
      />
    </div>

    <!-- Local Rules lijst -->
    <div v-if="localRules.length > 0" class="row q-col-gutter-md">
      <div v-for="rule in localRules" :key="rule.id" class="col-12">
        <q-card flat bordered class="rule-card">
          <q-card-section>
            <!-- Titel -->
            <div class="text-h6 q-mb-md">{{ rule.title }}</div>

            <!-- Beschrijving -->
            <div class="text-body2 q-mb-md" v-html="rule.description"></div>

            <!-- Chips in een rij -->
            <div class="row q-gutter-sm q-mb-md">
              <q-chip
                :color="rule.active ? 'positive' : 'grey'"
                text-color="white"
                size="sm"
                square
                :label="rule.active ? $customT('common.active') : $customT('common.inactive')"
              />
              <q-chip
                color="secondary"
                text-color="white"
                size="sm"
                square
                :label="getRuleTypeName(rule.type)"
              />
              <q-chip
                v-if="rule.hole_id && rule.hole_id.length > 0"
                color="primary"
                text-color="white"
                size="sm"
                square
                :label="`${$customT('holes.hole')} ${getHoleNumbers(rule.hole_id).join(', ')}`"
              />
              <q-chip
                v-else
                color="info"
                text-color="white"
                size="sm"
                square
                :label="$customT('courses.ruleGeneral')"
              />
            </div>

            <!-- Knoppen -->
            <div class="row justify-end q-gutter-sm">
              <q-btn
                color="primary"
                icon="edit"
                size="sm"
                @click="openEditDialog(rule)"
                :label="$customT('courses.edit')"
                flat
              />
              <q-btn
                color="negative"
                icon="delete"
                size="sm"
                @click="deleteRule(rule.id)"
                :label="$customT('courses.delete')"
                flat
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Geen regels bericht -->
    <div v-else class="text-center q-pa-lg">
      <q-icon name="rule" size="64px" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-md">
        {{ $customT('courses.noLocalRules') }}
      </div>
      <div class="text-body2 text-grey-5 q-mt-sm">
        {{ $customT('courses.addLocalRuleHint') }}
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            {{ isEditing ? $customT('courses.editLocalRule') : $customT('courses.addLocalRule') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="saveRule" class="q-gutter-md">
            <q-input
              v-model="formData.title"
              :label="$customT('courses.ruleTitle')"
              :rules="[(val) => !!val || $customT('validation.required')]"
              maxlength="100"
              counter
            />

            <q-select
              v-model="formData.type"
              :options="ruleTypeOptions"
              :label="$customT('courses.ruleType')"
              :rules="[(val) => (val && val.length > 0) || $customT('validation.required')]"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              multiple
              use-chips
            />

            <!-- Hole selectie - alleen tonen bij hole_specific type -->
            <q-select
              v-if="showHoleSelection"
              v-model="formData.hole_id"
              :options="holeOptions"
              :label="$customT('courses.ruleHole')"
              :hint="$customT('courses.ruleHoleHint')"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              multiple
              :rules="[
                (val) =>
                  !showHoleSelection ||
                  (val && val.length > 0) ||
                  $customT('courses.holeSelectionRequired'),
              ]"
            />

            <q-input
              v-model="formData.description"
              :label="$customT('courses.ruleDescription')"
              type="textarea"
              autogrow
              :rules="[(val) => !!val || $customT('validation.required')]"
              rows="4"
            />

            <div class="row items-center q-gutter-sm">
              <q-toggle
                v-model="formData.active"
                :label="$customT('courses.ruleActive')"
                color="primary"
              />
              <q-space />
              <q-chip
                :color="formData.active ? 'positive' : 'grey'"
                text-color="white"
                size="sm"
                :label="formData.active ? $customT('common.active') : $customT('common.inactive')"
              />
            </div>

            <div class="row justify-end q-gutter-sm">
              <q-btn :label="$customT('courses.cancel')" color="grey" v-close-popup />
              <q-btn
                :label="$customT('courses.save')"
                type="submit"
                color="primary"
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Bevestigingsdialoog voor verwijderen -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">{{ $customT('courses.deleteLocalRuleConfirm') }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$customT('courses.cancel')" color="grey" v-close-popup />
          <q-btn
            flat
            :label="$customT('courses.delete')"
            color="negative"
            @click="confirmDeleteRule"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { debug } from 'src/utils/debug';

interface LocalRule {
  id: string;
  course: string;
  hole?: number;
  hole_id?: string[];
  title: string;
  description: string;
  type: { category: string }[] | { category: string };
  active: boolean;
  created: string;
  updated: string;
}

interface FormData {
  id?: string;
  title: string;
  description: string;
  type: { category: string }[];
  hole_id?: string[];
  active: boolean;
}

const props = defineProps<{
  courseId: string;
}>();

const $q = useQuasar();
const { t: $customT } = useI18n();
const { pb } = usePocketbase();

const localRules = ref<LocalRule[]>([]);
const holes = ref<Array<{ id: string; hole: number }>>([]);
const dialogOpen = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const ruleToDelete = ref<string | null>(null);

const formData = ref<FormData>({
  title: '',
  description: '',
  type: [{ category: 'general' }],
  hole_id: undefined,
  active: true,
});

// Vereenvoudigde rule type opties - alleen general en hole specifiek
const ruleTypeOptions = [
  { label: $customT('courses.ruleTypeGeneral'), value: { category: 'general' } },
  { label: $customT('courses.ruleTypeHoleSpecific'), value: { category: 'hole_specific' } },
];

// Hole opties voor de select dropdown - alleen holes van deze baan
const holeOptions = computed(() => {
  return holes.value.map((hole) => ({
    label: `${$customT('holes.hole')} ${hole.hole}`,
    value: hole.id,
  }));
});

// Computed property om te bepalen of hole selectie getoond moet worden
const showHoleSelection = computed(() => {
  return formData.value.type.some((type) => type.category === 'hole_specific');
});

const getRuleTypeName = (types: { category: string }[] | { category: string }) => {
  // Handle both old format (single object) and new format (array)
  const typesArray = Array.isArray(types) ? types : [types];

  if (!typesArray || typesArray.length === 0) return '';
  if (typesArray.length === 1) {
    const option = ruleTypeOptions.find((opt) => opt.value.category === typesArray[0].category);
    return option ? option.label : typesArray[0].category;
  }
  return typesArray
    .map((type) => {
      const option = ruleTypeOptions.find((opt) => opt.value.category === type.category);
      return option ? option.label : type.category;
    })
    .join(', ');
};

// Helper functie om hole nummers op te halen uit hole_id array
const getHoleNumbers = (holeIds: string[]): number[] => {
  return holeIds
    .map((id) => holes.value.find((hole) => hole.id === id)?.hole)
    .filter((holeNumber) => holeNumber !== undefined);
};

const loadHoles = async () => {
  try {
    const result = await pb.collection('course_detail').getList(1, 50, {
      filter: `course = "${props.courseId}"`,
      sort: 'hole',
    });
    holes.value = result.items.map((item: Record<string, unknown>) => ({
      id: item.id,
      hole: item.hole,
    }));
  } catch (error) {
    debug('Error loading holes:', error);
  }
};

const loadLocalRules = async () => {
  try {
    const result = await pb.collection('local_rules').getList(1, 50, {
      filter: `course = "${props.courseId}"`,
      sort: 'created',
    });
    localRules.value = result.items as LocalRule[];
  } catch (error) {
    debug('Error loading local rules:', error);
  }
};

const openAddDialog = () => {
  isEditing.value = false;
  formData.value = {
    title: '',
    description: '',
    type: [{ category: 'general' }],
    hole_id: undefined,
    active: true,
  };
  dialogOpen.value = true;
};

const openEditDialog = (rule: LocalRule) => {
  isEditing.value = true;
  formData.value = {
    id: rule.id,
    title: rule.title,
    description: rule.description,
    type: Array.isArray(rule.type) ? rule.type : [rule.type],
    hole_id: rule.hole_id || undefined,
    active: rule.active,
  };
  dialogOpen.value = true;
};

// Watch voor type wijzigingen - reset hole_id als type verandert naar general
watch(
  () => formData.value.type,
  (newType) => {
    if (
      newType &&
      newType.length > 0 &&
      !newType.some((type) => type.category === 'hole_specific')
    ) {
      // Als type niet meer hole_specific is, reset hole_id
      formData.value.hole_id = undefined;
    }
  },
  { deep: true },
);

const saveRule = async () => {
  if (
    !formData.value.title.trim() ||
    !formData.value.description.trim() ||
    !formData.value.type ||
    formData.value.type.length === 0
  )
    return;

  // Validatie: als type hole_specific is, moet er minimaal één hole geselecteerd zijn
  if (
    formData.value.type.some((type) => type.category === 'hole_specific') &&
    (!formData.value.hole_id || formData.value.hole_id.length === 0)
  ) {
    $q.notify({
      color: 'negative',
      message: $customT('courses.holeSelectionRequired'),
      icon: 'error',
    });
    return;
  }

  try {
    saving.value = true;

    const ruleData = {
      course: props.courseId,
      hole: null, // Oude veld wordt niet meer gebruikt
      hole_id: formData.value.hole_id || null,
      title: formData.value.title,
      description: formData.value.description,
      type: formData.value.type.length > 0 ? formData.value.type : [{ category: 'general' }],
      active: formData.value.active,
    };

    if (isEditing.value && formData.value.id) {
      await pb.collection('local_rules').update(formData.value.id, ruleData);
    } else {
      await pb.collection('local_rules').create(ruleData);
    }

    $q.notify({
      color: 'positive',
      message: isEditing.value
        ? $customT('courses.localRuleUpdated')
        : $customT('courses.localRuleAdded'),
      icon: 'check',
    });

    dialogOpen.value = false;
    await loadLocalRules();
  } catch (error) {
    debug('Error saving local rule:', error);
    $q.notify({
      color: 'negative',
      message: $customT('courses.localRuleSaveError'),
      icon: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const deleteRule = (ruleId: string) => {
  ruleToDelete.value = ruleId;
  deleteDialog.value = true;
};

const confirmDeleteRule = async () => {
  if (!ruleToDelete.value) return;

  try {
    await pb.collection('local_rules').delete(ruleToDelete.value);

    $q.notify({
      color: 'positive',
      message: $customT('courses.localRuleDeleted'),
      icon: 'check',
    });

    deleteDialog.value = false;
    ruleToDelete.value = null;
    await loadLocalRules();
  } catch (error) {
    debug('Error deleting local rule:', error);
    $q.notify({
      color: 'negative',
      message: $customT('courses.localRuleDeleteError'),
      icon: 'error',
    });
  }
};

onMounted(async () => {
  await loadHoles();
  await loadLocalRules();
});

watch(
  () => props.courseId,
  async () => {
    await loadHoles();
    await loadLocalRules();
  },
);
</script>

<style lang="scss" scoped>
.local-rules-manager {
  width: 100%;
}

.rule-card {
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

:deep(.q-card__section) {
  padding: 16px;
}

:deep(.q-input--outlined) {
  .q-field__control {
    border-radius: 8px;
  }
}

:deep(.q-select--outlined) {
  .q-field__control {
    border-radius: 8px;
  }
}
</style>
