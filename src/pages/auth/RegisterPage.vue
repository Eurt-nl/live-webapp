<template>
  <div class="auth-container">
    <q-card class="auth-card">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">{{ $customT('auth.registerTitle') }}</div>
        <div class="text-subtitle2 text-center q-mb-lg">
          {{ $customT('auth.registerSubtitle') }}
        </div>

        <!-- Stap indicator -->
        <div class="step-indicator q-mb-lg">
          <div class="row items-center justify-center">
            <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
              <q-icon name="person" size="20px" />
              <span class="step-text">{{ $customT('auth.step1') }}</span>
            </div>
            <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
            <div class="step" :class="{ active: currentStep === 2 }">
              <q-icon name="lock" size="20px" />
              <span class="step-text">{{ $customT('auth.step2') }}</span>
            </div>
          </div>
        </div>

        <!-- Stap 1: Profiel Details -->
        <div v-if="currentStep === 1">
          <q-form @submit="nextStep" class="q-gutter-md">
            <q-input
              v-model="name"
              :label="$customT('profile.name')"
              :rules="[(val) => !!val || $customT('profile.nameRequired')]"
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
                  $customT('profile.invalidBirthyear'),
              ]"
              lazy-rules
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
              :loading="coursesLoading"
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
              :loading="categoriesLoading"
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
              :loading="countriesLoading"
            />

            <div class="row q-gutter-sm">
              <q-btn
                type="submit"
                color="primary"
                class="col"
                :loading="loading"
                :disable="!isStep1Complete"
                :label="$customT('auth.nextStep')"
              />
            </div>
          </q-form>
        </div>

        <!-- Stap 2: Account Details -->
        <div v-if="currentStep === 2">
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

            <div class="row q-gutter-sm">
              <q-btn
                type="button"
                color="grey"
                class="col"
                :label="$customT('auth.previousStep')"
                @click="previousStep"
              />
              <q-btn
                type="submit"
                color="primary"
                class="col"
                :loading="loading"
                :label="$customT('auth.createAccount')"
              />
            </div>
          </q-form>
        </div>

        <div class="text-center q-mt-md">
          <span class="text-body2">{{ $customT('auth.hasAccount') }} </span>
          <q-btn flat color="primary" :label="$customT('auth.loginLink')" to="/auth/login" />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useLocationStore } from 'stores/location';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const { t: $customT } = useI18n();
const { pb } = usePocketbase();
const locationStore = useLocationStore();

// Stap management
const currentStep = ref(1);

// Stap 1: Profiel Details
const name = ref('');
const birthyear = ref<number | null>(null);
const homecourse = ref('');
const category = ref('');
const country = ref('');

// Stap 2: Account Details
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

// Loading states
const loading = ref(false);
const coursesLoading = ref(false);
const categoriesLoading = ref(false);
const countriesLoading = ref(false);

// Data voor dropdowns
const allCourses: { id: string; name: string }[] = [];
const coursesOptions = ref<{ id: string; name: string }[]>([]);
const categories = ref<{ id: string; name: string; description: string }[]>([]);
const allCountries: { id: string; name: string; flag?: string }[] = [];
const countriesOptions = ref<{ id: string; name: string; flag?: string }[]>([]);

// Computed properties
const isStep1Complete = computed(() => {
  return !!(name.value && birthyear.value && homecourse.value && category.value && country.value);
});

// Functies voor data laden
const loadAllCourses = async () => {
  try {
    coursesLoading.value = true;
    const banen: { id: string; name: string }[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const result = await pb.collection('courses').getList(page, perPage, {
        sort: 'name',
        // Verwijder de filter omdat is_active veld mogelijk niet bestaat
      });

      banen.push(...result.items.map((course: Record<string, unknown>) => ({
        id: typeof course.id === 'string' ? course.id : '',
        name: typeof course.name === 'string' ? course.name : '',
      })));

      if (result.items.length < perPage) break;
      page++;
    }

    allCourses.length = 0;
    allCourses.push(...banen);
    coursesOptions.value = [...banen];
  } catch (error) {
    console.error('Error loading courses:', error);
    $q.notify({
      color: 'warning',
      message: $customT('auth.loadCoursesError'),
      icon: 'warning',
    });
  } finally {
    coursesLoading.value = false;
  }
};

const loadCategories = async () => {
  try {
    categoriesLoading.value = true;
    const result = await pb.collection('categories').getList(1, 50, {
      sort: 'name',
      filter: 'cat_type = "user"',
    });
    categories.value = result.items.map((category: Record<string, unknown>) => ({
      id: typeof category.id === 'string' ? category.id : '',
      name: typeof category.name === 'string' ? category.name : '',
      description: typeof category.description === 'string' ? category.description : '',
    }));
  } catch (error) {
    console.error('Error loading categories:', error);
    $q.notify({
      color: 'warning',
      message: $customT('auth.loadCategoriesError'),
      icon: 'warning',
    });
  } finally {
    categoriesLoading.value = false;
  }
};

const loadCountries = async () => {
  try {
    countriesLoading.value = true;
    const result = await pb.collection('countries').getList(1, 300, {
      sort: 'name',
    });
    const countries = result.items.map((country: Record<string, unknown>) => ({
      id: typeof country.id === 'string' ? country.id : '',
      name: typeof country.name === 'string' ? country.name : '',
      flag: typeof country.flag === 'string' ? country.flag : undefined,
    }));

    allCountries.length = 0;
    allCountries.push(...countries);
    countriesOptions.value = [...countries];
  } catch (error) {
    console.error('Error loading countries:', error);
    $q.notify({
      color: 'warning',
      message: $customT('auth.loadCountriesError'),
      icon: 'warning',
    });
  } finally {
    countriesLoading.value = false;
  }
};

// Filter functies
const filterCourses = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    const needle = val.toLowerCase();
    coursesOptions.value = allCourses.filter((c) => c.name.toLowerCase().includes(needle));
  });
};

const filterCountries = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    const needle = val.toLowerCase();
    countriesOptions.value = allCountries.filter((c) => c.name.toLowerCase().includes(needle));
  });
};

// GPS locatie voor automatische land selectie
const detectCountryFromGPS = async () => {
  try {
    await locationStore.getUserLocation();
    if (locationStore.userLocation) {
      // Hier zou je een reverse geocoding service kunnen gebruiken
      // Voor nu laten we het handmatig
      console.log('GPS location detected:', locationStore.userLocation);
    }
  } catch (error) {
    console.log('GPS not available or denied');
  }
};

// Navigatie tussen stappen
const nextStep = () => {
  if (isStep1Complete.value) {
    currentStep.value = 2;
  }
};

const previousStep = () => {
  currentStep.value = 1;
};

// Registratie
const onSubmit = async () => {
  try {
    loading.value = true;
    const data = {
      name: name.value,
      email: email.value.toLowerCase(), // Zorg dat email lowercase is
      password: password.value,
      passwordConfirm: confirmPassword.value,
      birthyear: birthyear.value!,
      homecourse: homecourse.value,
      category: category.value,
      country: country.value,
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

// Laad data bij mount
onMounted(async () => {
  await Promise.all([
    loadAllCourses(),
    loadCategories(),
    loadCountries(),
    detectCountryFromGPS(),
  ]);
});
</script>

<style scoped>
.auth-container {
  width: 100%;
  max-width: 500px;
  padding: 16px;
}

.auth-card {
  width: 100%;
}

.step-indicator {
  margin-bottom: 2rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  opacity: 0.5;
}

.step.active {
  opacity: 1;
  background-color: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}

.step.completed {
  opacity: 1;
  color: #4caf50;
}

.step-text {
  font-size: 0.75rem;
  margin-top: 0.25rem;
  text-align: center;
}

.step-line {
  width: 60px;
  height: 2px;
  background-color: #e0e0e0;
  margin: 0 1rem;
  transition: background-color 0.3s ease;
}

.step-line.completed {
  background-color: #4caf50;
}
</style>
