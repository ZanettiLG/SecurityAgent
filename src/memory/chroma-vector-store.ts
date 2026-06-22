/**
 * ChromaVectorStore — Vector storage backed by ChromaDB,
 * with automatic fallback to InMemoryVectorStore when ChromaDB is offline.
 */

import { ChromaClient } from "chromadb";
import { logger } from "../core/logger.js";
import type { VectorStore, VectorMatch } from "./system.js";
import { InMemoryVectorStore } from "./system.js";

export class ChromaVectorStore implements VectorStore {
  private client: ChromaClient;
  private collections = new Map<string, unknown>();
  private fallback = new InMemoryVectorStore();
  private online = false;

  constructor(host?: string) {
    this.client = new ChromaClient({ path: host ?? "http://localhost:8000" });
  }

  // ── Lifecycle ───────────────────────────────────────────────

  async initialize(): Promise<void> {
    try {
      await this.client.heartbeat();
      this.online = true;
      logger.info("ChromaDB connected");
    } catch {
      logger.warn("ChromaDB offline, using in-memory fallback");
      this.online = false;
    }
  }

  // ── Collection helper ───────────────────────────────────────

  private async getOrCreateCollection(name: string): Promise<unknown> {
    if (this.collections.has(name)) return this.collections.get(name);

    try {
      const col = await this.client.getOrCreateCollection({ name });
      this.collections.set(name, col);
      return col;
    } catch {
      const col = await this.client.createCollection({ name });
      this.collections.set(name, col);
      return col;
    }
  }

  // ── VectorStore interface ───────────────────────────────────

  async search(collection: string, queryVector: number[], topK = 5): Promise<VectorMatch[]> {
    if (!this.online) return this.fallback.search(collection, queryVector, topK);

    const col = (await this.getOrCreateCollection(collection)) as {
      query: (opts: { queryEmbeddings: number[][]; nResults: number }) => Promise<{
        ids: string[][];
        distances?: number[][];
        metadatas?: Record<string, unknown>[][];
      }>;
    };

    const results = await col.query({ queryEmbeddings: [queryVector], nResults: topK });

    return (results.ids[0] ?? []).map((id: string, i: number) => ({
      id,
      score: results.distances?.[0]?.[i] ?? 0,
      metadata: results.metadatas?.[0]?.[i] ?? {},
    }));
  }

  async insert(
    collection: string,
    id: string,
    vector: number[],
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.online) return this.fallback.insert(collection, id, vector, metadata);

    const col = (await this.getOrCreateCollection(collection)) as {
      add: (opts: { ids: string[]; embeddings: number[][]; metadatas: Record<string, unknown>[] }) => Promise<void>;
    };

    await col.add({ ids: [id], embeddings: [vector], metadatas: [metadata] });
  }

  async delete(collection: string, id: string): Promise<void> {
    if (!this.online) return this.fallback.delete(collection, id);

    const col = (await this.getOrCreateCollection(collection)) as {
      delete: (opts: { ids: string[] }) => Promise<void>;
    };

    await col.delete({ ids: [id] });
  }

  async count(collection: string): Promise<number> {
    if (!this.online) return this.fallback.count(collection);

    const col = (await this.getOrCreateCollection(collection)) as {
      count: () => Promise<number>;
    };

    return col.count();
  }
}
