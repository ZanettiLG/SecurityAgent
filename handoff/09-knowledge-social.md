# 09 — Knowledge Graph + Social Media Investigator

## Objetivo

Duas tarefas menores agrupadas:

1. **KnowledgeGraph**: Estrutura de grafo para relações entre entidades
   (Pessoa viu com Pessoa, Veículo associado a Pessoa, etc.)
2. **SocialMediaInvestigator**: Port do Python — busca em fontes públicas
   **após autorização explícita do usuário**.

---

## Tarefa 9.1: Knowledge Graph

### Arquivo a criar

```
src/memory/knowledge-graph.ts
```

### Modelo de Dados

```typescript
export type NodeType = "PERSON" | "VEHICLE" | "CAMERA" | "LOCATION" | "INCIDENT";
export type EdgeType = "VISITED_WITH" | "ASSOCIATED_WITH" | "SEEN_AT" | "ENTERED_THROUGH" | "OWNS";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  properties: Record<string, unknown>;
  createdAt: Date;
}
```

### Implementação (in-memory com interface para futuro Neo4j)

```typescript
export class KnowledgeGraph {
  private nodes = new Map<string, GraphNode>();
  private edges: GraphEdge[] = [];

  // ── Nodes ──
  addNode(node: GraphNode): void;
  getNode(id: string): GraphNode | undefined;
  findNodes(type: NodeType): GraphNode[];

  // ── Edges ──
  addEdge(from: string, to: string, type: EdgeType, properties?: Record<string, unknown>): void;
  getEdges(nodeId: string, edgeType?: EdgeType): GraphEdge[];
  getNeighbors(nodeId: string, edgeType?: EdgeType): GraphNode[];

  // ── Queries (Vigia) ──

  /** Pessoas que costumam visitar junto com a pessoa X */
  getCoVisitors(personId: string): string[];

  /** Veículos associados a uma pessoa */
  getVehiclesForPerson(personId: string): string[];

  /** Pessoas associadas a um veículo */
  getPersonsForVehicle(vehicleId: string): string[];

  /** Todas as pessoas vistas em uma câmera nos últimos N dias */
  getRecentVisitors(cameraId: string, days?: number): string[];

  /** Caminho mais curto entre duas pessoas (BFS) */
  shortestPath(fromId: string, toId: string): string[] | null;

  /** Distância social entre duas pessoas */
  socialDistance(fromId: string, toId: string): number;

  // ── Serialization ──
  toJSON(): { nodes: GraphNode[]; edges: GraphEdge[] };
  static fromJSON(data: { nodes: GraphNode[]; edges: GraphEdge[] }): KnowledgeGraph;
}
```

### Algoritmo de Shortest Path (BFS)

```typescript
shortestPath(fromId: string, toId: string): string[] | null {
  if (fromId === toId) return [fromId];

  const visited = new Set<string>([fromId]);
  const parent = new Map<string, string>();
  const queue: string[] = [fromId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = this.getNeighbors(current);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        parent.set(neighbor.id, current);
        queue.push(neighbor.id);

        if (neighbor.id === toId) {
          // Reconstrói caminho
          const path: string[] = [toId];
          let node = toId;
          while (parent.has(node)) {
            node = parent.get(node)!;
            path.unshift(node);
          }
          return path;
        }
      }
    }
  }

  return null;
}

socialDistance(fromId: string, toId: string): number {
  const path = this.shortestPath(fromId, toId);
  return path ? path.length - 1 : -1;
}
```

### Integração com VehicleTracker

Quando o usuário identifica um veículo ("É a dona Olinda"):

```typescript
// Em VehicleTracker.identifyVehicle()
this.knowledgeGraph?.addEdge(vehicleId, personId, "ASSOCIATED_WITH", {
  source: "user_feedback",
  timestamp: new Date().toISOString(),
});
```

### Integração com PersonRegistry

Quando duas pessoas são vistas juntas:

```typescript
// Em VisionPipeline, ao detectar múltiplas pessoas no mesmo frame
this.knowledgeGraph?.addEdge(personAId, personBId, "VISITED_WITH", {
  cameraId,
  timestamp: new Date().toISOString(),
  count: 1, // incrementado se já existir
});
```

---

## Tarefa 9.2: Social Media Investigator

### Arquivo a criar

```
src/processing/social-investigator.ts
```

### ⚠️ Princípio Ético

> **NUNCA investigar sem autorização explícita do usuário.**
> Apenas fontes PÚBLICAS. Nada de hacking, logins, ou fontes privadas.

### Modelo de Dados

```typescript
export interface SocialProfile {
  profileId: string;
  platform: string;             // "instagram", "facebook", "linkedin"
  name: string | null;
  username: string | null;
  bio: string | null;
  profileUrl: string | null;
  estimatedAge: number | null;
  ageRange: [number, number] | null;
  location: string | null;
  relationshipStatus: string | null;
  confidence: number;           // 0-1 match facial
  isPublic: boolean;
  foundAt: Date;
}

export interface InvestigationReport {
  reportId: string;
  targetPersonId: string;
  authorization: boolean;
  status: "idle" | "awaiting_authorization" | "in_progress" | "completed" | "denied";
  profilesFound: SocialProfile[];
  ageEstimate: number | null;
  relationshipInfo: Record<string, unknown>;
  summary: string;
  createdAt: Date;
  completedAt: Date | null;
}
```

### Classe Principal

```typescript
export class SocialMediaInvestigator {
  private activeInvestigations = new Map<string, InvestigationReport>();
  private authorizedPersonIds = new Set<string>();

  constructor(
    private memory?: MemorySystem,
    private llmClient?: LlmClient,
  ) {}

  // ── Autorização ──

  requestAuthorization(personId: string, reason: string): InvestigationReport;
  // Cria report em AWAITING_AUTHORIZATION
  // Retorna report para ser apresentado ao usuário

  authorize(reportId: string): void;
  // Usuário disse "sim"
  // Adiciona personId a authorizedPersonIds

  deny(reportId: string): void;
  // Usuário disse "não"

  // ── Investigação ──

  async investigate(reportId: string): Promise<InvestigationReport>;
  // SÓ executa se authorization = true
  // 1. Busca perfis públicos (simulado)
  // 2. Estima idade (via LLM analisando textos públicos)
  // 3. Identifica relacionamentos públicos
  // 4. Gera sumário

  // ── Consultas ──

  async estimateAgeDifference(personAId: string, personBId: string): Promise<{
    ageA: number | null;
    ageB: number | null;
    difference: number | null;
    significant: boolean;
  }>;

  async checkOtherRelationships(personId: string): Promise<Record<string, unknown>>;
}
```

### Implementação do `investigate`

```typescript
async investigate(reportId: string): Promise<InvestigationReport> {
  const report = this.activeInvestigations.get(reportId);
  if (!report || !report.authorization) {
    logger.warn(`Cannot investigate ${reportId}: not authorized`);
    return report!;
  }

  report.status = "in_progress";

  // 1. Busca perfis públicos (simulação)
  const profiles = await this.searchPublicProfiles(report.targetPersonId);
  report.profilesFound = profiles;

  // 2. Estima idade
  if (profiles.length > 0) {
    report.ageEstimate = await this.estimateAge(profiles);
  }

  // 3. Relacionamentos
  report.relationshipInfo = await this.findRelationships(profiles);

  // 4. Sumário via LLM
  if (this.llmClient) {
    report.summary = await this.llmClient.generateDailySummary([], "");
  } else {
    report.summary = `Investigação concluída. ${profiles.length} perfil(ns) público(s) encontrado(s).`;
  }

  report.status = "completed";
  report.completedAt = new Date();
  return report;
}

private async searchPublicProfiles(personId: string): Promise<SocialProfile[]> {
  // STUB — em produção:
  // - APIs de busca reversa de imagem (PimEyes, FaceCheck ID — com autorização)
  // - Scraping ético de perfis públicos
  // - APIs oficiais de redes sociais (dados públicos)
  logger.info({ personId }, "Public profile search (stub)");
  return [];
}
```

### Integração com QueryManager

Quando o usuário pergunta "Quem é essa pessoa?", o sistema oferece:

```
QueryManager: "Deseja autorizar investigação em fontes públicas
               sobre esta pessoa? (apenas dados públicos)"
```

## Verificação

```typescript
// Teste 9.1
const kg = new KnowledgeGraph();
kg.addNode({ id: "p1", type: "PERSON", label: "Manuel", properties: {} });
kg.addNode({ id: "p2", type: "PERSON", label: "Olinda", properties: {} });
kg.addNode({ id: "p3", type: "PERSON", label: "Marlene", properties: {} });
kg.addEdge("p1", "p2", "VISITED_WITH", {});
kg.addEdge("p2", "p3", "VISITED_WITH", {});

console.log("Co-visitors of p2:", kg.getCoVisitors("p2"));
console.log("Distance p1 → p3:", kg.socialDistance("p1", "p3")); // 2

// Teste 9.2
const investigator = new SocialMediaInvestigator();
const report = investigator.requestAuthorization("unknown_abc", "Pessoa vista 10x");
investigator.authorize(report.reportId);
const result = await investigator.investigate(report.reportId);
console.log("Status:", result.status, "Profiles:", result.profilesFound.length);
```

## Dependências

- `src/memory/system.ts` — `MemorySystem` (opcional)
- `src/reasoning/llm/client.ts` — `LlmClient` (opcional)
- `src/core/logger.ts` — `logger`

## Entregáveis

- [ ] `src/memory/knowledge-graph.ts`
- [ ] `GraphNode`, `GraphEdge` interfaces
- [ ] `KnowledgeGraph` com queries: co-visitors, vehicles, shortest path, BFS
- [ ] `socialDistance()` funcional
- [ ] `toJSON()` / `fromJSON()` para persistência
- [ ] `src/processing/social-investigator.ts`
- [ ] `SocialProfile`, `InvestigationReport` interfaces
- [ ] `SocialMediaInvestigator` com ciclo de autorização completo
- [ ] `investigate()` stub funcional
- [ ] Compila com `tsc --noEmit`
