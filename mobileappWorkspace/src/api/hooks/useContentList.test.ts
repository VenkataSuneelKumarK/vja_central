import { flattenPages } from "./useContentList";

describe("flattenPages", () => {
  it("returns an empty array for undefined pages", () => {
    expect(flattenPages(undefined)).toEqual([]);
  });

  it("flattens items across multiple pages in order", () => {
    const pages = [
      { items: [{ id: 1 }, { id: 2 }], page: 1, limit: 2, total: 4, hasMore: true },
      { items: [{ id: 3 }, { id: 4 }], page: 2, limit: 2, total: 4, hasMore: false },
    ];
    expect(flattenPages(pages)).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
  });
});
