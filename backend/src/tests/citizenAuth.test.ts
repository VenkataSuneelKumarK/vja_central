import request from "supertest";
import { createApp } from "@/app";
import { Citizen } from "@/models/Citizen";

const app = createApp();

const validPayload = {
  username: "raviuser",
  mobile: "9876543210",
  password: "SecurePass123",
  confirmPassword: "SecurePass123",
  fullName: "Ravi Kumar",
};

describe("Citizen auth", () => {
  it("registers successfully and returns an access token (no forced second login)", async () => {
    const res = await request(app).post("/api/citizen/auth/register").send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.citizen.username).toBe("raviuser");
    expect(res.body.data.citizen.mobile).toBe("9876543210");

    const stored = await Citizen.findOne({ username: "raviuser" });
    expect(stored?.passwordHash).not.toBe(validPayload.password);
    expect(stored?.passwordHash).toBeTruthy();
  });

  it("rejects a duplicate username", async () => {
    await request(app).post("/api/citizen/auth/register").send(validPayload);
    const res = await request(app).post("/api/citizen/auth/register").send({ ...validPayload, mobile: "9876543211" });
    expect(res.status).toBe(409);
  });

  it("rejects a duplicate mobile number", async () => {
    await request(app).post("/api/citizen/auth/register").send(validPayload);
    const res = await request(app).post("/api/citizen/auth/register").send({ ...validPayload, username: "anotheruser" });
    expect(res.status).toBe(409);
  });

  it("rejects an invalid Indian mobile number", async () => {
    const res = await request(app).post("/api/citizen/auth/register").send({ ...validPayload, mobile: "12345" });
    expect(res.status).toBe(400);
  });

  it("rejects a mismatched password confirmation", async () => {
    const res = await request(app).post("/api/citizen/auth/register").send({ ...validPayload, confirmPassword: "Different123" });
    expect(res.status).toBe(400);
  });

  it("rejects a password under 8 characters", async () => {
    const res = await request(app).post("/api/citizen/auth/register").send({ ...validPayload, password: "short", confirmPassword: "short" });
    expect(res.status).toBe(400);
  });

  it("logs in with username or mobile number", async () => {
    await request(app).post("/api/citizen/auth/register").send(validPayload);

    const byUsername = await request(app).post("/api/citizen/auth/login").send({ identifier: "raviuser", password: validPayload.password });
    expect(byUsername.status).toBe(200);

    const byMobile = await request(app).post("/api/citizen/auth/login").send({ identifier: "9876543210", password: validPayload.password });
    expect(byMobile.status).toBe(200);
  });

  it("rejects an invalid password", async () => {
    await request(app).post("/api/citizen/auth/register").send(validPayload);
    const res = await request(app).post("/api/citizen/auth/login").send({ identifier: "raviuser", password: "WrongPassword1" });
    expect(res.status).toBe(401);
  });

  it("a citizen access token cannot authenticate against admin-only routes", async () => {
    const register = await request(app).post("/api/citizen/auth/register").send(validPayload);
    const citizenToken = register.body.data.accessToken;

    const res = await request(app).get("/api/admin/grievances").set("Authorization", `Bearer ${citizenToken}`);
    expect(res.status).toBe(401);
  });
});
