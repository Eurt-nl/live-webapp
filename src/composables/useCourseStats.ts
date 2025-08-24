import { ref, computed } from 'vue';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useI18n } from 'vue-i18n';

// Interface voor baan statistieken uit de view
interface CourseStatsData {
  id: string;
  player_id: string;
  player_name: string;
  course_id: string;
  course_name: string;
  rounds_count: number;
  best_score: number;
  worst_score: number;
  avg_score: number;
  last_round_date: string;
}

// Interface voor baan optie
interface CourseOption {
  value: string;
  label: string;
}

export function useCourseStats() {
  const { t: $customT } = useI18n();
  const authStore = useAuthStore();
  const { pb } = usePocketbase();

  // Reactieve variabelen
  const loading = ref(true);
  const error = ref<string | null>(null);
  const courseStatsData = ref<CourseStatsData[]>([]);
  const selectedCourseId = ref<string>('');
  const availableCourses = ref<CourseOption[]>([]);

  // Haal baan statistieken op uit de vw_player_course_round_stats view
  const fetchCourseStats = async () => {
    try {
      loading.value = true;
      error.value = null;

      const userId = authStore.user?.id;
      if (!userId) {
        throw new Error('Geen gebruiker gevonden');
      }

      // Haal data op uit de vw_player_course_round_stats view voor de huidige gebruiker
      const result = await pb.collection('vw_player_course_round_stats').getList(1, 100, {
        filter: `player_id = "${userId}"`,
        sort: 'course_name',
      });

      courseStatsData.value = result.items as CourseStatsData[];

      // Maak beschikbare banen lijst
      availableCourses.value = courseStatsData.value.map((course) => ({
        value: course.course_id,
        label: course.course_name,
      }));

      // Stel standaard baan in (homecourse van speler of eerste beschikbare baan)
      if (availableCourses.value.length > 0) {
        const userHomeCourse = authStore.user?.homecourse;
        if (userHomeCourse && availableCourses.value.find((c) => c.value === userHomeCourse)) {
          selectedCourseId.value = userHomeCourse;
        } else {
          selectedCourseId.value = availableCourses.value[0].value;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout';
      console.error('Fout bij ophalen baan statistieken:', err);
    } finally {
      loading.value = false;
    }
  };

  // Computed properties
  const currentCourseStats = computed(() => {
    if (!selectedCourseId.value) return null;
    return (
      courseStatsData.value.find((course) => course.course_id === selectedCourseId.value) || null
    );
  });

  const selectedCourseName = computed(() => {
    return (
      availableCourses.value.find((course) => course.value === selectedCourseId.value)?.label || ''
    );
  });

  // Computed property voor de geselecteerde baan object
  const selectedCourse = computed(() => {
    return availableCourses.value.find((course) => course.value === selectedCourseId.value) || null;
  });

  // Functie om baan te wijzigen
  const changeCourse = (courseId: string) => {
    selectedCourseId.value = courseId;
  };

  return {
    // Data
    loading,
    error,
    courseStatsData,
    selectedCourseId,
    availableCourses,
    currentCourseStats,
    selectedCourseName,
    selectedCourse,

    // Methods
    fetchCourseStats,
    changeCourse,
  };
}
