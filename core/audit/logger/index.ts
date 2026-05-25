// ===================================================
// YOHAKU Audit & Security — Audit Logger
// ===================================================
//
// The SINGLE entry point for recording audit events.
// All audit logging MUST go through this service.
//
// IMMUTABLE: Records are append-only. No update or delete.
// STRUCTURED: Every event has a typed structure.
// SERVER-ONLY: Can only be used in Server Components, API routes, actions.
// ===================================================

import { prisma } from "@/lib/prisma";
import type { AuditEvent, AuditRecord, AuditQuery, AuditQueryResult } from "../types";

// ---------------------------------------------------------------------------
// Core Logger
// ---------------------------------------------------------------------------

/**
 * Records an audit event to the database.
 * This is the single source of truth for all audit logging.
 *
 * @param event - The structured audit event to record
 * @returns The created audit record
 */
export async function log(event: AuditEvent): Promise<AuditRecord> {
  const record = await prisma.auditLog.create({
    data: {
      actorId: event.actorId ?? null,
      category: event.category,
      action: event.action,
      targetType: event.targetType ?? null,
      targetId: event.targetId ?? null,
      severity: event.severity ?? "info",
      metadata: (event.metadata ?? {}) as any,
      ipAddress: event.ipAddress ?? null,
      userAgent: event.userAgent ?? null,
      sessionId: event.sessionId ?? null,
    },
  });

  return mapRecord(record);
}

/**
 * Records multiple audit events in a transaction.
 * Use for batch operations.
 */
export async function logMany(events: AuditEvent[]): Promise<AuditRecord[]> {
  const records = await prisma.$transaction(
    events.map((event) =>
      prisma.auditLog.create({
        data: {
          actorId: event.actorId ?? null,
          category: event.category,
          action: event.action,
          targetType: event.targetType ?? null,
          targetId: event.targetId ?? null,
          severity: event.severity ?? "info",
          metadata: (event.metadata ?? {}) as any,
          ipAddress: event.ipAddress ?? null,
          userAgent: event.userAgent ?? null,
          sessionId: event.sessionId ?? null,
        },
      }),
    ),
  );

  return records.map(mapRecord);
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

/**
 * Queries audit logs with filters and pagination.
 * Used by the admin audit UI.
 */
export async function queryAuditLogs(query: AuditQuery): Promise<AuditQueryResult> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {};

  if (query.category && query.category !== "all") {
    where.category = query.category;
  }
  if (query.severity && query.severity !== "all") {
    where.severity = query.severity;
  }
  if (query.actorId) {
    where.actorId = query.actorId;
  }
  if (query.action) {
    where.action = { contains: query.action };
  }
  if (query.targetType) {
    where.targetType = query.targetType;
  }
  if (query.fromDate || query.toDate) {
    where.createdAt = {};
    if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
    if (query.toDate) where.createdAt.lte = new Date(query.toDate);
  }
  if (query.search) {
    where.OR = [
      { action: { contains: query.search } },
      { targetType: { contains: query.search } },
      { targetId: { contains: query.search } },
    ];
  }

  const [records, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        actor: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    records: records.map(mapRecord),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Gets recent audit events for a specific user.
 */
export async function getUserAuditLogs(
  userId: string,
  limit = 20,
): Promise<AuditRecord[]> {
  const records = await prisma.auditLog.findMany({
    where: { actorId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return records.map(mapRecord);
}

/**
 * Gets an audit log summary for the admin dashboard.
 */
export async function getAuditSummary(days = 7): Promise<{
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  recentErrors: AuditRecord[];
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [total, byCategory, bySeverity, recentErrors] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
    prisma.auditLog.groupBy({
      by: ["category"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.auditLog.groupBy({
      by: ["severity"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    prisma.auditLog.findMany({
      where: {
        createdAt: { gte: since },
        severity: { in: ["error", "critical"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    total,
    byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
    bySeverity: Object.fromEntries(bySeverity.map((s) => [s.severity, s._count])),
    recentErrors: recentErrors.map(mapRecord),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapRecord(record: any): AuditRecord {
  return {
    id: record.id,
    actorId: record.actorId,
    category: record.category,
    action: record.action,
    targetType: record.targetType,
    targetId: record.targetId,
    severity: record.severity,
    metadata: record.metadata as Record<string, unknown> | null,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    sessionId: record.sessionId,
    createdAt: record.createdAt,
    actorEmail: record.actor?.email ?? null,
    actorName: record.actor?.name ?? null,
  };
}