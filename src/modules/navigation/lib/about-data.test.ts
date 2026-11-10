import { describe, expect, it } from "bun:test"
import zhCN from "@/shared/i18n/messages/zh-CN/zh-CN-public-pages"
import enUS from "@/shared/i18n/messages/en-US/en-US-public-pages"
import {
  CONTRIBUTOR_IDENTITIES,
  CONTRIBUTORS,
  PROJECT_GROUPS,
  countContributorsByIdentity,
  filterContributors,
  orderedIdentities,
  projectLanguage,
  resolveContributorAvatarUrl,
  sortContributors,
  type Contributor,
} from "./about-data"

function person(key: string, identities: Contributor["identities"], extra: Partial<Contributor> = {}): Contributor {
  return { key, identities, linkUrl: `https://example.test/${key}`, ...extra }
}

describe("about contributors", () => {
  it("lists each contributor once, with at least one known identity", () => {
    expect(new Set(CONTRIBUTORS.map((contributor) => contributor.key)).size).toBe(CONTRIBUTORS.length)
    for (const contributor of CONTRIBUTORS) {
      expect(contributor.identities.length).toBeGreaterThan(0)
      expect(contributor.identities.filter((identity) => !CONTRIBUTOR_IDENTITIES.includes(identity))).toEqual([])
    }
  })

  it("has a name for every contributor and a label and description for every identity", () => {
    for (const messages of [zhCN, enUS]) {
      const strings = messages.navigationPages.about.contributors
      const members = strings.members as Record<string, { name?: string }>
      const identities = strings.identities as Record<string, { label?: string; desc?: string }>
      expect(CONTRIBUTORS.filter((contributor) => !members[contributor.key]?.name)).toEqual([])
      expect(CONTRIBUTOR_IDENTITIES.filter((identity) => !identities[identity]?.label || !identities[identity]?.desc)).toEqual([])
    }
  })

  it("puts a contributor's identities in display order without repeats", () => {
    expect(orderedIdentities(person("a", ["sponsor", "core", "founder", "core"]))).toEqual(["founder", "core", "sponsor"])
  })

  it("sorts by the leading identity and keeps the listed order within it", () => {
    const sorted = sortContributors([
      person("sponsor", ["sponsor"]),
      person("docs-1", ["docs"]),
      person("core", ["core"]),
      person("nobody", []),
      person("docs-2", ["docs"]),
      person("founder", ["sponsor", "founder"]),
    ])
    expect(sorted.map((contributor) => contributor.key)).toEqual(["founder", "core", "docs-1", "docs-2", "sponsor", "nobody"])
  })

  it("filters by identity and keeps everyone for null", () => {
    const people = [person("a", ["founder", "core"]), person("b", ["core"]), person("c", ["docs"])]
    expect(filterContributors(people, "core").map((contributor) => contributor.key)).toEqual(["a", "b"])
    expect(filterContributors(people, "sponsor")).toEqual([])
    expect(filterContributors(people, null)).toEqual(people)
  })

  it("counts holders of each identity once per person", () => {
    const counts = countContributorsByIdentity([person("a", ["founder", "core", "core"]), person("b", ["core"])])
    expect(counts).toEqual({ founder: 1, core: 2, docs: 0, collab: 0, sponsor: 0 })
  })

  it("resolves avatars from the override, the asset endpoint, or GitHub", () => {
    expect(resolveContributorAvatarUrl(person("a", [], { avatar: "https://cdn.test/a.png", github: "a" }), "https://assets.test")).toBe("https://cdn.test/a.png")
    expect(resolveContributorAvatarUrl(person("a", [], { avatar: "/avatars/a.png" }), "https://assets.test/")).toBe("https://assets.test/avatars/a.png")
    expect(resolveContributorAvatarUrl(person("a", [], { avatar: "avatars/a.png" }), "https://assets.test")).toBe("https://assets.test/avatars/a.png")
    expect(resolveContributorAvatarUrl(person("a", [], { github: "octo" }), "https://assets.test")).toBe("https://github.com/octo.png?size=96")
    expect(resolveContributorAvatarUrl(person("a", []), "https://assets.test")).toBe("")
  })
})

describe("about projects", () => {
  it("has a name and description for every project and a title for every team", () => {
    for (const messages of [zhCN, enUS]) {
      const strings = messages.navigationPages.about.projects
      const list = strings.list as Record<string, { name?: string; desc?: string }>
      const groups = strings.groups as Record<string, { title?: string; desc?: string }>
      for (const group of PROJECT_GROUPS) {
        expect(groups[group.key]?.title).toBeTruthy()
        expect(group.projects.filter((project) => !list[project.key]?.name || !list[project.key]?.desc)).toEqual([])
      }
    }
  })

  it("reads the main language from the first tag", () => {
    expect(projectLanguage({ key: "a", tags: ["Rust", "Axum"], githubUrl: "" })).toBe("rust")
    expect(projectLanguage({ key: "a", tags: [], githubUrl: "" })).toBe("")
  })
})
