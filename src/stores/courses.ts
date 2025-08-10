import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from './auth';

// Store voor de banen (courses) van de ingelogde gebruiker
export const useCoursesStore = defineStore('courses', () => {
  // State: lijst van banen waar de gebruiker eigenaar of moderator is
  const courses = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // PocketBase instance
  const { pb } = usePocketbase();
  const authStore = useAuthStore();

  // Laad de banen van de huidige gebruiker
  async function fetchUserCourses() {
    if (!authStore.user?.id) {
      courses.value = [];
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      const userId = authStore.user.id;
      const result = await pb.collection('courses').getList(1, 50, {
        filter: `owner = "${userId}" || moderators ?~ "${userId}"`,
        sort: 'name',
        expand: 'category',
      });
      // Voeg role informatie toe aan elke baan
      courses.value = result.items.map((course) => ({
        ...course,
        role: course.owner === userId ? 'owner' : 'moderator',
      }));
    } catch (err) {
      error.value = err;
      courses.value = [];
    } finally {
      loading.value = false;
    }
  }

  // Handige getter: heeft de gebruiker banen?
  const hasCourses = () => courses.value.length > 0;

  // Methode om courses direct in te stellen (voor externe updates)
  function setCourses(newCourses) {
    courses.value = newCourses;
  }

  return {
    courses,
    loading,
    error,
    fetchUserCourses,
    hasCourses,
    setCourses,
  };
});
