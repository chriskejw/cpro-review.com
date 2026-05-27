import { test, expect } from "@playwright/test";

test.describe("Post layout regression", () => {
  test("post hero must not overlap post layout", async ({ page }) => {
    await page.goto("/post1.html");
    await page.waitForSelector(".post-layout");

    const heroHeader = page.locator("main > header").first();
    const postLayout = page.locator(".post-layout").first();
    const article = page.locator(".post-content.article-narrow").first();
    const sidebar = page.locator(".post-sidebar").first();

    const heroBox = await heroHeader.boundingBox();
    const layoutBox = await postLayout.boundingBox();
    const articleBox = await article.boundingBox();
    const sidebarBox = await sidebar.boundingBox();

    expect(heroBox).not.toBeNull();
    expect(layoutBox).not.toBeNull();
    expect(articleBox).not.toBeNull();
    expect(sidebarBox).not.toBeNull();

    expect(layoutBox!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height - 1);
    expect(articleBox!.y).toBeGreaterThanOrEqual(layoutBox!.y - 1);
    expect(sidebarBox!.y).toBeGreaterThanOrEqual(layoutBox!.y - 1);
  });
});
