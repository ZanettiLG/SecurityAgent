/**
 * Knowledge Graph — In-memory graph structure for entity relationships.
 *
 * Tracks connections between Persons, Vehicles, Cameras, Locations,
 * and Incidents. Designed with an interface that can later be swapped
 * for Neo4j or another graph database.
 */

import { logger } from "../core/logger.js";
import type { SecurityEvent } from "../core/types.js";

// ── Type Definitions ────────────────────────────────────────────

export type NodeType =
  "PERSON" | "VEHICLE" | "CAMERA" | "LOCATION" | "INCIDENT";
export type EdgeType =
  "VISITED_WITH" | "ASSOCIATED_WITH" | "SEEN_AT" | "ENTERED_THROUGH" | "OWNS";

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

// ── Knowledge Graph ─────────────────────────────────────────────

export class KnowledgeGraph {
  private nodes = new Map<string, GraphNode>();
  private edges: GraphEdge[] = [];

  // ═══════════════════════════════════════════════════════════════
  // Nodes
  // ═══════════════════════════════════════════════════════════════

  addNode(node: GraphNode): void {
    if (this.nodes.has(node.id)) {
      logger.warn(
        { nodeId: node.id },
        "KnowledgeGraph: overwriting existing node",
      );
    }
    this.nodes.set(node.id, node);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  findNodes(type: NodeType): GraphNode[] {
    const result: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) {
        result.push(node);
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // Edges
  // ═══════════════════════════════════════════════════════════════

  addEdge(
    from: string,
    to: string,
    type: EdgeType,
    properties?: Record<string, unknown>,
  ): void {
    // Validate that both nodes exist
    if (!this.nodes.has(from)) {
      logger.warn(
        { from, to, type },
        "KnowledgeGraph: adding edge with unknown 'from' node",
      );
    }
    if (!this.nodes.has(to)) {
      logger.warn(
        { from, to, type },
        "KnowledgeGraph: adding edge with unknown 'to' node",
      );
    }

    const edge: GraphEdge = {
      from,
      to,
      type,
      properties: properties ?? {},
      createdAt: new Date(),
    };

    this.edges.push(edge);
  }

  /**
   * Protected helper for subclasses (e.g., PersistentKnowledgeGraph)
   * to push edges directly without triggering write-through.
   * Used when restoring state from SQLite on load().
   */
  protected _pushEdge(edge: GraphEdge): void {
    this.edges.push(edge);
  }

  /**
   * Ensure KG edges exist for a SecurityEvent:
   * - Person → SEEN_AT → Camera
   * - Person ↔ ASSOCIATED_WITH → Vehicle
   * Skips if edge already exists (idempotent).
   */
  ensureEdgesForEvent(event: SecurityEvent): void {
    if (event.cameraId) {
      const cameraNodeId = `camera:${event.cameraId}`;
      if (!this.getNode(cameraNodeId)) {
        this.addNode({
          id: cameraNodeId,
          type: "CAMERA",
          label: event.cameraId,
          properties: { cameraId: event.cameraId },
        });
      }
      for (const pid of event.personsInvolved) {
        const existing = this.getEdges(pid);
        const hasSeen = existing.some(
          (e) => e.to === cameraNodeId || e.from === cameraNodeId,
        );
        if (!hasSeen) {
          this.addEdge(pid, cameraNodeId, "SEEN_AT", {
            timestamp: event.timestamp.toISOString(),
            cameraId: event.cameraId,
          });
        }
      }
    }

    const vehicleId = event.payload.vehicleId as string | undefined;
    if (vehicleId) {
      if (!this.getNode(vehicleId)) {
        this.addNode({
          id: vehicleId,
          type: "VEHICLE",
          label: (event.payload.vehicleDescription as string) ?? vehicleId,
          properties: {
            firstSeen: event.timestamp.toISOString(),
            source: event.cameraId,
          },
        });
      }
      for (const pid of event.personsInvolved) {
        const vehicles = this.getVehiclesForPerson(pid);
        if (!vehicles.includes(vehicleId)) {
          this.addEdge(pid, vehicleId, "ASSOCIATED_WITH", {
            confidence: 0.5,
            firstSeen: event.timestamp.toISOString(),
          });
        }
      }
    }

    // Ensure person nodes exist
    for (const pid of event.personsInvolved) {
      if (!this.getNode(pid)) {
        this.addNode({
          id: pid,
          type: "PERSON",
          label: pid,
          properties: { firstSeen: event.timestamp.toISOString() },
        });
      }
    }
  }

  getEdges(nodeId: string, edgeType?: EdgeType): GraphEdge[] {
    return this.edges.filter((e) => {
      const matches = e.from === nodeId || e.to === nodeId;
      if (!matches) return false;
      if (edgeType !== undefined && e.type !== edgeType) return false;
      return true;
    });
  }

  getNeighbors(nodeId: string, edgeType?: EdgeType): GraphNode[] {
    const neighborIds = new Set<string>();
    for (const edge of this.edges) {
      if (edgeType !== undefined && edge.type !== edgeType) continue;
      if (edge.from === nodeId) neighborIds.add(edge.to);
      if (edge.to === nodeId) neighborIds.add(edge.from);
    }

    const neighbors: GraphNode[] = [];
    for (const id of neighborIds) {
      const node = this.nodes.get(id);
      if (node) neighbors.push(node);
    }
    return neighbors;
  }

  // ═══════════════════════════════════════════════════════════════
  // Queries (Vigia)
  // ═══════════════════════════════════════════════════════════════

  /** People who tend to visit together with person X. */
  getCoVisitors(personId: string): string[] {
    const coVisitors = new Set<string>();
    for (const edge of this.edges) {
      if (edge.type !== "VISITED_WITH") continue;
      if (edge.from === personId) coVisitors.add(edge.to);
      if (edge.to === personId) coVisitors.add(edge.from);
    }
    coVisitors.delete(personId);
    return [...coVisitors];
  }

  /** Vehicles associated with a person. */
  getVehiclesForPerson(personId: string): string[] {
    const vehicles = new Set<string>();
    for (const edge of this.edges) {
      if (edge.type === "ASSOCIATED_WITH" || edge.type === "OWNS") {
        if (edge.from === personId) {
          const target = this.nodes.get(edge.to);
          if (target?.type === "VEHICLE") vehicles.add(edge.to);
        }
        if (edge.to === personId) {
          const source = this.nodes.get(edge.from);
          if (source?.type === "VEHICLE") vehicles.add(edge.from);
        }
      }
    }
    return [...vehicles];
  }

  /** Persons associated with a vehicle. */
  getPersonsForVehicle(vehicleId: string): string[] {
    const persons = new Set<string>();
    for (const edge of this.edges) {
      if (edge.type === "ASSOCIATED_WITH" || edge.type === "OWNS") {
        if (edge.from === vehicleId) {
          const target = this.nodes.get(edge.to);
          if (target?.type === "PERSON") persons.add(edge.to);
        }
        if (edge.to === vehicleId) {
          const source = this.nodes.get(edge.from);
          if (source?.type === "PERSON") persons.add(edge.from);
        }
      }
    }
    return [...persons];
  }

  /** All people seen at a camera in the last N days (default 7). */
  getRecentVisitors(cameraId: string, days = 7): string[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const visitors = new Set<string>();

    for (const edge of this.edges) {
      if (edge.type !== "SEEN_AT") continue;
      if (edge.createdAt.getTime() < cutoff) continue;

      // Determine which end is the camera
      if (edge.to === cameraId || edge.properties?.cameraId === cameraId) {
        const personNode = this.nodes.get(edge.from);
        if (personNode?.type === "PERSON") visitors.add(edge.from);
      }
      if (edge.from === cameraId || edge.properties?.cameraId === cameraId) {
        const personNode = this.nodes.get(edge.to);
        if (personNode?.type === "PERSON") visitors.add(edge.to);
      }
    }

    return [...visitors];
  }

  // ═══════════════════════════════════════════════════════════════
  // Path Finding
  // ═══════════════════════════════════════════════════════════════

  /** BFS shortest path between two nodes. Returns node IDs or null. */
  shortestPath(fromId: string, toId: string): string[] | null {
    if (fromId === toId) return [fromId];

    // Verify both nodes exist
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      return null;
    }

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
            // Reconstruct path
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

  /**
   * Social distance between two nodes.
   * Returns path length minus 1 (edges between nodes), or -1 if no path.
   */
  socialDistance(fromId: string, toId: string): number {
    const path = this.shortestPath(fromId, toId);
    return path ? path.length - 1 : -1;
  }

  // ═══════════════════════════════════════════════════════════════
  // Context Linking (Issue #1 — Context Linking Engine)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Find nodes similar to the given node based on shared neighbors.
   * Uses Jaccard similarity on neighbor sets.
   */
  findSimilarNodes(
    nodeId: string,
    threshold = 0.3,
    maxResults = 5,
  ): Array<{ node: GraphNode; similarity: number }> {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const myNeighbors = new Set(this.getNeighbors(nodeId).map((n) => n.id));
    if (myNeighbors.size === 0) return [];

    const candidates: Array<{ node: GraphNode; similarity: number }> = [];

    for (const [candidateId, candidateNode] of this.nodes) {
      if (candidateId === nodeId) continue;
      if (candidateNode.type !== node.type) continue;

      const candidateNeighbors = new Set(
        this.getNeighbors(candidateId).map((n) => n.id),
      );
      if (candidateNeighbors.size === 0) continue;

      // Jaccard similarity
      const intersection = new Set(
        [...myNeighbors].filter((x) => candidateNeighbors.has(x)),
      );
      const union = new Set([...myNeighbors, ...candidateNeighbors]);
      const similarity = intersection.size / union.size;

      if (similarity >= threshold) {
        candidates.push({ node: candidateNode, similarity });
      }
    }

    candidates.sort((a, b) => b.similarity - a.similarity);
    return candidates.slice(0, maxResults);
  }

  /**
   * Merge two nodes into one. Transfers all edges from source to target,
   * then deletes source. Used when we discover two entities are the same.
   */
  mergeNodes(sourceId: string, targetId: string): void {
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);
    if (!source || !target) {
      logger.warn(
        { sourceId, targetId },
        "Cannot merge: one or both nodes not found",
      );
      return;
    }

    // Transfer all edges from source to target
    for (const edge of this.edges) {
      if (edge.from === sourceId) edge.from = targetId;
      if (edge.to === sourceId) edge.to = targetId;
    }

    // Merge properties (target wins on conflict)
    target.properties = { ...source.properties, ...target.properties };

    // Remove source node
    this.nodes.delete(sourceId);
    logger.info({ sourceId, targetId }, "Nodes merged");
  }

  /**
   * Get full context for an entity: its node, neighbors, relationships,
   * and similar entities. Used by Context Compiler to enrich LLM prompts.
   */
  getFullContext(nodeId: string): Record<string, unknown> {
    const node = this.nodes.get(nodeId);
    if (!node) return {};

    const neighbors = this.getNeighbors(nodeId).map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      properties: n.properties,
    }));

    const edges = this.getEdges(nodeId).map((e) => ({
      type: e.type,
      from: e.from,
      to: e.to,
      properties: e.properties,
    }));

    const similar = this.findSimilarNodes(nodeId, 0.3, 3);

    return {
      entity: {
        id: node.id,
        type: node.type,
        label: node.label,
        properties: node.properties,
      },
      neighbors,
      edges,
      similarEntities: similar.map((s) => ({
        id: s.node.id,
        label: s.node.label,
        similarity: s.similarity,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // Serialization
  // ═══════════════════════════════════════════════════════════════

  toJSON(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: [...this.nodes.values()],
      edges: [...this.edges],
    };
  }

  static fromJSON(data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  }): KnowledgeGraph {
    const graph = new KnowledgeGraph();
    for (const node of data.nodes) {
      graph.addNode(node);
    }
    for (const edge of data.edges) {
      // Restore Date object from string serialization
      const restoredEdge: GraphEdge = {
        ...edge,
        createdAt: new Date(edge.createdAt),
      };
      graph.edges.push(restoredEdge);
    }
    return graph;
  }
}
