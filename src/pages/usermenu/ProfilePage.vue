<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">{{ $customT('profile.title') }}</div>
    </div>
    <div class="profile-container">
      <q-card class="profile-card">
        <q-card-section>
          <!-- Avatar sectie -->
          <div class="row justify-center q-mb-lg">
            <div class="avatar-container">
              <q-avatar size="120px" class="q-mb-sm">
                <img :src="avatarUrl" alt="Profiel foto" />
              </q-avatar>
              <q-btn
                color="primary"
                icon="photo_camera"
                :label="$customT('profile.changePhoto')"
                @click="triggerFileInput"
                class="full-width"
              />
              <input
                type="file"
                ref="fileInput"
                @change="handleFileUpload"
                accept="image/*"
                style="display: none"
              />
            </div>
          </div>

          <q-form ref="profileForm" @submit="onSubmit" class="q-gutter-md">
            <q-input
              v-model="name"
              type="text"
              :label="$customT('profile.name')"
              id="name"
              name="name"
              autocomplete="name"
              :rules="[(val) => !!val || $customT('profile.nameRequired')]"
            />

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
              disable
            />

            <q-input
              v-model="birthyear"
              type="number"
              :label="$customT('profile.birthyear')"
              id="birthyear"
              name="birthyear"
              autocomplete="bday-year"
              :rules="[
                (val) => !!val || $customT('profile.birthyearRequired'),
                (val) => val >= 1900 || $customT('profile.invalidBirthyear'),
                (val) => val <= new Date().getFullYear() || $customT('profile.invalidBirthyear'),
              ]"
            />

            <q-select
              v-model="homecourse"
              :options="coursesOptions"
              :label="$customT('profile.homecourse')"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              use-input
              input-debounce="0"
              clearable
              @filter="filterCourses"
              :rules="[(val) => !!val || $customT('profile.homecourseRequired')]"
            />

            <q-select
              v-model="category"
              :options="categories"
              :label="$customT('profile.category')"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              :rules="[(val) => !!val || $customT('profile.categoryRequired')]"
            >
              <template v-slot:option="{ itemProps, opt }">
                <q-item v-bind="itemProps">
                  <q-item-section>
                    <q-item-label>{{ opt.name }}</q-item-label>
                    <q-item-label caption>{{ opt.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-select
              v-model="country"
              :options="countriesOptions"
              :label="$customT('profile.country')"
              option-label="name"
              option-value="id"
              emit-value
              map-options
              use-input
              input-debounce="0"
              clearable
              @filter="filterCountries"
              :rules="[(val) => !!val || $customT('profile.countryRequired')]"
            />

            <!-- Knoppen naast elkaar -->
            <div class="row q-gutter-sm">
              <q-btn
                type="submit"
                color="primary"
                class="col"
                :loading="loading"
                :label="$customT('profile.save')"
              />
              <q-btn
                type="button"
                color="grey"
                class="col"
                :label="$customT('profile.cancel')"
                @click="annuleerWijzigingen"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import { debug } from 'src/utils/debug';
import { getAvatarUrl } from 'src/utils/avatar-utils';

const $q = useQuasar();
const $router = useRouter();
const authStore = useAuthStore();
const fileInput = ref<HTMLInputElement | null>(null);
const profileForm = ref<Record<string, unknown> | null>(null);
const pb = usePocketbase();

const name = ref('');
const email = ref('');
const birthyear = ref(0);
const homecourse = ref('');
const category = ref('');
const loading = ref(false);
const avatarUrl = ref('');
// allCountries is de bronlijst met alle landen (voor filtering)
let allCountries: { id: string; name: string; flag?: string }[] = [];
// countriesOptions is de reactieve lijst die getoond wordt in de QSelect
const countriesOptions = ref<{ id: string; name: string; flag?: string }[]>([]);
const country = ref('');

// allCourses is de bronlijst met alle banen (voor filtering)
let allCourses: { id: string; name: string }[] = [];
// coursesOptions is de reactieve lijst die getoond wordt in de QSelect
const coursesOptions = ref<{ id: string; name: string }[]>([]);
const categories = ref([]);

// Haal alle banen op met paginering (type safe, geen any)
const loadAllCourses = async () => {
  const banen: { id: string; name: string }[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 1;
  do {
    const result = await pb.collection('courses').getList(page, perPage, { sort: 'name' });
    banen.push(
      ...result.items.map((course: Record<string, unknown>) => ({
        id: typeof course.id === 'string' ? course.id : '',
        name: typeof course.name === 'string' ? course.name : '',
      })),
    );
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  allCourses = banen;
  coursesOptions.value = [...allCourses]; // Initieel alle banen tonen
};

// Haal alle landen op met paginering (standaard Quasar aanpak)
const loadCountries = async () => {
  const landen: { id: string; name: string; flag?: string }[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 1;
  do {
          const result = await pb.collection('countries').getList(page, perPage);
    landen.push(
      ...result.items.map((item: Record<string, unknown>) => ({
        id: typeof item.id === 'string' ? item.id : '',
        name: typeof item.name === 'string' ? item.name : '',
        flag: typeof item.flag === 'string' ? item.flag : '',
      })),
    );
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  allCountries = landen;
  countriesOptions.value = [...allCountries]; // Initieel alle landen tonen
};

// Custom filterfunctie voor landen QSelect
function filterCountries(val: string, update: (callback: () => void) => void) {
  update(() => {
    // Filter de landenlijst op basis van de ingevoerde tekst (case-insensitive)
    const needle = val.toLowerCase();
    countriesOptions.value = allCountries.filter((c) => c.name.toLowerCase().includes(needle));
  });
}

// Custom filterfunctie voor banen QSelect (Homecourse)
function filterCourses(val: string, update: (callback: () => void) => void) {
  update(() => {
    // Filter de banenlijst op basis van de ingevoerde tekst (case-insensitive)
    const needle = val.toLowerCase();
    coursesOptions.value = allCourses.filter((c) => c.name.toLowerCase().includes(needle));
  });
}

onMounted(async () => {
  try {
    // Haal alle banen op
    await loadAllCourses();
    // Haal alle landen op
    await loadCountries();
    // Haal de categories op uit PocketBase
    const categoriesResult = await pb.collection('categories').getList(1, 50, {
      sort: 'name',
      filter: 'cat_type = "user"',
    });
    categories.value = categoriesResult.items.map((category: Record<string, unknown>) => ({
      id: typeof category.id === 'string' ? category.id : '',
      name: typeof category.name === 'string' ? category.name : '',
      description: typeof category.description === 'string' ? category.description : '',
      type: typeof category.type === 'string' ? category.type : '',
      metadata: category.metadata,
    }));

    if (authStore.user) {
      name.value = authStore.user.name;
      email.value = authStore.user.email;
      birthyear.value = authStore.user.birthyear;
      homecourse.value = authStore.user.homecourse || '';
      category.value = authStore.user.category || '';
      const userCountry = (authStore.user as Record<string, unknown>).country;
      country.value = typeof userCountry === 'string' ? userCountry : '';
      // Gebruik getAvatarUrl voor consistente avatar weergave
      avatarUrl.value = getAvatarUrl(authStore.user);
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.loadDataError'),
      icon: 'error',
    });
  }
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    debug('Selected file:', file);

    try {
      loading.value = true;

      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('name', name.value);
      formData.append('birthyear', birthyear.value.toString());
      if (homecourse.value) formData.append('homecourse', homecourse.value);
      if (category.value) formData.append('category', category.value);
      if (country.value) formData.append('country', country.value);

      debug('Sending form data:', {
        name: name.value,
        birthyear: birthyear.value,
        homecourse: homecourse.value,
        category: category.value,
        hasAvatar: !!file,
        country: country.value,
      });

      const success = await authStore.updateProfile({
        name: name.value,
        birthyear: birthyear.value,
        homecourse: homecourse.value,
        category: category.value,
        avatar: file,
        country: country.value,
      });

      if (success) {
        debug('Profile update successful');
        $q.notify({
          color: 'positive',
          message: $customT('notifications.profileUpdated'),
          icon: 'check',
        });

        // Update de avatar URL na succesvolle upload
        avatarUrl.value = getAvatarUrl(authStore.user);
      } else {
        throw new Error('Profiel bijwerken mislukt');
      }
    } catch {
      $q.notify({
        color: 'negative',
        message: $customT('notifications.profileUpdateError'),
        icon: 'error',
      });
    } finally {
      loading.value = false;
    }
  }
};

// Annuleer-knop: ga terug naar vorige pagina
function annuleerWijzigingen() {
  $router.back();
}

const onSubmit = async () => {
  try {
    // Valideer alle velden eerst
    const isValid = await profileForm.value?.validate();

    if (!isValid) {
      // Als validatie faalt, stop hier en toon alle fouten
      return;
    }

    loading.value = true;
    const success = await authStore.updateProfile({
      name: name.value,
      birthyear: birthyear.value,
      homecourse: homecourse.value,
      category: category.value,
      country: country.value,
    });

    if (success) {
      $q.notify({
        color: 'positive',
        message: $customT('notifications.profileUpdated'),
        icon: 'check',
      });
      // Ga terug naar de vorige pagina na succesvol opslaan
      $router.back();
    } else {
      throw new Error('Profiel bijwerken mislukt');
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.profileUpdateError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.profile-container {
  width: 100%;
  max-width: 400px;
  padding: 16px;
}

.profile-card {
  width: 100%;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 200px;
}
</style>
