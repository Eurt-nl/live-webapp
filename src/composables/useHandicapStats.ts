import { ref, computed } from 'vue';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useI18n } from 'vue-i18n';

// Interface voor handicap data uit de view
interface HandicapData {
  id: string;
  player_id: string;
  player_name: string;
  round_id: string;
  round_date: string;
  rounds_so_far: number;
  pool_count: number;
  used_rounds: number;
  handicap_at_round: number;
}

// Interface voor handicap statistieken
interface HandicapStats {
  currentHandicap: number | null;
  handicapHistory: HandicapData[];
  totalRounds: number;
  loading: boolean;
  error: string | null;
}

export function useHandicapStats() {
  const { t: $customT } = useI18n();
  const authStore = useAuthStore();
  const { pb } = usePocketbase();

  // Reactieve variabelen
  const loading = ref(true);
  const error = ref<string | null>(null);
  const handicapData = ref<HandicapData[]>([]);

  // Haal handicap data op uit de vw_handicap view
  const fetchHandicapData = async () => {
    try {
      loading.value = true;
      error.value = null;

      const userId = authStore.user?.id;
      if (!userId) {
        throw new Error('Geen gebruiker gevonden');
      }

      // Haal data op uit de vw_handicap view voor de huidige gebruiker
      const result = await pb.collection('vw_handicap').getList(1, 100, {
        filter: `player_id = "${userId}"`,
        sort: 'round_date',
      });

      handicapData.value = result.items as HandicapData[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout';
      console.error('Fout bij ophalen handicap data:', err);
    } finally {
      loading.value = false;
    }
  };

  // Computed properties
  const currentHandicap = computed(() => {
    if (handicapData.value.length === 0) return null;
    // Neem de laatste handicap uit de geschiedenis
    return handicapData.value[handicapData.value.length - 1]?.handicap_at_round || null;
  });

  const totalRounds = computed(() => {
    if (handicapData.value.length === 0) return 0;
    return handicapData.value[handicapData.value.length - 1]?.rounds_so_far || 0;
  });

  const handicapHistory = computed(() => {
    return handicapData.value;
  });

  // Formatteer datum als dd-mm-yyyy
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL');
  };

  // ECharts configuratie voor handicap grafiek
  const getHandicapChartOption = computed(() => {
    if (handicapData.value.length === 0) {
      return {
        title: {
          text: $customT('stats.notEnoughRounds'),
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#999',
            fontSize: 14,
          },
        },
      };
    }

    const dates = handicapData.value.map((item) => formatDate(item.round_date));
    const handicaps = handicapData.value.map((item) => item.handicap_at_round);

    return {
      title: {
        text: $customT('stats.handicapDevelopment'),
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          const handicap = data.value;
          const sign = handicap > 0 ? '+' : '';
          return `${data.name}<br/>${$customT('stats.myHandicap')}: ${sign}${handicap.toFixed(1)}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => (value > 0 ? '+' : '') + value,
        },
        splitLine: {
          interval: 0.5,
        },
      },
      series: [
        {
          name: $customT('stats.myHandicap'),
          type: 'line',
          data: handicaps,
          smooth: true,
          lineStyle: {
            color: '#1976d2',
            width: 3,
          },
          itemStyle: {
            color: '#1976d2',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(25, 118, 210, 0.3)' },
                { offset: 1, color: 'rgba(25, 118, 210, 0.05)' },
              ],
            },
          },
          symbol: 'circle',
          symbolSize: 6,
        },
      ],
    };
  });

  return {
    // Data
    loading,
    error,
    handicapData,

    // Computed
    currentHandicap,
    totalRounds,
    handicapHistory,

    // Methods
    fetchHandicapData,
    formatDate,
    getHandicapChartOption,
  };
}
