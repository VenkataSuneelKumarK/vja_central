import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "@/app";
import { User } from "@/models/User";
import { GrievanceCategory } from "@/models/GrievanceCategory";
import { Grievance } from "@/models/Grievance";
import { Counter } from "@/models/Counter";
import { nextGrievanceNumber } from "@/common/sequence";

const app = createApp();

async function registerCitizen(username: string, mobile: string) {
  const res = await request(app)
    .post("/api/citizen/auth/register")
    .send({ username, mobile, password: "SecurePass123", confirmPassword: "SecurePass123", fullName: username });
  return res.body.data.accessToken as string;
}

async function loginStaff(role: "super_admin" | "content_admin" | "editor" | "viewer") {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  await User.create({ name: `Test ${role}`, email: `${role}@test.com`, passwordHash, role });
  const res = await request(app).post("/api/admin/auth/login").send({ email: `${role}@test.com`, password: "Password123!" });
  return res.body.data.accessToken as string;
}

async function seedCategory() {
  return GrievanceCategory.create({
    name: { en: "Civic", te: "పౌర సేవలు" },
    slug: "civic",
    subCategories: [{ name: { en: "Street Lights", te: "వీధి దీపాలు" }, slug: "street-lights" }],
    isActive: true,
  });
}

const basePayload = (categoryId: string) => ({
  heading: "Street lights not working on XYZ Road",
  description: "Street lights have not been working on XYZ Road for the last five days.",
  category: categoryId,
  subCategory: "street-lights",
  priority: "high",
  ward: "15",
  area: "XYZ Road",
});

describe("Grievance creation", () => {
  it("creates a grievance with a server-generated MV-YYYY-NNNNNN ID", async () => {
    const token = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();

    const res = await request(app).post("/api/grievances").set("Authorization", `Bearer ${token}`).send(basePayload(String(category._id)));
    expect(res.status).toBe(201);
    expect(res.body.data.grievanceNumber).toMatch(/^MV-\d{4}-\d{6}$/);
    expect(res.body.data.status).toBe("open");
    expect(res.body.data.initialPriority).toBe("high");
    expect(res.body.data.slaState).toBe("on_track");
    expect(res.body.data.dueDate).toBeTruthy();
  });

  it("rejects a grievance with a missing heading", async () => {
    const token = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();
    const { heading: _drop, ...rest } = basePayload(String(category._id));
    void _drop;
    const res = await request(app).post("/api/grievances").set("Authorization", `Bearer ${token}`).send(rest);
    expect(res.status).toBe(400);
  });

  it("rejects a grievance with an invalid category id", async () => {
    const token = await registerCitizen("citizen1", "9876543210");
    const res = await request(app)
      .post("/api/grievances")
      .set("Authorization", `Bearer ${token}`)
      .send(basePayload("64f000000000000000000000"));
    expect(res.status).toBe(400);
  });

  it("requires either a sub-category or a custom note", async () => {
    const token = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();
    const { subCategory: _drop, ...rest } = basePayload(String(category._id));
    void _drop;
    const res = await request(app).post("/api/grievances").set("Authorization", `Bearer ${token}`).send(rest);
    expect(res.status).toBe(400);
  });

  it("rejects an unauthenticated submission", async () => {
    const category = await seedCategory();
    const res = await request(app).post("/api/grievances").send(basePayload(String(category._id)));
    expect(res.status).toBe(401);
  });
});

describe("Grievance ID sequence", () => {
  it("increments sequentially within a year", async () => {
    const first = await nextGrievanceNumber(2026);
    const second = await nextGrievanceNumber(2026);
    const third = await nextGrievanceNumber(2026);
    expect(first.grievanceNumber).toBe("MV-2026-000001");
    expect(second.grievanceNumber).toBe("MV-2026-000002");
    expect(third.grievanceNumber).toBe("MV-2026-000003");
  });

  it("resets per year", async () => {
    await nextGrievanceNumber(2026);
    const nextYear = await nextGrievanceNumber(2027);
    expect(nextYear.grievanceNumber).toBe("MV-2027-000001");
  });

  it("remains unique under concurrent generation (atomic increment)", async () => {
    const results = await Promise.all(Array.from({ length: 25 }, () => nextGrievanceNumber(2026)));
    const numbers = results.map((r) => r.grievanceNumber);
    expect(new Set(numbers).size).toBe(25);

    const counter = await Counter.findById("grievance_2026");
    expect(counter?.seq).toBe(25);
  });
});

describe("Grievance ownership and RBAC", () => {
  it("a citizen cannot view another citizen's grievance", async () => {
    const token1 = await registerCitizen("citizen1", "9876543210");
    const token2 = await registerCitizen("citizen2", "9876543211");
    const category = await seedCategory();

    const created = await request(app).post("/api/grievances").set("Authorization", `Bearer ${token1}`).send(basePayload(String(category._id)));
    const grievanceId = created.body.data._id;

    const res = await request(app).get(`/api/grievances/my/${grievanceId}`).set("Authorization", `Bearer ${token2}`);
    expect(res.status).toBe(404);
  });

  it("a citizen cannot access admin grievance endpoints", async () => {
    const token = await registerCitizen("citizen1", "9876543210");
    const res = await request(app).get("/api/admin/grievances").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("editor role can view but not assign/resolve grievances", async () => {
    const editorToken = await loginStaff("editor");
    const citizenToken = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();
    const created = await request(app).post("/api/grievances").set("Authorization", `Bearer ${citizenToken}`).send(basePayload(String(category._id)));
    const grievanceId = created.body.data._id;

    const list = await request(app).get("/api/admin/grievances").set("Authorization", `Bearer ${editorToken}`);
    expect(list.status).toBe(200);

    const assign = await request(app)
      .post(`/api/admin/grievances/${grievanceId}/assign`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ department: "64f000000000000000000000" });
    expect(assign.status).toBe(403);
  });
});

describe("Grievance workflow", () => {
  it("assign -> resolve -> citizen verify -> closed", async () => {
    const adminToken = await loginStaff("content_admin");
    const citizenToken = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();

    const created = await request(app).post("/api/grievances").set("Authorization", `Bearer ${citizenToken}`).send(basePayload(String(category._id)));
    const grievanceId = created.body.data._id;

    // Need a real department id
    const deptRes = await request(app)
      .post("/api/admin/grievance-departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: { en: "Municipal Corporation", te: "మునిసిపల్ కార్పొరేషన్" } });
    expect(deptRes.status).toBe(201);
    const departmentId = deptRes.body.data._id;

    const assign = await request(app)
      .post(`/api/admin/grievances/${grievanceId}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ department: departmentId });
    expect(assign.status).toBe(200);
    expect(assign.body.data.status).toBe("assigned");

    const statusChange = await request(app)
      .patch(`/api/admin/grievances/${grievanceId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "in_progress" });
    expect(statusChange.status).toBe(200);
    expect(statusChange.body.data.status).toBe("in_progress");

    const resolve = await request(app)
      .post(`/api/admin/grievances/${grievanceId}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ resolutionDescription: "Street lights on XYZ Road were repaired and restored." });
    expect(resolve.status).toBe(200);
    expect(resolve.body.data.status).toBe("resolved");
    expect(resolve.body.data.resolvedAt).toBeTruthy();

    const verify = await request(app)
      .post(`/api/grievances/my/${grievanceId}/verify`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ resolved: true });
    expect(verify.status).toBe(200);
    expect(verify.body.data.status).toBe("closed");
    expect(verify.body.data.closedAt).toBeTruthy();

    const feedback = await request(app)
      .post(`/api/grievances/my/${grievanceId}/feedback`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ rating: 5, comment: "Fixed quickly, thank you." });
    expect(feedback.status).toBe(200);
    expect(feedback.body.data.citizenRating).toBe(5);

    const finalDoc = await Grievance.findById(grievanceId);
    expect(finalDoc?.status).toBe("closed");
  });

  it("citizen can reopen a resolved grievance that isn't actually fixed", async () => {
    const adminToken = await loginStaff("content_admin");
    const citizenToken = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();

    const created = await request(app).post("/api/grievances").set("Authorization", `Bearer ${citizenToken}`).send(basePayload(String(category._id)));
    const grievanceId = created.body.data._id;

    const resolve = await request(app)
      .post(`/api/admin/grievances/${grievanceId}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ resolutionDescription: "Street light was repaired." });
    expect(resolve.status).toBe(200);

    const reopen = await request(app)
      .post(`/api/grievances/my/${grievanceId}/verify`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ resolved: false, reopenReason: "The light is still not working." });
    expect(reopen.status).toBe(200);
    expect(reopen.body.data.status).toBe("reopened");
    expect(reopen.body.data.reopenCount).toBe(1);
  });

  it("priority change requires a reason and recomputes the due date", async () => {
    const adminToken = await loginStaff("content_admin");
    const citizenToken = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();

    const created = await request(app)
      .post("/api/grievances")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ ...basePayload(String(category._id)), priority: "normal" });
    const grievanceId = created.body.data._id;
    const originalDueDate = created.body.data.dueDate;

    const noReason = await request(app)
      .patch(`/api/admin/grievances/${grievanceId}/priority`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ priority: "emergency" });
    expect(noReason.status).toBe(400);

    const withReason = await request(app)
      .patch(`/api/admin/grievances/${grievanceId}/priority`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ priority: "emergency", reason: "Multiple residents affected, public safety risk." });
    expect(withReason.status).toBe(200);
    expect(withReason.body.data.priority).toBe("emergency");
    expect(withReason.body.data.initialPriority).toBe("normal");
    expect(withReason.body.data.dueDate).not.toBe(originalDueDate);
  });

  it("rejecting a grievance requires a reason", async () => {
    const adminToken = await loginStaff("content_admin");
    const citizenToken = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();

    const created = await request(app).post("/api/grievances").set("Authorization", `Bearer ${citizenToken}`).send(basePayload(String(category._id)));
    const grievanceId = created.body.data._id;

    const noReason = await request(app).post(`/api/admin/grievances/${grievanceId}/reject`).set("Authorization", `Bearer ${adminToken}`).send({});
    expect(noReason.status).toBe(400);

    const withReason = await request(app)
      .post(`/api/admin/grievances/${grievanceId}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ rejectionReason: "Duplicate of an already-resolved grievance." });
    expect(withReason.status).toBe(200);
    expect(withReason.body.data.status).toBe("rejected");
  });
});

describe("Grievance timeline", () => {
  it("keeps an immutable, append-only history and hides internal notes from citizens", async () => {
    const adminToken = await loginStaff("content_admin");
    const citizenToken = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();

    const created = await request(app).post("/api/grievances").set("Authorization", `Bearer ${citizenToken}`).send(basePayload(String(category._id)));
    const grievanceId = created.body.data._id;

    await request(app)
      .post(`/api/admin/grievances/${grievanceId}/comments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ message: "Internal: waiting on parts from supplier.", isPublic: false });
    await request(app)
      .post(`/api/admin/grievances/${grievanceId}/comments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ message: "Inspection completed, repair scheduled.", isPublic: true });

    const citizenTimeline = await request(app).get(`/api/grievances/my/${grievanceId}/timeline`).set("Authorization", `Bearer ${citizenToken}`);
    expect(citizenTimeline.status).toBe(200);
    const citizenMessages = citizenTimeline.body.data.map((e: { message: string }) => e.message);
    expect(citizenMessages).toContain("Inspection completed, repair scheduled.");
    expect(citizenMessages).not.toContain("Internal: waiting on parts from supplier.");

    const adminTimeline = await request(app).get(`/api/admin/grievances/${grievanceId}/timeline`).set("Authorization", `Bearer ${adminToken}`);
    const adminMessages = adminTimeline.body.data.map((e: { message: string }) => e.message);
    expect(adminMessages).toContain("Internal: waiting on parts from supplier.");
    expect(adminMessages).toContain("Inspection completed, repair scheduled.");
    expect(adminMessages).toContain("Grievance submitted");
  });
});

describe("Grievance admin search", () => {
  it("finds a grievance by citizen mobile number, not just ID/name/heading", async () => {
    const adminToken = await loginStaff("content_admin");
    const citizenToken = await registerCitizen("citizen1", "9876543210");
    const category = await seedCategory();
    await request(app).post("/api/grievances").set("Authorization", `Bearer ${citizenToken}`).send(basePayload(String(category._id)));

    const byMobile = await request(app).get("/api/admin/grievances").query({ q: "9876543210" }).set("Authorization", `Bearer ${adminToken}`);
    expect(byMobile.status).toBe(200);
    expect(byMobile.body.data.items).toHaveLength(1);
    expect(byMobile.body.data.items[0].citizenMobile).toBe("9876543210");

    const byPartialMobile = await request(app).get("/api/admin/grievances").query({ q: "987654" }).set("Authorization", `Bearer ${adminToken}`);
    expect(byPartialMobile.body.data.items).toHaveLength(1);

    const byHeading = await request(app).get("/api/admin/grievances").query({ q: "Street lights" }).set("Authorization", `Bearer ${adminToken}`);
    expect(byHeading.body.data.items).toHaveLength(1);

    const noMatch = await request(app).get("/api/admin/grievances").query({ q: "0000000000" }).set("Authorization", `Bearer ${adminToken}`);
    expect(noMatch.body.data.items).toHaveLength(0);
  });
});
