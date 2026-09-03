import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "@/app";
import { User } from "@/models/User";

const app = createApp();

async function createAdmin(role: "super_admin" | "content_admin" | "editor" | "viewer" = "super_admin") {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  return User.create({ name: "Test Admin", email: `${role}@test.com`, passwordHash, role });
}

describe("Auth", () => {
  it("rejects login with wrong password", async () => {
    await createAdmin();
    const res = await request(app).post("/api/admin/auth/login").send({ email: "super_admin@test.com", password: "wrongpass" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("logs in with correct credentials and returns an access token", async () => {
    await createAdmin();
    const res = await request(app).post("/api/admin/auth/login").send({ email: "super_admin@test.com", password: "Password123!" });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe("super_admin");
  });

  it("rejects requests to admin endpoints without a token", async () => {
    const res = await request(app).get("/api/admin/activities");
    expect(res.status).toBe(401);
  });

  it("/me returns the authenticated user", async () => {
    await createAdmin();
    const login = await request(app).post("/api/admin/auth/login").send({ email: "super_admin@test.com", password: "Password123!" });
    const token = login.body.data.accessToken;

    const res = await request(app).get("/api/admin/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("super_admin@test.com");
  });
});
