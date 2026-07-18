import { describe, expect, it } from "bun:test"
import { normalizeCardSkill } from "./card-skill"

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
})
