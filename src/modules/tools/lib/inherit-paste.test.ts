import { describe, expect, it } from "bun:test"
import { parseInheritPaste } from "@/modules/tools/lib/inherit-paste"

const ID = "AbCdEFGH12345678"
const PASSWORD = "aB:!#[]123"

describe("parseInheritPaste", () => {
  it.each([
    `引き継ぎID：${ID}\nパスワード：${PASSWORD}`,
    `引継ぎID: ${ID}\r\nパスワード: ${PASSWORD}`,
    `引き継ぎコード：${ID}\n引き継ぎパスワード：${PASSWORD}`,
    `Transfer ID: ${ID}\nPassword: ${PASSWORD}`,
    `transfer code: ${ID}\nTRANSFER PASSWORD: ${PASSWORD}`,
    `Transfer ID\n${ID}\nPassword\n${PASSWORD}`,
    `Transfer ID:\n\n${ID}\nPassword:\n${PASSWORD}`,
    `引继码：${ID}\n密码：${PASSWORD}`,
    `引繼 ID：${ID}\n密碼：${PASSWORD}`,
    `【引き継ぎID】 ${ID}\n【パスワード】 ${PASSWORD}`,
    `[Transfer ID]: ${ID}\n[Password]: ${PASSWORD}`,
    `Project SEKAI\nTransfer ID: ${ID}\nPassword: ${PASSWORD}\nKeep this information safe.`,
    `Password: ${PASSWORD}\nTransfer ID: ${ID}`,
  ])("reads labelled credentials without changing their characters", (text) => {
    expect(parseInheritPaste(text)).toEqual({ inheritId: ID, inheritPassword: PASSWORD })
  })

  it.each([
    "",
    ID,
    `${ID}\n${PASSWORD}`,
    `Transfer ID: ${ID}`,
    `Password: ${PASSWORD}`,
    `Transfer ID:\nPassword: ${PASSWORD}`,
    `Transfer ID: ${ID}\nPassword:`,
    `Transfer ID: ${ID}9\nPassword: ${PASSWORD}`,
    `Transfer ID: ${ID.slice(1)}\nPassword: ${PASSWORD}`,
    `Transfer ID: ＡBCD123456789012\nPassword: ${PASSWORD}`,
    `Transfer ID: ${ID}\nPassword: two words`,
    `Transfer ID: ${ID}\nPassword: ${"x".repeat(65)}`,
    `Transfer ID: ${ID}\nPassword: ${"あ".repeat(22)}`,
    `Transfer ID: ${ID}\nPassword: ${PASSWORD}\nPassword: another-password`,
    `Transfer ID: ${ID}\nPassword: ${PASSWORD}\nTransfer ID: ZYXWVUTS12345678`,
    `${"x".repeat(4096)}\nTransfer ID: ${ID}\nPassword: ${PASSWORD}`,
  ])("rejects incomplete, invalid or ambiguous text", (text) => {
    expect(parseInheritPaste(text)).toBeNull()
  })

  it("leaves password reuse policy to the form", () => {
    for (const password of ["short", "x".repeat(64), "ｐａｓｓ１２３４"]) {
      expect(parseInheritPaste(`Transfer ID: ${ID}\nPassword: ${password}`)?.inheritPassword).toBe(password)
    }
  })
})
