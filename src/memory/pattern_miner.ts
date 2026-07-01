/**
 * Pattern Miner — Comparação de frequências com categorias de referência.
 */

import type { PersonRecord } from "../core/types.js";
import type { MemorySystem } from "./system.js";
import type { RoutineLearner } from "./routine-learner.js";

export interface FrequencyComparison {
  personId: string;
  frequencyPerWeek: number;
  daysAnalyzed: number;
  totalSightings: number;
  comparisons: Record<
    string,
    {
      referenceFrequency: number;
      personFrequency: number;
      ratio: number;
      interpretation: string;
    }
  >;
  conclusion: string;
}

export class PatternMiner {
  constructor(
    private memory?: MemorySystem,
    private routineLearner?: RoutineLearner,
  ) {}

  async compareFrequencies(
    personId: string,
    days = 60,
  ): Promise<FrequencyComparison> {
    const person = this.memory
      ? await this.memory.personRegistry.get(personId)
      : undefined;

    const frequencyPerWeek = person
      ? person.totalVisits / Math.max(1, days / 7)
      : 0;

    const references: Record<string, number> = {
      parentes: 1.5,
      entregadores: 5.0,
      prestadores: 1.0,
      vizinhos: 3.0,
      visitantes: 0.5,
    };

    const comparisons: FrequencyComparison["comparisons"] = {};
    for (const [category, refFreq] of Object.entries(references)) {
      const ratio = frequencyPerWeek / Math.max(0.01, refFreq);
      comparisons[category] = {
        referenceFrequency: Math.round(refFreq * 100) / 100,
        personFrequency: Math.round(frequencyPerWeek * 100) / 100,
        ratio: Math.round(ratio * 100) / 100,
        interpretation:
          ratio > 2
            ? "muito acima"
            : ratio > 1.3
              ? "acima"
              : ratio > 0.7
                ? "similar"
                : ratio > 0.3
                  ? "abaixo"
                  : "muito abaixo",
      };
    }

    const maxRatio = Math.max(
      ...Object.values(comparisons).map((c) => c.ratio),
    );
    const conclusion =
      maxRatio > 2
        ? `Frequência (${frequencyPerWeek.toFixed(1)}/sem) significativamente superior. Probabilidade elevada de relacionamento próximo.`
        : maxRatio > 1.3
          ? `Frequência (${frequencyPerWeek.toFixed(1)}/sem) moderadamente acima do padrão.`
          : `Frequência (${frequencyPerWeek.toFixed(1)}/sem) dentro dos padrões normais.`;

    return {
      personId,
      frequencyPerWeek: Math.round(frequencyPerWeek * 100) / 100,
      daysAnalyzed: days,
      totalSightings: person?.totalVisits ?? 0,
      comparisons,
      conclusion,
    };
  }
}
