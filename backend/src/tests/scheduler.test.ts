import { User } from "@/models/User";
import { Activity } from "@/models/Activity";
import { Announcement } from "@/models/Announcement";
import { runPublishScheduler } from "@/common/scheduler";

describe("Publish scheduler", () => {
  it("auto-publishes scheduled content whose publishAt has passed", async () => {
    const user = await User.create({ name: "x", email: "x@x.com", passwordHash: "x", role: "editor" });
    const past = new Date(Date.now() - 60_000);

    const activity = await Activity.create({
      title: { en: "Scheduled Activity" },
      description: { en: "desc" },
      date: new Date(),
      location: { en: "Vijayawada" },
      status: "scheduled",
      publishAt: past,
      createdBy: user._id,
    });

    await runPublishScheduler();

    const updated = await Activity.findById(activity._id);
    expect(updated?.status).toBe("published");
  });

  it("archives published content whose expiresAt has passed", async () => {
    const user = await User.create({ name: "x", email: "x@x.com", passwordHash: "x", role: "editor" });
    const past = new Date(Date.now() - 60_000);

    const announcement = await Announcement.create({
      title: { en: "Temporary notice" },
      content: { en: "content" },
      status: "published",
      publishAt: new Date(Date.now() - 120_000),
      expiresAt: past,
      createdBy: user._id,
    });

    await runPublishScheduler();

    const updated = await Announcement.findById(announcement._id);
    expect(updated?.status).toBe("archived");
  });

  it("does not touch content whose publishAt is still in the future", async () => {
    const user = await User.create({ name: "x", email: "x@x.com", passwordHash: "x", role: "editor" });
    const future = new Date(Date.now() + 60_000);

    const activity = await Activity.create({
      title: { en: "Future Activity" },
      description: { en: "desc" },
      date: new Date(),
      location: { en: "Vijayawada" },
      status: "scheduled",
      publishAt: future,
      createdBy: user._id,
    });

    await runPublishScheduler();

    const updated = await Activity.findById(activity._id);
    expect(updated?.status).toBe("scheduled");
  });
});
