/**
 * Social Media Investigator — Searches public sources for information
 * about persons of interest.
 *
 * ⚠️ PRINCIPLE: Never investigate without explicit user authorization.
 * Only PUBLIC sources. No hacking, logins, or private data access.
 *
 * Ported from the Python prototype (Capítulo 1 do Vigia).
 */

import { logger } from "../core/logger.js";

// ── Interfaces ──────────────────────────────────────────────────

export interface SocialProfile {
  profileId: string;
  platform: string; // "instagram", "facebook", "linkedin"
  name: string | null;
  username: string | null;
  bio: string | null;
  profileUrl: string | null;
  estimatedAge: number | null;
  ageRange: [number, number] | null;
  location: string | null;
  relationshipStatus: string | null;
  confidence: number; // 0-1 match confidence (facial)
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

// ── Social Media Investigator ───────────────────────────────────

export class SocialMediaInvestigator {
  private reports = new Map<string, InvestigationReport>();
  private reportCounter = 0;

  // ═══════════════════════════════════════════════════════════════
  // Authorization Flow
  // ═══════════════════════════════════════════════════════════════

  /**
   * Request user authorization to investigate a person.
   * Creates a report in AWAITING_AUTHORIZATION state.
   */
  requestAuthorization(personId: string, reason: string): InvestigationReport {
    this.reportCounter++;
    const reportId = `inv-${Date.now()}-${this.reportCounter}`;

    const report: InvestigationReport = {
      reportId,
      targetPersonId: personId,
      authorization: false,
      status: "awaiting_authorization",
      profilesFound: [],
      ageEstimate: null,
      relationshipInfo: {},
      summary: "",
      createdAt: new Date(),
      completedAt: null,
    };

    this.reports.set(reportId, report);

    logger.info(
      { reportId, personId, reason },
      "SocialMediaInvestigator: investigation authorization requested",
    );

    return report;
  }

  /** User authorizes the investigation. */
  authorize(reportId: string): InvestigationReport | undefined {
    const report = this.reports.get(reportId);
    if (!report) {
      logger.warn({ reportId }, "SocialMediaInvestigator: report not found for authorization");
      return undefined;
    }

    if (report.status !== "awaiting_authorization") {
      logger.warn(
        { reportId, status: report.status },
        "SocialMediaInvestigator: cannot authorize — report not awaiting authorization",
      );
      return undefined;
    }

    report.authorization = true;
    report.status = "idle";

    logger.info({ reportId }, "SocialMediaInvestigator: investigation authorized by user");
    return report;
  }

  /** User denies the investigation. */
  deny(reportId: string): InvestigationReport | undefined {
    const report = this.reports.get(reportId);
    if (!report) {
      logger.warn({ reportId }, "SocialMediaInvestigator: report not found for denial");
      return undefined;
    }

    if (report.status !== "awaiting_authorization") {
      logger.warn(
        { reportId, status: report.status },
        "SocialMediaInvestigator: cannot deny — report not awaiting authorization",
      );
      return undefined;
    }

    report.authorization = false;
    report.status = "denied";

    logger.info({ reportId }, "SocialMediaInvestigator: investigation denied by user");
    return report;
  }

  // ═══════════════════════════════════════════════════════════════
  // Investigation
  // ═══════════════════════════════════════════════════════════════

  /**
   * Execute investigation. ONLY if authorized.
   *
   * Searches public profiles (stub — returns empty profiles array),
   * estimates age, finds relationships, generates summary.
   */
  investigate(reportId: string): InvestigationReport | undefined {
    const report = this.reports.get(reportId);
    if (!report) {
      logger.warn({ reportId }, "SocialMediaInvestigator: report not found for investigation");
      return undefined;
    }

    if (!report.authorization) {
      logger.error(
        { reportId, targetPersonId: report.targetPersonId },
        "SocialMediaInvestigator: BLOCKED — investigation requested without authorization. " +
          "This is a violation of the ethical principle.",
      );
      return undefined;
    }

    if (report.status === "completed") {
      logger.warn(
        { reportId },
        "SocialMediaInvestigator: investigation already completed",
      );
      return report;
    }

    report.status = "in_progress";
    logger.info(
      { reportId, targetPersonId: report.targetPersonId },
      "SocialMediaInvestigator: starting investigation",
    );

    // ── Stub: Simulated public profile search ──
    // In production, this would query public APIs for each platform.
    // For now, returns empty profiles array as specified.
    report.profilesFound = [];

    // Age estimate from profiles
    report.ageEstimate = this.estimateAgeFromProfiles(report.profilesFound);

    // Relationship info
    report.relationshipInfo = this.extractRelationshipInfo(report.profilesFound);

    // Generate summary
    report.summary = this.generateSummary(report);

    report.status = "completed";
    report.completedAt = new Date();

    logger.info(
      {
        reportId,
        profilesFound: report.profilesFound.length,
        ageEstimate: report.ageEstimate,
      },
      "SocialMediaInvestigator: investigation completed",
    );

    return report;
  }

  // ═══════════════════════════════════════════════════════════════
  // Analysis Helpers
  // ═══════════════════════════════════════════════════════════════

  /**
   * Estimate the age difference between two persons.
   * Returns absolute difference in years, or null if ages unknown.
   */
  estimateAgeDifference(personA: string, personB: string): number | null {
    // Find any completed reports for these persons
    const reportA = this.findCompletedReport(personA);
    const reportB = this.findCompletedReport(personB);

    if (!reportA?.ageEstimate || !reportB?.ageEstimate) {
      return null;
    }

    return Math.abs(reportA.ageEstimate - reportB.ageEstimate);
  }

  /**
   * Check other relationships for a person across all completed reports.
   */
  checkOtherRelationships(personId: string): Record<string, unknown>[] {
    const relationships: Record<string, unknown>[] = [];

    for (const report of this.reports.values()) {
      if (
        report.targetPersonId === personId &&
        report.status === "completed" &&
        Object.keys(report.relationshipInfo).length > 0
      ) {
        relationships.push(report.relationshipInfo);
      }
    }

    return relationships;
  }

  // ═══════════════════════════════════════════════════════════════
  // Private Helpers
  // ═══════════════════════════════════════════════════════════════

  /** Estimate age from a set of social profiles (stub). */
  private estimateAgeFromProfiles(profiles: SocialProfile[]): number | null {
    const ages = profiles
      .map((p) => p.estimatedAge)
      .filter((a): a is number => a !== null);

    if (ages.length === 0) return null;

    return Math.round(ages.reduce((sum, a) => sum + a, 0) / ages.length);
  }

  /** Extract relationship information from profiles (stub). */
  private extractRelationshipInfo(
    _profiles: SocialProfile[],
  ): Record<string, unknown> {
    // Stub: no real extraction
    return {};
  }

  /** Generate a human-readable summary of the investigation. */
  private generateSummary(report: InvestigationReport): string {
    const parts: string[] = [];

    parts.push(`Investigation report for person ${report.targetPersonId}.`);

    if (report.profilesFound.length === 0) {
      parts.push("No public social media profiles were found.");
    } else {
      parts.push(
        `Found ${report.profilesFound.length} public profile(s) across platforms.`,
      );
    }

    if (report.ageEstimate !== null) {
      parts.push(`Estimated age: ${report.ageEstimate} years.`);
    }

    const relationships = Object.keys(report.relationshipInfo);
    if (relationships.length > 0) {
      parts.push(`Identified ${relationships.length} relationship(s).`);
    }

    return parts.join(" ");
  }

  /** Find the most recent completed report for a person. */
  private findCompletedReport(personId: string): InvestigationReport | undefined {
    let best: InvestigationReport | undefined;
    for (const report of this.reports.values()) {
      if (report.targetPersonId !== personId) continue;
      if (report.status !== "completed") continue;
      if (!best || (report.completedAt && best.completedAt && report.completedAt > best.completedAt)) {
        best = report;
      }
    }
    return best;
  }

  // ═══════════════════════════════════════════════════════════════
  // Public Accessors
  // ═══════════════════════════════════════════════════════════════

  /** Get a report by ID. */
  getReport(reportId: string): InvestigationReport | undefined {
    return this.reports.get(reportId);
  }

  /** Get all reports for a person. */
  getReportsForPerson(personId: string): InvestigationReport[] {
    const result: InvestigationReport[] = [];
    for (const report of this.reports.values()) {
      if (report.targetPersonId === personId) {
        result.push(report);
      }
    }
    return result;
  }
}
