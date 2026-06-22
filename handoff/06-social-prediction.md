# 06 — Social Prediction Engine (Port Python → TypeScript)

## Objetivo

Portar o `SocialPredictionEngine` do protótipo Python para TypeScript.
Este módulo modela como informações se propagam na vizinhança.

## Motivação (Capítulo 1 do Vigia)

> "Recomendo manter atenção à janela da cozinha. Existe alta probabilidade
> de a dona Marlene descobrir essa informação antes do final da semana. [...]
> 97,4%." — "Três dias depois toda a rua já sabia."

## Arquivo a criar

```
src/reasoning/social-prediction.ts
```

## Modelo de Dados

```typescript
export interface SocialPrediction {
  predictionId: string;
  topic: string;                    // O que será descoberto
  probability: number;              // 0 a 1
  estimatedTimeframe: string;       // "antes do final da semana", "em 3 dias"
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  keyActors: string[];              // Pessoas envolvidas
  propagationPath: string[];        // Caminho provável
  createdAt: Date;
  verified: boolean;
  verifiedAt: Date | null;
  outcome: string | null;           // "Previsão social confirmada"
}

export interface GossipGraph {
  nodes: Map<string, GossipNode>;
  edges: Map<string, GossipEdge[]>;
}

export interface GossipNode {
  personId: string;
  name: string | null;
  gossipFactor: number;             // 0.3 = discreto, 1.5 = fofoqueiro
  interactionFrequency: Map<string, number>; // pessoaId → frequência/semana
}

export interface GossipEdge {
  from: string;
  to: string;
  frequency: number;                // interações por semana
}
```

## Classe Principal

```typescript
export class SocialPredictionEngine {
  private predictions: SocialPrediction[] = [];

  constructor(
    private memory?: MemorySystem,
    private knowledgeGraph?: unknown, // será KnowledgeGraph quando existir
  ) {}

  /**
   * Prediz se e quando uma informação chegará a uma pessoa.
   */
  async predictInformationSpread(params: {
    secretTopic: string;
    whoKnows: string[];              // personIds que já sabem
    targetPerson: string;            // quem vai descobrir?
    neighborhood: string[];          // personIds da vizinhança
    maxDays?: number;                // default 7
  }): Promise<SocialPrediction>;

  async verifyPrediction(predictionId: string, cameTrue: boolean): Promise<void>;

  getActivePredictions(): SocialPrediction[];
}
```

## Algoritmo de Predição

```
1. Constrói grafo de fofoca da vizinhança
   - Quem conversa com quem
   - Frequência de interação

2. Calcula distância social entre whoKnows e targetPerson (BFS)
   - Distância 0: target já sabe → probability = 1.0
   - Distância 1: alguém que sabe conversa diretamente com target
   - Distância 2: amigo de amigo
   - Distância 3+: improvável no curto prazo

3. Calcula probabilidade:
   - baseProb: { 0: 1.0, 1: 0.9, 2: 0.7, 3: 0.4, default: 0.1 }
   - interactionFreq: frequência média de interação no caminho
   - gossipFactor: fator do target (0.3 a 1.5)
   - probability = clip(baseProb * interactionFreq * gossipFactor, 0.01, 0.999)

4. Estima timeframe:
   - prob > 0.9 → "nas próximas 24 horas"
   - prob > 0.7 → "antes do final da semana" (3 dias)
   - prob > 0.4 → "dentro de N dias"
   - else → "provavelmente não antes de N*2 dias"

5. Retorna SocialPrediction
```

## Cálculo da Distância Social (BFS)

```typescript
private socialDistance(
  graph: Map<string, string[]>,
  sources: string[],
  target: string,
): number {
  if (sources.includes(target)) return 0;

  const visited = new Set(sources);
  const queue: Array<[string, number]> = sources.map(s => [s, 0]);

  while (queue.length > 0) {
    const [current, dist] = queue.shift()!;
    if (current === target) return dist;
    for (const neighbor of (graph.get(current) ?? [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return 999; // inalcançável
}
```

## Grafo de Fofoca (Simulado)

```typescript
private buildGossipGraph(neighborhood: string[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  // Simulação: cada pessoa está conectada a 2-4 vizinhos aleatórios
  for (const person of neighborhood) {
    const connections: string[] = [];
    const others = neighborhood.filter(p => p !== person);

    // 2-4 conexões aleatórias
    const numConnections = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < Math.min(numConnections, others.length); i++) {
      const randomIdx = Math.floor(Math.random() * others.length);
      const friend = others[randomIdx]!;
      if (!connections.includes(friend)) {
        connections.push(friend);
      }
    }

    graph.set(person, connections);
  }

  return graph;
}
```

## Fator de Fofoqueirice

```typescript
private async getGossipFactor(personId: string): Promise<number> {
  // Tenta buscar dos metadados da pessoa
  if (this.memory) {
    const person = await this.memory.personRegistry.get(personId);
    if (person) {
      if (person.tags.includes("discreto")) return 0.3;
      if (person.tags.includes("fofoqueiro")) return 1.5;
    }
  }
  return 1.0; // neutro
}
```

## Integração com o Agent

O agente expõe um método público:

```typescript
// Em agent.ts
async predictGossip(topic: string, whoKnows: string[], target: string) {
  if (this.socialPredictor) {
    return this.socialPredictor.predictInformationSpread({
      secretTopic: topic,
      whoKnows,
      targetPerson: target,
      neighborhood: this.memory.personRegistry.allPersons().map(p => p.personId),
    });
  }
  return null;
}
```

## Verificação

```typescript
const engine = new SocialPredictionEngine();

const prediction = await engine.predictInformationSpread({
  secretTopic: "Dona Olinda está namorando homem 31 anos mais novo",
  whoKnows: ["person_manuel"],
  targetPerson: "person_marlene",
  neighborhood: ["person_manuel", "person_marlene", "person_celia", "person_jose"],
});

console.log(`Probabilidade: ${(prediction.probability * 100).toFixed(1)}%`);
console.log(`Timeframe: ${prediction.estimatedTimeframe}`);

// Simular verificação 3 dias depois
await engine.verifyPrediction(prediction.predictionId, true);
// → "Previsão social confirmada"
```

## Dependências

- `src/memory/system.ts` — `MemorySystem` (opcional)
- `src/core/logger.ts` — `logger`

## Entregáveis

- [ ] `src/reasoning/social-prediction.ts`
- [ ] `SocialPrediction` interface
- [ ] `SocialPredictionEngine` class
- [ ] `predictInformationSpread()` com BFS
- [ ] `buildGossipGraph()` (simulado)
- [ ] `getGossipFactor()` (via tags)
- [ ] `verifyPrediction()`
- [ ] Compila com `tsc --noEmit`
