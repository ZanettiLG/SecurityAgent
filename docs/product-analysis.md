# Análise do Produto — SecurityAgent (Vigia)

## 1. Visão do Produto

O Vigia é um **observador ambiental inteligente** que transforma câmeras
de segurança em sensores de compreensão contextual. Ele não apenas detecta
ameaças — ele entende rotinas, reconhece padrões, formula hipóteses e
dialoga com o usuário.

**Proposta de valor**: Segurança que aprende, não apenas alerta.

---

## 2. Mapeamento Conceito → Especificação → Implementação

Legenda:
- ✅ Implementado (estrutura completa)
- ⚠️ Estrutura existe, lógica parcial
- ❌ Não implementado

### 2.1 Observação e Percepção

| Conceito | Especificação | Status | Arquivo |
|----------|--------------|--------|---------|
| Conectar câmeras RTSP/ONVIF/USB | `CameraConfig` no schema | ❌ | Sem implementação de conectores |
| Stream de vídeo contínuo | `_camera_loop()` no agent | ❌ | Loop existe, mas sem source real |
| Captura de áudio | Mencionado no README | ❌ | Sem implementação |
| Processamento de múltiplos streams | TaskGroup no agent | ⚠️ | Estrutura pronta, sem implementação |

### 2.2 As 3 Camadas de Baseline

| Camada | Especificação | Status | Arquivo |
|--------|--------------|--------|---------|
| **Camada 1 — Universal** | `RoutineLearner` com perfil `universal:all_vehicles` | ✅ | `routine_learner.ts` — `updateProfile` funciona |
| **Camada 2 — Categoria** | Perfis `category:entregador`, `category:vizinho` | ⚠️ | Estrutura existe, mas sem lógica de categorização |
| **Camada 3 — Ator específico** | Perfis `person:X`, `vehicle:Y`, `camera:Z` | ✅ | `routine_learner.ts` — perfis por entidade |
| Score atípico por camada | `scoreAtypical()` com fallback Camada 3→1 | ✅ | `routine_learner.ts` |
| Promoção de ator a Camada 3 | Via feedback do usuário | ⚠️ | Conceito documentado, sem wire-up no código |

### 2.3 Reconhecimento de Padrões (Assinaturas Comportamentais)

| Conceito | Especificação | Status | Arquivo |
|----------|--------------|--------|---------|
| Assinaturas comportamentais | `BehavioralSignature` com sequência de eventos | ✅ | `behavioral_pattern.ts` |
| Match cross-ator (Nível 3) | `matchStreaming()` e `matchAgainstSignature()` | ✅ | `behavioral_pattern.ts` |
| Match de reincidência (Nível 2) | `actorLevel` no `BehaviorMatch` | ⚠️ | Tipo existe, mas lógica não diferencia níveis |
| Aprendizado retrospectivo | `learnFromIncident()` | ✅ | `behavioral_pattern.ts` |
| Catálogo de assinaturas padrão | `createDefaultSignatures()` | ✅ | Assinatura pré-invasão definida |
| Similaridade temporal | `temporalFit()` | ✅ | `behavioral_pattern.ts` |
| Similaridade de localização | `locationFit()` | ✅ | `behavioral_pattern.ts` |
| Similaridade de sequência (fuzzy) | `sequenceSimilarity()` + `fuzzySequenceMatch()` | ✅ | `behavioral_pattern.ts` |
| Extração de comportamento puro | `extractBehavior()` | ✅ | Remove identidade, mantém ação |

### 2.4 Geração de Hipóteses

| Conceito | Especificação | Status | Arquivo |
|----------|--------------|--------|---------|
| Engine de hipóteses | `HypothesisEngine` | ⚠️ | Estrutura existe, `generateFromEvent` vazio |
| Estados de hipótese | `HypothesisStatus` (7 estados) | ✅ | `hypothesis.ts` |
| Confirmação pelo usuário | `confirmByUser()` / `rejectByUser()` | ✅ | `hypothesis.ts` |
| Geração via LLM | Prompt estruturado | ❌ | Sem integração LLM real |

### 2.5 Diálogo com Usuário

| Conceito | Especificação | Status | Arquivo |
|----------|--------------|--------|---------|
| Gerenciador de perguntas | `QueryManager` | ✅ | `query_user.ts` |
| Templates do Vigia | `VIGIA_QUESTIONS` (4 templates) | ✅ | `query_user.ts` |
| Priorização de perguntas | `critical > high > medium > low` | ✅ | `query_user.ts` |
| Tipos de resposta | `yes_no`, `text`, `person_name`, `choice` | ✅ | `query_user.ts` |
| Integração com EventBus | `bus.publish("query.user", ...)` | ✅ | `query_user.ts` |
| Tom adaptável | `informative | casual | humoristico` | ⚠️ | Estrutura existe, não usado |
| Callback de resposta | `onAnswer` no `Question` | ✅ | `query_user.ts` |

### 2.6 Tomada de Decisão (GOAP)

| Conceito | Especificação | Status | Arquivo |
|----------|--------------|--------|---------|
| Planejador A* | `GoapPlanner.plan()` | ✅ | `goap/planner.ts` |
| Agente GOAP | `GoapAgent.tick()` | ✅ | `goap/planner.ts` |
| WorldState | `WorldState` com `satisfies()` e `applyEffects()` | ✅ | `core/types.ts` |
| Catálogo de ações padrão | `createDefaultActions()` — 8 ações | ✅ | `goap/planner.ts` |
| Catálogo de goals padrão | `createDefaultGoals()` — 5 goals | ✅ | `goap/planner.ts` |
| Replanejamento | Fallback quando ação falha | ✅ | `goap/planner.ts` |
| Integração com loop principal | `goapTick()` no agent | ⚠️ | Estrutura existe, não wired |

### 2.7 Execução de Ações

| Conceito | Especificação | Status | Arquivo |
|----------|--------------|--------|---------|
| Registry de ações | `ActionRegistry` | ✅ | `actions/registry.ts` |
| Ações de segurança | alarme, porta, luzes, sirene, emergência | ✅ | `actions/registry.ts` |
| Ações do Vigia | insight social, confirmação de predição | ✅ | `actions/registry.ts` |
| Integração real (IoT) | MQTT, Home Assistant | ❌ | Placeholder |

### 2.8 Memória

| Conceito | Especificação | Status | Arquivo |
|----------|--------------|--------|---------|
| VectorStore | `InMemoryVectorStore` | ✅ | `memory/system.ts` |
| EventStore | `EventStore` | ✅ | `memory/system.ts` |
| PersonRegistry | `PersonRegistry` com ciclo de vida completo | ✅ | `memory/system.ts` |
| AnomalyDetector | `AnomalyDetector` | ✅ | `memory/system.ts` |
| Integração ChromaDB | Interface `VectorStore` | ⚠️ | Só in-memory, sem adapter real |
| Integração PostgreSQL | `EventStore` persistente | ❌ | Só in-memory |

### 2.9 Capacidades Avançadas (Vigia)

| Conceito | Especificação | Status | Arquivo |
|----------|--------------|--------|---------|
| VehicleTracker | Detecção + associação veículo↔pessoa | ❌ | Sem implementação TS |
| SocialMediaInvestigator | Busca em fontes públicas autorizada | ❌ | Sem implementação TS |
| SocialPredictionEngine | Predição de propagação de fofoca | ❌ | Sem implementação TS |
| KnowledgeGraph | Relações entre entidades | ❌ | Sem implementação TS |
| RetrospectiveAnalyzer | Revisão pós-incidente | ❌ | Sem implementação TS |

---

## 3. Análise Crítica

### 3.1 O que está sólido

1. **Modelo conceitual**: As 3 camadas de baseline + assinaturas cross-ator
   são o núcleo correto. Isso captura exatamente o que as histórias do Manuel
   demonstram.

2. **BehavioralPatternMatcher**: A implementação mais completa. Faz matching
   fuzzy de sequências, extrai comportamento puro (desidentificado), suporta
   aprendizado a partir de incidentes.

3. **GOAP + Rules + LLM**: 3 camadas de decisão bem especificadas.
   Rules para imediato, GOAP para tático, LLM para ambíguo.

4. **QueryManager**: Sistema de diálogo bem pensado, com templates,
   priorização e callbacks.

### 3.2 O que falta

1. **Percepção real**: Zero código para conectar câmeras ou processar
   vídeo/áudio. Isso é um buraco enorme — sem percepção, o sistema não
   recebe eventos.

2. **VehicleTracker**: Especificado no Python mas não portado para TS.
   É essencial para 80% dos cenários do Vigia.

3. **SocialPredictionEngine**: Especificado mas não implementado. A cena
   "97.4% Dona Marlene descobre" depende disso.

4. **Integração LLM real**: O `HypothesisEngine` e o agente chamam LLM
   mas não há cliente implementado.

5. **RetrospectiveAnalyzer**: Essencial para o Capítulo 2 (aprender com
   o roubo da Olinda). Não implementado.

6. **Persistência**: Tudo in-memory. Sem banco de dados real, o sistema
   esquece tudo ao reiniciar.

### 3.3 O que está errado ou inconsistente

1. **Loop principal não wired**: `agent.ts` tem todos os métodos, mas
   os subsistemas não estão instanciados. Os `TODO` dominam o `handleEvent`.

2. **`BehaviorMatch.actorLevel`**: O tipo existe mas a lógica de matching
   não diferencia Nível 2 (reincidência) de Nível 3 (cross-ator). O
   `matchStreaming` sempre chama com `actorLevel: 1`.

3. **Camada 2 (categoria)**: A estrutura existe no `RoutineLearner` mas
   não há lógica para categorizar atores automaticamente.

4. **Config YAML vs Zod**: O `settings.yaml` tem seções (`vigia.vehicles`,
   `vigia.routines`) que o zod schema atual não captura completamente.

---

## 4. Roadmap Sugerido

### Fase 1 — Fundação (MVP)
- [ ] Implementar conectores de câmera (1 câmera RTSP)
- [ ] Pipeline de visão básico (detecção de movimento)
- [ ] Wire-up do `handleEvent` com subsistemas reais
- [ ] Persistência SQLite para EventStore e PersonRegistry

### Fase 2 — Inteligência Básica
- [ ] Portar VehicleTracker para TS
- [ ] Integrar `RoutineLearner` no pipeline de eventos
- [ ] Integrar `BehavioralPatternMatcher` no pipeline
- [ ] Fazer `matchStreaming` diferenciar actorLevel 1/2/3

### Fase 3 — Diálogo e Hipóteses
- [ ] Implementar cliente LLM (OpenAI)
- [ ] Wire-up `HypothesisEngine.generateFromEvent`
- [ ] Integrar `QueryManager` com notificações reais (Telegram)
- [ ] Implementar `RetrospectiveAnalyzer`

### Fase 4 — Social
- [ ] Portar `SocialPredictionEngine`
- [ ] Portar `SocialMediaInvestigator`
- [ ] Implementar `KnowledgeGraph`

---

## 5. Resumo

| Dimensão | Progresso |
|----------|-----------|
| **Conceito** | ✅ 100% — Clara, consistente, bem documentada |
| **Especificação** | ✅ 95% — GOAP, memória, tipos, enums, interfaces |
| **Core (tipos, bus, agent)** | ✅ 90% — Estrutura pronta, loops definidos |
| **GOAP Planner** | ✅ 100% — A*, GoapAgent, ações, goals |
| **Rules Engine** | ✅ 100% — Funcional |
| **Memory (in-memory)** | ✅ 90% — Vector, Event, Person, Anomaly |
| **RoutineLearner** | ✅ 85% — 3 camadas, score, perfis |
| **BehavioralPatternMatcher** | ✅ 90% — Assinaturas, matching fuzzy |
| **QueryManager** | ✅ 85% — Templates, priorização, callbacks |
| **HypothesisEngine** | ⚠️ 40% — Estrutura, sem LLM |
| **Percepção (câmeras/áudio)** | ❌ 0% |
| **VehicleTracker** | ❌ 0% (TS) |
| **SocialPrediction** | ❌ 0% (TS) |
| **Persistência real** | ❌ 0% |
| **Wire-up completo** | ⚠️ 20% — Métodos existem, não conectados |
