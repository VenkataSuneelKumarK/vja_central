import request from "supertest";
import { createApp } from "@/app";
import { User } from "@/models/User";
import { Activity } from "@/models/Activity";
import { Announcement } from "@/models/Announcement";

const app = createApp();

describe("Home aggregate endpoint", () => {
  it("returns all sections in a single response", async () => {
    const user = await User.create({ name: "x", email: "x@x.com", passwordHash: "x", role: "editor" });

    await Activity.create({
      title: { en: "Test Activity" },
      description: { en: "desc" },
      date: new Date(),
      location: { en: "Vijayawada" },
      status: "published",
      publishAt: new Date(),
      createdBy: user._id,
    });

    await Announcement.create({
      title: { en: "Urgent notice" },
      content: { en: "content" },
      priority: "urgent",
      status: "published",
      publishAt: new Date(),
      createdBy: user._id,
    });

    const res = await request(app).get("/api/home");
    expect(res.status).toBe(200);
    expect(res.body.data.latestActivities).toHaveLength(1);
    expect(res.body.data.activeAnnouncements).toHaveLength(1);
    expect(res.body.data.upcomingEvents).toEqual([]);
  });
});
