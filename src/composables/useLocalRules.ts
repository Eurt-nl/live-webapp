import { ref, computed } from 'vue';
import { usePocketbase } from './usePocketbase';
import { useI18n } from 'vue-i18n';

export interface LocalRule {
  id: string;
  title: string;
  description: string;
  hole?: number; // Oude veld - wordt niet meer gebruikt
  hole_id?: string[]; // Nieuwe veld - array van hole IDs
  type?: string[];
  active: boolean;
}

export interface CompactLocalRule {
  id: string;
  title: string;
  description: string;
  holeNumbers?: number[]; // Hole nummers in plaats van IDs
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
        sort: 'title',
        expand: 'hole_id', // Expand hole_id om hole nummers op te halen
      });

      const rules = records.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        hole: item.hole || undefined,
        hole_id: item.hole_id || undefined,
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

  // Regels compacteren voor prompt met hole nummers
  const compactRulesForPrompt = async (rules: LocalRule[]): Promise<CompactLocalRule[]> => {
    const compactRules: CompactLocalRule[] = [];

    for (const rule of rules) {
      let holeNumbers: number[] | undefined;

      if (rule.hole_id && rule.hole_id.length > 0) {
        try {
          // Haal hole nummers op uit de hole_id array
          const holeDetails = await Promise.all(
            rule.hole_id.map(async (holeId) => {
              try {
                const holeRecord = await pb.collection('course_detail').getOne(holeId);
                return holeRecord.hole;
              } catch (error) {
                console.error(`Error fetching hole ${holeId}:`, error);
                return null;
              }
            }),
          );

          // Filter null values en sorteer
          holeNumbers = holeDetails
            .filter((holeNum): holeNum is number => holeNum !== null)
            .sort((a, b) => a - b);
        } catch (error) {
          console.error('Error fetching hole numbers:', error);
          holeNumbers = undefined;
        }
      }

      compactRules.push({
        id: rule.id,
        title: rule.title,
        description: rule.description,
        holeNumbers,
        type: rule.type,
      });
    }

    return compactRules;
  };

  // Regels filteren op hole nummer
  const getRulesForHole = (holeNumber: number): LocalRule[] => {
    return localRules.value.filter((rule) => {
      // Check oude hole veld (fallback)
      if (rule.hole === holeNumber) return true;

      // Check nieuwe hole_id veld
      if (rule.hole_id && rule.hole_id.length > 0) {
        // Hier zou je de hole nummers moeten ophalen uit de hole_id array
        // Voor nu returnen we false - dit wordt opgelost in de prompt logica
        return false;
      }

      return false;
    });
  };

  // Regels filteren op type
  const getRulesByType = (type: string): LocalRule[] => {
    return localRules.value.filter((rule) => rule.type && rule.type.includes(type));
  };

  // Algemene regels (zonder specifieke hole)
  const getGeneralRules = (): LocalRule[] => {
    return localRules.value.filter((rule) => {
      // Geen hole_id of lege hole_id array
      return !rule.hole_id || rule.hole_id.length === 0;
    });
  };

  // Hole-specifieke regels
  const getHoleSpecificRules = (): LocalRule[] => {
    return localRules.value.filter((rule) => {
      return rule.hole_id && rule.hole_id.length > 0;
    });
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
    getHoleSpecificRules,
    reset,
  };
}
