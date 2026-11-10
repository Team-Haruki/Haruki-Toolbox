/**
 * The people and projects on the About page.
 *
 * A contributor carries one or more identities; the page prints each as a
 * tag and lets the reader filter by it. To add a person: add an entry here
 * and a `navigationPages.about.contributors.members.<key>.name` string (plus
 * an optional `.quote`). To add an identity: extend `CONTRIBUTOR_IDENTITIES`,
 * give it a `contributors.identities.<key>.{label,desc}` string pair, and an
 * icon and tone in About.vue.
 */

/** Display order: also the order contributors are sorted in. */
export const CONTRIBUTOR_IDENTITIES = ["founder", "core", "docs", "collab", "sponsor"] as const

export type ContributorIdentity = (typeof CONTRIBUTOR_IDENTITIES)[number]

export interface Contributor {
  key: string
  /** GitHub login: shown as the handle and used for the avatar. */
  github?: string
  /** Avatar override: an absolute URL, or a path on the asset endpoint. */
  avatar?: string
  identities: readonly ContributorIdentity[]
  linkUrl: string
}

export const CONTRIBUTORS: readonly Contributor[] = [
  { key: "seiun", github: "MejiroRina", identities: ["founder", "core"], linkUrl: "https://seiun.io" },
  { key: "lingqian", github: "xuanmingLQ", identities: ["core"], linkUrl: "https://github.com/xuanmingLQ" },
  { key: "deseer", github: "Deseer", identities: ["core"], linkUrl: "https://github.com/Deseer" },
  { key: "storyxy", github: "storyxy3", identities: ["core"], linkUrl: "https://github.com/storyxy3" },
  { key: "aposetles", github: "Aposetles", identities: ["docs"], linkUrl: "https://space.bilibili.com/178748972" },
  { key: "tianshinling", github: "YoisakiKnd", identities: ["docs"], linkUrl: "https://ty0.icu/about/" },
  { key: "yangzi", github: "IwasakiYouko", identities: ["docs"], linkUrl: "https://dick.plus" },
  { key: "watagashi", github: "watagashi-uni", identities: ["collab"], linkUrl: "https://github.com/watagashi-uni" },
  { key: "middlered", github: "MiddleRed", identities: ["collab"], linkUrl: "https://mid.red" },
  { key: "dnaroma", github: "DNARoma", identities: ["collab"], linkUrl: "https://blog.dna.moe/about/" },
  { key: "yamamoto", github: "Yamamoto-2", identities: ["sponsor"], linkUrl: "https://github.com/Yamamoto-2" },
]

function identityRank(identity: ContributorIdentity): number {
  return CONTRIBUTOR_IDENTITIES.indexOf(identity)
}

/** A contributor's identities in display order, without repeats. */
export function orderedIdentities(contributor: Contributor): ContributorIdentity[] {
  return [...new Set(contributor.identities)].sort((left, right) => identityRank(left) - identityRank(right))
}

/**
 * Contributors ordered by their leading identity; people who share one keep
 * the order they are listed in.
 */
export function sortContributors(contributors: readonly Contributor[]): Contributor[] {
  const leadingRank = (contributor: Contributor) =>
    Math.min(CONTRIBUTOR_IDENTITIES.length, ...contributor.identities.map(identityRank))
  return contributors
    .map((contributor, index) => ({ contributor, index, rank: leadingRank(contributor) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map((entry) => entry.contributor)
}

/** `null` keeps everyone. */
export function filterContributors(
  contributors: readonly Contributor[],
  identity: ContributorIdentity | null,
): Contributor[] {
  return identity == null
    ? [...contributors]
    : contributors.filter((contributor) => contributor.identities.includes(identity))
}

/** How many contributors hold each identity; identities nobody holds count 0. */
export function countContributorsByIdentity(
  contributors: readonly Contributor[],
): Record<ContributorIdentity, number> {
  const counts = Object.fromEntries(CONTRIBUTOR_IDENTITIES.map((identity) => [identity, 0])) as Record<ContributorIdentity, number>
  for (const contributor of contributors) {
    for (const identity of new Set(contributor.identities)) {
      counts[identity] += 1
    }
  }
  return counts
}

/** The avatar to load: the override when set, otherwise the GitHub avatar. */
export function resolveContributorAvatarUrl(contributor: Contributor, assetEndpoint: string): string {
  const { avatar, github } = contributor
  if (avatar) {
    if (/^https?:\/\//.test(avatar)) {
      return avatar
    }
    return `${assetEndpoint.replace(/\/$/, "")}/${avatar.replace(/^\//, "")}`
  }
  return github ? `https://github.com/${github}.png?size=96` : ""
}

export type ProjectTeam = "haruki" | "seiunx"

export interface AboutProject {
  key: string
  /** The first tag is the project's main language. */
  tags: readonly string[]
  githubUrl: string
}

export const PROJECT_GROUPS: readonly { key: ProjectTeam; projects: readonly AboutProject[] }[] = [
  {
    key: "haruki",
    projects: [
      { key: "toolbox", tags: ["TypeScript", "Vue 3", "Vite", "Shadcn-Vue", "Tailwind CSS"], githubUrl: "https://github.com/Team-Haruki/Haruki-Toolbox" },
      { key: "toolboxBackend", tags: ["Go", "Fiber", "Ent", "PostgreSQL", "Redis", "Ory"], githubUrl: "https://github.com/Team-Haruki/Haruki-Toolbox-Backend" },
      { key: "botBackend", tags: ["Go", "Fiber", "Ent", "PostgreSQL", "Redis"], githubUrl: "https://github.com/Team-Haruki/Haruki-Cloud" },
      { key: "sekaiApi", tags: ["Rust", "Axum", "Tokio", "SeaORM", "Redis"], githubUrl: "https://github.com/Team-Haruki/Haruki-Sekai-API" },
      { key: "eventTracker", tags: ["Rust", "Axum", "Tokio", "SeaORM", "Redis"], githubUrl: "https://github.com/Team-Haruki/Haruki-Event-Tracker" },
      { key: "assetUpdater", tags: ["Rust", "Axum", "Tokio", "unity-rs", "cridecoder"], githubUrl: "https://github.com/Team-Haruki/Haruki-Sekai-Asset-Updater" },
      { key: "deckService", tags: ["Rust", "Axum", "Tokio", "C++ FFI", "Zig"], githubUrl: "https://github.com/Team-Haruki/deck-service" },
      { key: "deckCpp", tags: ["C++", "yyjson", "pybind11", "WebAssembly"], githubUrl: "https://github.com/Team-Haruki/sekai-deck-recommend-cpp" },
      { key: "scoresRs", tags: ["Rust", "tiny-skia", "PyO3"], githubUrl: "https://github.com/Team-Haruki/pjsekai-scores-rs" },
      { key: "drawingEngine", tags: ["Python", "FastAPI", "Granian", "Rust", "Skia"], githubUrl: "https://github.com/Team-Haruki/Haruki-Drawing-API" },
    ],
  },
  {
    key: "seiunx",
    projects: [
      { key: "cridecoder", tags: ["Rust", "PyO3"], githubUrl: "https://github.com/seiunx-dev/cridecoder" },
      { key: "unityRs", tags: ["Rust", "PyO3", "napi-rs"], githubUrl: "https://github.com/seiunx-dev/unity-rs" },
    ],
  },
]

/** A project's main language, lower-cased ("" when it has no tags). */
export function projectLanguage(project: AboutProject): string {
  return project.tags[0]?.toLowerCase() ?? ""
}
