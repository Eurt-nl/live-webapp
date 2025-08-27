import { ref, computed } from 'vue';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';

// Interface voor hole statistieken uit de view
interface HoleStatsData {
  id: string;
  player_id: string;
  player_name: string;
  course_id: string;
  course_name: string;
  hole_number: number;
  total_rounds: number;
  pct1: number; // hole-in-one
  pct2: number; // birdie
  pct3: number; // par
  pct4: number; // bogey
  pct5: number; // dbl. bogey
  pct6plus: number; // >5
}

export function useHoleStats() {
  const authStore = useAuthStore();
  const { pb } = usePocketbase();

  // Reactieve variabelen
  const loading = ref(true);
  const error = ref<string | null>(null);
  const holeStatsData = ref<HoleStatsData[]>([]);

  // Haal hole statistieken op uit de vw_player_course_hole_stroke_distribution view
  const fetchHoleStats = async (courseId: string) => {
    try {
      loading.value = true;
      error.value = null;

      const userId = authStore.user?.id;
      if (!userId) {
        throw new Error('Geen gebruiker gevonden');
      }

      // Haal data op uit de vw_player_course_hole_stroke_distribution view
      const result = await pb
        .collection('vw_player_course_hole_stroke_distribution')
        .getList(1, 100, {
          filter: `player_id = "${userId}" && course_id = "${courseId}"`,
          sort: 'hole_number',
        });

      holeStatsData.value = result.items as HoleStatsData[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout';
      console.error('Fout bij ophalen hole statistieken:', err);
    } finally {
      loading.value = false;
    }
  };

  // ECharts configuratie voor hole statistieken (stacked bar chart)
  const getHoleRadialChartOption = computed(() => {
    if (holeStatsData.value.length === 0) {
      return {
        title: {
          text: 'Geen hole data beschikbaar',
          left: 'center',
          top: 'center',
          textStyle: {
            color: '#999',
            fontSize: 14,
          },
        },
      };
    }

    // Bereid data voor voor de chart (hole 1 bovenaan, hole 18 onderaan)
    const sortedHoles = holeStatsData.value.sort((a, b) => a.hole_number - b.hole_number);
    const holes = sortedHoles.map((hole) => hole.hole_number.toString()).reverse();

    // Maak datasets voor elke score type
    const datasets = [];
    const scoreTypes = [
      { key: 'pct1', name: 'Hole-in-one', color: '#4CAF50' },
      { key: 'pct2', name: 'Birdie', color: '#8BC34A' },
      { key: 'pct3', name: 'Par', color: '#FFC107' },
      { key: 'pct4', name: 'Bogey', color: '#FF9800' },
      { key: 'pct5', name: 'Dbl. Bogey', color: '#FF5722' },
      { key: 'pct6plus', name: '>5', color: '#F44336' },
    ];

    for (const scoreType of scoreTypes) {
      const data = sortedHoles
        .map((hole) => {
          const value = hole[scoreType.key as keyof HoleStatsData];
          return value || 0;
        })
        .reverse();

      // Alleen toevoegen als er data is
      if (data.some((value) => value > 0)) {
        datasets.push({
          name: scoreType.name,
          type: 'bar',
          data: data,
          stack: 'total',
          itemStyle: {
            color: scoreType.color,
          },
        });
      }
    }

    return {
      title: {
        text: 'Hole Performance Distribution',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const paramsArray = params as Array<{ name: string; value: number; seriesName: string }>;
          let result = `${paramsArray[0].name}<br/>`;
          paramsArray.forEach((param) => {
            if (param.value > 0) {
              result += `${param.seriesName}: ${param.value}%<br/>`;
            }
          });
          return result;
        },
      },
      legend: {
        orient: 'horizontal',
        bottom: 10,
        data: datasets.map((dataset) => dataset.name),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%',
        },
      },
      yAxis: {
        type: 'category',
        data: holes,
        axisLabel: {
          fontSize: 10,
        },
      },
      series: datasets,
    };
  });

  return {
    // Data
    loading,
    error,
    holeStatsData,

    // Methods
    fetchHoleStats,
    getHoleRadialChartOption,
  };
}
