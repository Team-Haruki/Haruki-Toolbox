import { expect, test } from "@playwright/test"

test("about page tags contributors with their identities and filters by one", async ({ page }) => {
  await page.goto("/about")

  await expect(page.getByRole("heading", { level: 1, name: /^(关于 Project Haruki|About Project Haruki)$/ })).toBeVisible()

  const contributors = page.getByTestId("about-contributors")
  const cards = contributors.locator("[data-testid^='about-contributor-']")
  await expect(cards).toHaveCount(11)

  // One person can hold several identities; each shows as its own tag.
  const founder = contributors.getByTestId("about-contributor-seiun")
  await expect(founder.locator("[data-slot='badge']")).toHaveText([/^\s*(创始人|Founder)\s*$/, /^\s*(核心开发|Core developer)\s*$/])

  const coreFilter = contributors.getByTestId("about-identity-core")
  await coreFilter.click()
  await expect(coreFilter).toHaveAttribute("aria-pressed", "true")
  await expect(cards).toHaveCount(4)
  await expect(founder).toBeVisible()
  await expect(contributors.getByTestId("about-contributor-yamamoto")).toHaveCount(0)

  // Pressing the active identity again shows everyone.
  await coreFilter.click()
  await expect(contributors.getByTestId("about-identity-all")).toHaveAttribute("aria-pressed", "true")
  await expect(cards).toHaveCount(11)
})

test("about page jumps from a team in the structure tree to its projects", async ({ page }) => {
  await page.goto("/about")

  await page.getByTestId("about-structure-seiunx").click()
  await expect(page.locator("#about-projects-seiunx")).toBeInViewport()
  await expect(page.locator("#about-projects-seiunx").getByRole("link")).toHaveCount(2)
})
