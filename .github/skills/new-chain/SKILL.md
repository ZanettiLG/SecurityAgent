---
name: new-chain
description: >-
  Scaffolds a LangChain chain in the Audiobooker backend following the established
  pattern (PromptTemplate → LLM → StringOutputParser). Activates when the user asks
  to create a chain, add an LLM processing step, or mentions LangChain, system prompt,
  structured output, or JSON parsing.
---

# New Chain — Audiobooker Skill

## When to Use

- Creating a new file under `backend/src/chains/` (e.g., `summarization.chain.ts`)
- Adding a new LLM-powered processing step that follows the `PromptTemplate → ChatOpenAI → StringOutputParser` pattern
- User asks for: "chain", "LangChain", "system prompt", "LLM call", "structured output"

## Prerequisites

Before scaffolding, read these files to ensure consistency:

- `backend/src/chains/json-parser.ts` — shared JSON extraction
- `backend/src/services/llm.provider.ts` — `createLLM()` factory
- Existing chains (e.g., `spelling.chain.ts`, `narration.chain.ts`) — pattern reference

## Chain Architecture

```typescript
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import { extractJson } from './json-parser.js';

// 1. Define prompt
const PROMPT = PromptTemplate.fromTemplate(`...`);

// 2. Define types
export interface MyChainInput {
  text: string;
  language?: string;
}
export interface MyChainOutput {
  result: string;
  metadata?: Record<string, unknown>;
}

// 3. Create chain
export async function myChain(input: MyChainInput, llm: ChatOpenAI): Promise<MyChainOutput> {
  const chain = PROMPT.pipe(llm).pipe(new StringOutputParser());
  const raw = await chain.invoke(input);
  return extractJson<MyChainOutput>(raw);
}
```

## File Naming Convention

`backend/src/chains/<name>.chain.ts` — kebab-case, `.ts` extension (ESM)

## Registration

Chains are used directly by pipelines (`backend/src/pipeline/`). No central registry needed — import and invoke.
