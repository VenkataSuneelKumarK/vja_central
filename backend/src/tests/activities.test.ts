import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "@/app";
import { User } from "@/models/User";
import { Activity } from "@/models/Activity";

const app = createApp();

async function loginAs(role: "super_admin" | "content_admin" | "editor" | "viewer") {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  await User.create({ name: `Test ${role}`, email: `${role}@test.com`, passwordHash, role });
  const res = await request(app).post("/api/admin/auth/login").send({ email: `${role}@test.com`, password: "Password123!" });
  return res.body.data.accessToken as string;
}

const samplePayload = {
  title: { en: "Public Interaction Program" },
  description: { en: "Details of the day's public activity." },
  date: "2026-08-30",
  location: { en: "Vijayawada Central" },
};

describe("Activities module", () => {
  it("public list only returns published activities", async () => {
    await Activity.create({ ...samplePayload, status: "draft", createdBy: (await User.create({ name: "x", email: "x@x.com", passwordHash: "x", role: "editor" }))._id });
    const res = await request(app).get("/api/activities");
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it("editor can create a draft but cannot publish it", async () => {
    const token = await loginAs("editor");

    const create = await request(app).post("/api/admin/activities").set("Authorization", `Bearer ${token}`).send(samplePayload);
    expect(create.status).toBe(201);
    expect(create.body.data.status).toBe("draft");

    const publish = await request(app)
      .patch(`/api/admin/activities/${create.body.data._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "published" });
    expect(publish.status).toBe(403);
  });

  it("content_admin can create and publish, and it becomes publicly visible", async () => {
    const token = await loginAs("content_admin");

    const create = await request(app).post("/api/admin/activities").set("Authorization", `Bearer ${token}`).send(samplePayload);
    expect(create.status).toBe(201);

    const publish = await request(app)
      .patch(`/api/admin/activities/${create.body.data._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "published" });
    expect(publish.status).toBe(200);
    expect(publish.body.data.status).toBe("published");

    const publicRes = await request(app).get("/api/activities");
    expect(publicRes.body.data.items).toHaveLength(1);
    expect(publicRes.body.data.items[0].title.en).toBe("Public Interaction Program");
  });

  it("rejects invalid payloads with 400", async () => {
    const token = await loginAs("content_admin");
    const res = await request(app).post("/api/admin/activities").set("Authorization", `Bearer ${token}`).send({ title: {} });
    expect(res.status).toBe(400);
  });

  it("viewer cannot create content", async () => {
    const token = await loginAs("viewer");
    const res = await request(app).post("/api/admin/activities").set("Authorization", `Bearer ${token}`).send(samplePayload);
    expect(res.status).toBe(403);
  });

  it("only super_admin/content_admin can delete", async () => {
    const adminToken = await loginAs("content_admin");
    const create = await request(app).post("/api/admin/activities").set("Authorization", `Bearer ${adminToken}`).send(samplePayload);

    const editorToken = await loginAs("editor");
    const deleteAttempt = await request(app)
      .delete(`/api/admin/activities/${create.body.data._id}`)
      .set("Authorization", `Bearer ${editorToken}`);
    expect(deleteAttempt.status).toBe(403);

    const deleteOk = await request(app)
      .delete(`/api/admin/activities/${create.body.data._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteOk.status).toBe(200);
  });
});
