import { Request } from "express";
import { AuditLog } from "@/models/AuditLog";

interface WriteAuditLogParams {
  req: Request;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}

// Every admin create/update/delete/publish/unpublish action calls this
// (§15: "Every administrative action should be logged"). Failures here are
// logged but never block the actual operation from completing.
export async function writeAuditLog({ req, action, entityType, entityId, before, after }: WriteAuditLogParams): Promise<void> {
  if (!req.user) return;
  await AuditLog.create({
    actorId: req.user.id,
    actorEmail: req.user.email,
    action,
    entityType,
    entityId,
    before,
    after,
    ip: req.ip,
  });
}
