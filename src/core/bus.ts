/**
 * Event Bus — Barramento de eventos interno do SecurityAgent.
 *
 * Implementa pub/sub assíncrono para comunicação entre subsistemas.
 */

import { EventEmitter } from "node:events";
import { logger } from "./logger.js";
import type { SecurityEvent } from "./types.js";

type EventPayload = SecurityEvent | Record<string, unknown>;
type Subscriber = (topic: string, payload: EventPayload) => Promise<void> | void;

export class EventBus {
  private emitter = new EventEmitter();
  private history: Array<{ topic: string; payload: EventPayload; ts: Date }> = [];

  /** Publica um evento em um tópico */
  publish(topic: string, payload: EventPayload): void {
    this.history.push({ topic, payload, ts: new Date() });
    // Mantém apenas últimos 10k eventos no histórico
    if (this.history.length > 10_000) {
      this.history = this.history.slice(-5000);
    }
    this.emitter.emit(topic, topic, payload);
    this.emitter.emit("all", topic, payload);
  }

  /** Inscreve-se em um tópico com callback */
  subscribe(topic: string, handler: Subscriber): () => void {
    this.emitter.on(topic, handler);
    return () => this.emitter.off(topic, handler);
  }

  /** Inscreve-se em múltiplos tópicos */
  subscribeMany(topics: string[], handler: Subscriber): () => void {
    for (const topic of topics) {
      this.emitter.on(topic, handler);
    }
    return () => {
      for (const topic of topics) {
        this.emitter.off(topic, handler);
      }
    };
  }

  /** Remove todos os listeners de um tópico */
  unsubscribeAll(topic: string): void {
    this.emitter.removeAllListeners(topic);
  }

  /** Número de inscritos em um tópico */
  subscriberCount(topic: string): number {
    return this.emitter.listenerCount(topic);
  }

  /** Histórico de eventos (para debug) */
  getHistory(topic?: string, limit = 100): Array<{ topic: string; payload: EventPayload; ts: Date }> {
    const filtered = topic
      ? this.history.filter((h) => h.topic === topic)
      : this.history;
    return filtered.slice(-limit);
  }
}
