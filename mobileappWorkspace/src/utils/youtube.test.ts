import { extractYouTubeId } from "./youtube";

describe("extractYouTubeId", () => {
  it("extracts from a youtu.be short link", () => {
    expect(extractYouTubeId("https://youtu.be/h6YeBnvlBVQ")).toBe("h6YeBnvlBVQ");
  });

  it("extracts from a full watch URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=h6YeBnvlBVQ")).toBe("h6YeBnvlBVQ");
  });

  it("extracts from an embed URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/embed/h6YeBnvlBVQ")).toBe("h6YeBnvlBVQ");
  });

  it("returns null for a non-YouTube URL", () => {
    expect(extractYouTubeId("https://example.com/video.mp4")).toBeNull();
  });

  it("returns null for undefined/empty input", () => {
    expect(extractYouTubeId(undefined)).toBeNull();
    expect(extractYouTubeId("")).toBeNull();
  });
});
