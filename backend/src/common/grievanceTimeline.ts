import { Types } from "mongoose";
import { GrievanceActivity } from "@/models/GrievanceActivity";

interface WriteTimelineParams {
  grievanceId: Types.ObjectId | string;
  action: string;
  actorType: "citizen" | "admin" | "system";
  actorId?: Types.ObjectId | string | null;
  actorName: string;
  message: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

// The single write path for grievance timeline entries — every status
// change, assignment, comment, resolution, and citizen action goes through
// this so the timeline can never be partially written or overwritten.
export async function writeGrievanceTimeline(params: WriteTimelineParams): Promise<void> {
  await GrievanceActivity.create({
    grievanceId: params.grievanceId,
    action: params.action,
    actorType: params.actorType,
    actorId: params.actorId ?? null,
    actorName: params.actorName,
    message: params.message,
    isPublic: params.isPublic ?? true,
    metadata: params.metadata,
  });
}
