# 04 — LLM Client: Integração Real com OpenAI / Claude / Ollama

## Objetivo

Implementar um cliente LLM funcional que suporte múltiplos provedores
e o formato de prompt/resposta usado pelo sistema.

## Arquivo a criar

```
src/reasoning/llm/client.ts
```

## Interface

```typescript
export interface LlmAssessment {
  assessment: string;
  threatLevel: number;           // 0-10
  suggestedActions: string[];
  explanation: string;
  anomalyScore: number;          // 0-1
  personIdentification?: Record<string, string>;
}

export interface LlmClientConfig {
  provider: "openai" | "anthropic" | "ollama";
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}
```

## Classe Principal

```typescript
export class LlmClient {
  private config: LlmClientConfig;

  constructor(config: LlmClientConfig) {
    this.config = {
      maxTokens: 1000,
      temperature: 0.3,
      ...config,
    };
  }

  async evaluate(
    event: SecurityEvent,
    context: Record<string, unknown>,
  ): Promise<LlmAssessment>;

  async generateHypotheses(
    event: SecurityEvent,
    context: Record<string, unknown>,
  ): Promise<Array<{ title: string; description: string; probability: number }>>;

  async generateDailySummary(
    events: SecurityEvent[],
    date: string,
  ): Promise<string>;

  private async generate(systemPrompt: string, userPrompt: string): Promise<string>;
  private parseAssessment(response: string): LlmAssessment;
}
```

## System Prompt (usado em todas as chamadas)

```typescript
const SYSTEM_PROMPT = `Você é um agente de segurança residencial inteligente (Vigia).
Você analisa eventos de câmeras, áudio e sensores para avaliar situações.
Seu objetivo é proteger a residência, identificar ameaças e ajudar os moradores.

Regras:
1. Seja conservador: na dúvida, alerte.
2. Priorize a segurança das pessoas.
3. Considere o contexto (horário, frequência, padrões).
4. Responda SEMPRE em JSON estruturado quando solicitado.
5. Qualquer pessoa não identificada à noite é suspeita.
6. Entregadores e prestadores de serviço durante o dia são normais.
7. Seja conciso e informativo. Use português.`;
```

## Implementação por Provedor

### OpenAI
```typescript
import OpenAI from "openai";

// Em generate():
const client = new OpenAI({ apiKey: this.config.apiKey });
const response = await client.chat.completions.create({
  model: this.config.model,
  max_tokens: this.config.maxTokens,
  temperature: this.config.temperature,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
  response_format: { type: "json_object" },
});
return response.choices[0]?.message?.content ?? "";
```

### Anthropic (Claude)
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: this.config.apiKey });
const response = await client.messages.create({
  model: this.config.model,
  max_tokens: this.config.maxTokens ?? 1000,
  temperature: this.config.temperature,
  system: systemPrompt,
  messages: [{ role: "user", content: userPrompt }],
});
// Extrair JSON do texto (Claude retorna texto, não JSON forçado)
const text = response.content[0]?.type === "text" ? response.content[0].text : "";
return text;
```

### Ollama (local)
```typescript
const baseUrl = this.config.baseUrl ?? "http://localhost:11434";
const response = await fetch(`${baseUrl}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: this.config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: false,
    options: { temperature: this.config.temperature },
  }),
});
const data = await response.json();
return data.message?.content ?? "";
```

## Formato do Prompt de Avaliação

O método `evaluate` monta um prompt estruturado:

```
Analise o seguinte evento de segurança:

Evento: {event.description}
Tipo: {event.eventType}
Gravidade: {event.severity}
Câmera: {event.cameraId ?? 'N/A'}
Timestamp: {event.timestamp.toISOString()}
Pessoas envolvidas: {event.personsInvolved.join(', ')}
Payload: {JSON.stringify(event.payload)}

Contexto adicional:
{JSON.stringify(context, null, 2)}

Retorne um JSON com:
{
  "assessment": "avaliação da situação em português",
  "threat_level": 0-10,
  "suggested_actions": ["ação1", "ação2"],
  "explanation": "explicação detalhada",
  "anomaly_score": 0.0-1.0,
  "person_identification": {"personId": "nome_sugerido"} (opcional)
}
```

## Parse da Resposta

```typescript
private parseAssessment(raw: string): LlmAssessment {
  try {
    // Tenta extrair JSON do texto (Claude pode envolver em markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch?.[0] ?? raw);
    return {
      assessment: data.assessment ?? "",
      threatLevel: data.threat_level ?? 0,
      suggestedActions: data.suggested_actions ?? [],
      explanation: data.explanation ?? "",
      anomalyScore: data.anomaly_score ?? 0,
      personIdentification: data.person_identification,
    };
  } catch {
    logger.warn({ raw: raw.slice(0, 200) }, "Failed to parse LLM response");
    return {
      assessment: "Erro ao processar resposta do LLM",
      threatLevel: 0,
      suggestedActions: [],
      explanation: raw.slice(0, 500),
      anomalyScore: 0,
    };
  }
}
```

## Fallback para Desenvolvimento

Se não houver API key configurada, usar um responder determinístico:

```typescript
private async generate(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!this.config.apiKey && this.config.provider !== "ollama") {
    logger.warn("No API key configured, using fallback responses");
    return JSON.stringify({
      assessment: "LLM não configurado — usando fallback",
      threat_level: 0,
      suggested_actions: [],
      explanation: "Configure uma API key para avaliações reais.",
      anomaly_score: 0,
    });
  }
  // ... chamada real
}
```

## Verificação

```typescript
// Teste manual
const client = new LlmClient({
  provider: "openai",
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

const result = await client.evaluate(
  createEvent({
    eventType: EventType.PERSON_DETECTED,
    description: "Pessoa desconhecida na porta às 3h da manhã",
    severity: Severity.MEDIUM,
    personsInvolved: ["unknown_abc"],
  }),
  { recentEvents: [] },
);

console.log("Assessment:", result);
```

## Dependências

- `openai` npm package (já no package.json)
- `@anthropic-ai/sdk` (optionalDependencies)
- `ollama` (optionalDependencies)
- `src/core/types.ts` — `SecurityEvent`, `createEvent`
- `src/core/logger.ts` — `logger`

## Entregáveis

- [ ] `src/reasoning/llm/client.ts`
- [ ] Suporte a OpenAI (JSON mode)
- [ ] Suporte a Anthropic Claude
- [ ] Suporte a Ollama (local)
- [ ] Fallback sem API key
- [ ] `evaluate()` → `LlmAssessment`
- [ ] `generateHypotheses()` → array de hipóteses
- [ ] `generateDailySummary()` → string
- [ ] `parseAssessment()` robusto (extrai JSON de markdown)
- [ ] Compila com `tsc --noEmit`
