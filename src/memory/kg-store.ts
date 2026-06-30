/**
 * PersistentKnowledgeGraph — Knowledge Graph com persistência em SQLite.
 *
 * Estende KnowledgeGraph adicionando write-through para SQLite em
 * addNode/addEdge, mais load() para reconstituir do banco no boot.
 * Mantém cache em memória para leituras rápidas (herdado da classe pai).
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { logger } from "../core/logger.js";
import {
  KnowledgeGraph,
  type GraphNode,
  type GraphEdge,
  type NodeType,
  type EdgeType,
} from "./knowledge-graph.js";

export class PersistentKnowledgeGraph extends KnowledgeGraph {
  private db: Database.Database;

  constructor(dbPath: string) {
    super();
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kg_nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        properties TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS kg_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_node TEXT NOT NULL,
        to_node TEXT NOT NULL,
        type TEXT NOT NULL,
        properties TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (from_node) REFERENCES kg_nodes(id),
        FOREIGN KEY (to_node) REFERENCES kg_nodes(id)
      );

      CREATE INDEX IF NOT EXISTS idx_kg_edges_from ON kg_edges(from_node);
      CREATE INDEX IF NOT EXISTS idx_kg_edges_to ON kg_edges(to_node);
      CREATE INDEX IF NOT EXISTS idx_kg_edges_type ON kg_edges(type);
    `);
  }

  async load(): Promise<void> {
    const nodes = this.db.prepare("SELECT * FROM kg_nodes").all() as Record<
      string,
      unknown
    >[];
    for (const row of nodes) {
      super.addNode({
        id: row.id as string,
        type: row.type as NodeType,
        label: row.label as string,
        properties: JSON.parse((row.properties as string) || "{}"),
      });
    }

    const edges = this.db.prepare("SELECT * FROM kg_edges").all() as Record<
      string,
      unknown
    >[];
    for (const row of edges) {
      const edge: GraphEdge = {
        from: row.from_node as string,
        to: row.to_node as string,
        type: row.type as EdgeType,
        properties: JSON.parse((row.properties as string) || "{}"),
        createdAt: new Date(row.created_at as string),
      };
      (this as unknown as { edges: GraphEdge[] }).edges.push(edge);
    }

    logger.info(
      { nodes: nodes.length, edges: edges.length },
      "KnowledgeGraph loaded from SQLite",
    );
  }

  override addNode(node: GraphNode): void {
    super.addNode(node);
    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO kg_nodes (id, type, label, properties, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        node.id,
        node.type,
        node.label,
        JSON.stringify(node.properties),
        new Date().toISOString(),
        new Date().toISOString(),
      );
  }

  override addEdge(
    from: string,
    to: string,
    type: EdgeType,
    properties?: Record<string, unknown>,
  ): void {
    super.addEdge(from, to, type, properties);
    this.db
      .prepare(
        `
      INSERT INTO kg_edges (from_node, to_node, type, properties, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(
        from,
        to,
        type,
        JSON.stringify(properties ?? {}),
        new Date().toISOString(),
      );
  }
}
