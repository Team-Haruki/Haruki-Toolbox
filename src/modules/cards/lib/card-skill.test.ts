import { describe, expect, it } from "bun:test"
import {
  CARD_SKILL_FILTER_TYPES,
  buildCardSkillIndex,
  buildCardSkillView,
  classifyCardSkillFilterType,
  formatCardSkillAtLevel,
  normalizeCardSkill,
} from "./card-skill"

const rawSkills = [
  {
    id: 1,
    description: " {{1;d}}초 동안 스코어가 {{1;v}}% 상승한다.",
    skillEffects: [
      {
        id: 1,
        skillEffectType: "score_up",
        skillEffectDetails: [
          { id: 1, level: 1, activateEffectDuration: 5.0, activateEffectValue: 20, activateEffectValueType: "rate" },
          { id: 2, level: 2, activateEffectDuration: 5.0, activateEffectValue: 25, activateEffectValueType: "rate" },
          { id: 3, level: 3, activateEffectDuration: 5.0, activateEffectValue: 30, activateEffectValueType: "rate" },
          { id: 4, level: 4, activateEffectDuration: 5.0, activateEffectValue: 40, activateEffectValueType: "rate" },
        ],
      },
    ],
  },
  {
    id: 2,
    description: "Recover {{9;v}} life.",
    skillEffects: [],
  },
  {
    // Birthday shape: instant life recovery listed BEFORE the score up.
    id: 14,
    description: "라이프를 {{42;v}} 회복하고 {{43;d}}초 동안 스코어가 {{43;v}}% 상승한다.",
    skillEffects: [
      {
        id: 42,
        skillEffectType: "life_recovery",
        skillEffectDetails: [
          { id: 1, level: 1, activateEffectDuration: 0, activateEffectValue: 150 },
          { id: 2, level: 2, activateEffectDuration: 0, activateEffectValue: 200 },
        ],
      },
      {
        id: 43,
        skillEffectType: "score_up",
        skillEffectDetails: [
          { id: 3, level: 1, activateEffectDuration: 5.0, activateEffectValue: 55 },
          { id: 4, level: 2, activateEffectDuration: 5.0, activateEffectValue: 60 },
        ],
      },
    ],
  },
  {
    // Bloom Fes shape: character placeholder, rank-bonus range and total sum.
    id: 22,
    description: "{{53;d}}초 동안 스코어가 {{53;v}}% 상승하며, '{{0;c}}'의 랭크에 의해 {{54,103;r}}% 상승한다. (최대 {{53,103;s}}%/{{53,103;v}}%)",
    skillEffects: [
      {
        id: 53,
        skillEffectType: "score_up",
        skillEffectDetails: [
          { id: 1, level: 1, activateEffectDuration: 5.0, activateEffectValue: 90 },
          { id: 2, level: 2, activateEffectDuration: 5.0, activateEffectValue: 95 },
        ],
      },
      {
        id: 54,
        skillEffectType: "score_up_character_rank",
        skillEffectDetails: [
          { id: 3, level: 1, activateEffectDuration: 5.0, activateEffectValue: 1 },
          { id: 4, level: 2, activateEffectDuration: 5.0, activateEffectValue: 1 },
        ],
      },
      {
        id: 103,
        skillEffectType: "score_up_character_rank",
        skillEffectDetails: [
          { id: 5, level: 1, activateEffectDuration: 5.0, activateEffectValue: 50 },
          { id: 6, level: 2, activateEffectDuration: 5.0, activateEffectValue: 50 },
        ],
      },
    ],
  },
  {
    // Unit Fes shape: `e` reads the skillEnhance bonus, not the value list.
    id: 15,
    description: "스코어 {{44;v}}% UP, 멤버당 스코어 {{44;e}}% UP (최대 {{44;m}}%)",
    skillEffects: [
      {
        id: 44,
        skillEffectType: "score_up",
        skillEnhance: {
          id: 1,
          activateEffectValue: 10,
          activateEffectValueType: "rate",
          skillEnhanceType: "sub_unit_score_up",
        },
        skillEffectDetails: [
          { id: 1, level: 1, activateEffectDuration: 5.0, activateEffectValue: 80 },
          { id: 2, level: 2, activateEffectDuration: 5.0, activateEffectValue: 85 },
        ],
      },
    ],
  },
]

describe("normalizeCardSkill", () => {
  it("returns null without a skill id or matching record", () => {
    expect(normalizeCardSkill(rawSkills, null)).toBeNull()
    expect(normalizeCardSkill(rawSkills, 999)).toBeNull()
    expect(normalizeCardSkill(undefined, 1)).toBeNull()
  })

  it("formats duration and value placeholders from skill effects", () => {
    const skill = normalizeCardSkill(rawSkills, 1)
    expect(skill).not.toBeNull()
    expect(skill?.formattedDescription).toBe("5초 동안 스코어가 20/25/30/40% 상승한다.")
    expect(skill?.description).toContain("{{1;d}}")
  })

  it("builds per-level effect rows", () => {
    const skill = normalizeCardSkill(rawSkills, 1)
    expect(skill?.effectRows).toEqual([
      { level: 1, value: 20, duration: 5 },
      { level: 2, value: 25, duration: 5 },
      { level: 3, value: 30, duration: 5 },
      { level: 4, value: 40, duration: 5 },
    ])
  })

  it("degrades unresolvable placeholders instead of leaking braces", () => {
    const skill = normalizeCardSkill(rawSkills, 2)
    expect(skill?.formattedDescription).toBe("Recover ? life.")
    expect(skill?.effectRows).toEqual([])
  })

  it("uses the score-up effect for rows when a birthday skill lists life recovery first", () => {
    const skill = normalizeCardSkill(rawSkills, 14)
    expect(skill?.effectRows).toEqual([
      { level: 1, value: 55, duration: 5 },
      { level: 2, value: 60, duration: 5 },
    ])
    expect(skill?.formattedDescription).toBe("라이프를 150/200 회복하고 5초 동안 스코어가 55/60% 상승한다.")
  })

  it("resolves Bloom Fes character, range and sum placeholders", () => {
    const skill = normalizeCardSkill(rawSkills, 22, { characterName: "미쿠" })
    expect(skill?.formattedDescription).toBe(
      "5초 동안 스코어가 90/95% 상승하며, '미쿠'의 랭크에 의해 1~50% 상승한다. (최대 140/145%/140/145%)",
    )
  })

  it("resolves enhance and unit-fes maximum placeholders from skillEnhance", () => {
    const skill = normalizeCardSkill(rawSkills, 15)
    expect(skill?.formattedDescription).toBe("스코어 80/85% UP, 멤버당 스코어 10% UP (최대 130/135%)")
  })
})

describe("skill records and level-aware formatting", () => {
  it("indexes records with effect types, filter type and max level", () => {
    const index = buildCardSkillIndex(rawSkills)
    expect(index.size).toBe(5)
    expect(index.get(1)).toMatchObject({ effectTypes: ["score_up"], filterType: "score_up", maxLevel: 4 })
    expect(index.get(14)).toMatchObject({ effectTypes: ["life_recovery", "score_up"], filterType: "life_recovery" })
    expect(index.get(22)).toMatchObject({ filterType: "score_up_character_rank" })
    expect(index.get(2)).toMatchObject({ effectTypes: [], filterType: "score_up", maxLevel: 1 })
  })

  it("classifies the filter type by the distinguishing effect", () => {
    expect(classifyCardSkillFilterType(["score_up", "judgment_up"])).toBe("judgment_up")
    expect(classifyCardSkillFilterType(["score_up"])).toBe("score_up")
    expect(classifyCardSkillFilterType([])).toBe("score_up")
    expect(CARD_SKILL_FILTER_TYPES).toHaveLength(8)
  })

  it("formats a single level", () => {
    const index = buildCardSkillIndex(rawSkills)
    expect(formatCardSkillAtLevel(index.get(1)!, 3)).toBe("5초 동안 스코어가 30% 상승한다.")
    expect(formatCardSkillAtLevel(index.get(14)!, 2)).toBe("라이프를 200 회복하고 5초 동안 스코어가 60% 상승한다.")
    expect(formatCardSkillAtLevel(index.get(22)!, 2, { characterName: "미쿠" })).toBe(
      "5초 동안 스코어가 95% 상승하며, '미쿠'의 랭크에 의해 1~50% 상승한다. (최대 145%/145%)",
    )
    expect(formatCardSkillAtLevel(index.get(15)!, 1)).toBe("스코어 80% UP, 멤버당 스코어 10% UP (최대 130%)")
  })

  it("falls back to the nearest lower level when a level is missing", () => {
    const index = buildCardSkillIndex(rawSkills)
    // Skill 14 only has levels 1-2; level 4 resolves to level 2.
    expect(formatCardSkillAtLevel(index.get(14)!, 4)).toBe("라이프를 200 회복하고 5초 동안 스코어가 60% 상승한다.")
    expect(formatCardSkillAtLevel(index.get(14)!, 0)).toBe("라이프를 150 회복하고 5초 동안 스코어가 55% 상승한다.")
  })

  it("keeps the per-level list form on the view", () => {
    const index = buildCardSkillIndex(rawSkills)
    const view = buildCardSkillView(index.get(1)!)
    expect(view.formattedDescription).toBe("5초 동안 스코어가 20/25/30/40% 상승한다.")
    expect(view.effectTypes).toEqual(["score_up"])
    expect(view.maxLevel).toBe(4)
  })
})
