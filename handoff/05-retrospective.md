# 05 — Retrospective Analyzer: Aprendizado Pós-Incidente

## Objetivo

Implementar o analisador que **aprende com incidentes passados**.
Após um crime/incidente confirmado, ele revisa as gravações anteriores,
extrai a assinatura comportamental que precedeu o evento, e a registra
para detecção futura.

## Motivação (Capítulo 2 do Vigia)

> "Após o incidente, o sistema iniciou uma análise retrospectiva.
> Revisou milhares de horas de gravações. Centenas de ocorrências
> policiais públicas. [...] Em muitos casos, os criminosos realizavam
> várias passagens pela rua horas ou dias antes do crime."

## Arquivo a criar

```
src/reasoning/retrospective.ts
```

## Modelo de Dados

```typescript
export interface IncidentReport {
  incidentId: string;
  incidentType: string;          // "burglary", "theft", "vandalism", "suspicious"
  location: string;              // "casa da dona Olinda"
  timestamp: Date;               // Quando o crime ocorreu
  confirmedBy: string;           // "user", "police", "news"
  preludeEvents: SecurityEvent[]; // Eventos que antecederam o crime
  learnedSignatureId: string | null; // Assinatura aprendida
}

export interface RetrospectiveResult {
  incidentId: string;
  signaturesCreated: number;
  patternsFound: number;
  summary: string;
}
```

## Classe Principal

```typescript
export class RetrospectiveAnalyzer {
  constructor(
    private memory: MemorySystem,
    private behaviorMatcher: BehavioralPatternMatcher,
    private llmClient?: LlmClient,
  ) {}

  // ── Análise retrospectiva ──

  async analyzeIncident(
    incidentTime: Date,
    location: string,
    lookbackHours: number = 72,
  ): Promise<RetrospectiveResult>;

  // ── Registro manual ──

  async registerIncident(
    incidentType: string,
    location: string,
    timestamp: Date,
    confirmedBy: string = "user",
  ): Promise<IncidentReport>;

  // ── Busca de padrões em dados públicos ──

  async searchPublicPatterns(
    incidentType: string,
  ): Promise<BehavioralSignature[]>;
}
```

## Fluxo do `analyzeIncident`

```
1. Busca eventos no EventStore nas {lookbackHours}h anteriores ao crime
2. Filtra eventos da(s) câmera(s) próximas à localização
3. Extrai comportamentos (BehavioralEvent[]) de cada SecurityEvent
4. Busca sequências repetidas (mesmo tipo de evento, mesma câmera)
5. Se LLM disponível, pede para identificar o padrão:
   "Estes eventos antecederam um roubo. Identifique o padrão."
6. Cria BehavioralSignature com a sequência extraída
7. Registra no BehavioralPatternMatcher
8. Marca learnedFromIncidentId
```

## Algoritmo de Extração de Sequência

```typescript
private extractPreludeSequence(events: SecurityEvent[]): BehavioralEvent[] {
  // 1. Converte todos para BehavioralEvent
  const behaviors = events.map(e => this.toBehavioral(e));

  // 2. Agrupa por (cameraId, eventType) em janelas de 30min
  // 3. Filtra grupos com >= 2 ocorrências
  // 4. Ordena por timestamp
  // 5. Remove ruído (eventos isolados sem repetição)
  // 6. Retorna a sequência limpa

  return behaviors; // simplificado
}

private toBehavioral(event: SecurityEvent): BehavioralEvent {
  // Reusa lógica do BehavioralPatternMatcher.extractBehavior
  return {
    eventType: mapEventType(event.eventType),
    location: event.cameraId,
    durationSeconds: (event.payload.durationSeconds as number) || 0,
    metadata: { originalEventId: event.eventId },
  };
}
```

## Integração com BehavioralPatternMatcher

Após extrair a assinatura, registra:

```typescript
const signature = this.behaviorMatcher.learnFromIncident(
  preludeEvents,
  "pre_invasion_reconnaissance",  // categoria
  `Reconhecimento pré-invasão — ${location}`,
  "high",
);
```

## Busca em Dados Públicos (Futuro)

O método `searchPublicPatterns` é um stub que será expandido quando
houver integração com APIs de ocorrências policiais públicas:

```typescript
async searchPublicPatterns(incidentType: string): Promise<BehavioralSignature[]> {
  // TODO: Integrar com APIs de dados públicos
  // - Google Alerts para notícias de crime no bairro
  // - APIs de ocorrências policiais (onde disponível)
  // - RSS feeds de jornais locais

  logger.info({ incidentType }, "Public pattern search not yet implemented");
  return [];
}
```

## Interface com o Usuário

Quando um incidente é registrado, o sistema pode perguntar:

```
QueryManager:
"Detectei que um incidente foi reportado na casa da Dona Olinda.
 Deseja que eu analise as gravações das últimas 72h para aprender
 padrões que possam prevenir futuros incidentes?"
```

## Verificação

```typescript
const analyzer = new RetrospectiveAnalyzer(memory, behaviorMatcher, llmClient);

// Registra incidente
await analyzer.registerIncident(
  "burglary",
  "casa da dona Olinda",
  new Date("2026-06-20T02:17:00"),
  "police",
);

// Analisa retrospectivamente
const result = await analyzer.analyzeIncident(
  new Date("2026-06-20T02:17:00"),
  "casa da dona Olinda",
  72,
);

console.log("Signatures created:", result.signaturesCreated);
console.log("Patterns found:", result.patternsFound);
```

## Dependências

- `src/memory/system.ts` — `MemorySystem`, `EventStore`
- `src/reasoning/behavioral_pattern.ts` — `BehavioralPatternMatcher`, `BehavioralSignature`
- `src/reasoning/llm/client.ts` — `LlmClient` (opcional)
- `src/core/logger.ts` — `logger`

## Entregáveis

- [ ] `src/reasoning/retrospective.ts`
- [ ] `IncidentReport` e `RetrospectiveResult` interfaces
- [ ] `analyzeIncident()` — extrai assinatura de eventos pré-crime
- [ ] `registerIncident()` — registro manual
- [ ] `extractPreludeSequence()` — algoritmo de extração
- [ ] Integração com `BehavioralPatternMatcher.learnFromIncident()`
- [ ] Stub para `searchPublicPatterns()`
- [ ] Compila com `tsc --noEmit`
