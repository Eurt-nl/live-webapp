import { ref, computed } from 'vue';
import { usePocketbase } from './usePocketbase';
import { useI18n } from 'vue-i18n';

export interface LocalRule {
  id: string;
  title: string;
  description: string;
  hole?: number;
  type?: string[];
  active: boolean;
}

export interface CompactLocalRule {
  id: string;
  title: string;
  description: string;
  hole?: number;
  type?: string[];
}

export function useLocalRules() {
  const { t: $customT } = useI18n();
  const { pb } = usePocketbase();

  const localRules = ref<LocalRule[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Lokale regels ophalen voor een baan
  const fetchLocalRules = async (courseId: string): Promise<LocalRule[]> => {
    isLoading.value = true;
    error.value = null;

    try {
      const records = await pb.collection('local_rules').getList(1, 1000, {
        filter: `course = "${courseId}" && active = true`,
        sort: 'hole,title',
      });

      const rules = records.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        hole: item.hole || undefined,
        type: item.type || undefined,
        active: item.active,
      }));

      localRules.value = rules;
      isLoading.value = false;
      return rules;
    } catch (err) {
      console.error('Error fetching local rules:', err);
      error.value = $customT('rafi.localRules.fetchError');
      isLoading.value = false;
      return [];
    }
  };

  // Regels compacteren voor prompt
  const compactRulesForPrompt = (rules: LocalRule[]): CompactLocalRule[] => {
    return rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      description: rule.description,
      hole: rule.hole,
      type: rule.type,
    }));
  };

  // Regels filteren op hole
  const getRulesForHole = (hole: number): LocalRule[] => {
    return localRules.value.filter((rule) => rule.hole === hole);
  };

  // Regels filteren op type
  const getRulesByType = (type: string): LocalRule[] => {
    return localRules.value.filter((rule) => rule.type && rule.type.includes(type));
  };

  // Algemene regels (zonder specifieke hole)
  const getGeneralRules = (): LocalRule[] => {
    return localRules.value.filter((rule) => !rule.hole);
  };

  // Reset state
  const reset = () => {
    localRules.value = [];
    isLoading.value = false;
    error.value = null;
  };

  return {
    localRules: computed(() => localRules.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    fetchLocalRules,
    compactRulesForPrompt,
    getRulesForHole,
    getRulesByType,
    getGeneralRules,
    reset,
  };
}
