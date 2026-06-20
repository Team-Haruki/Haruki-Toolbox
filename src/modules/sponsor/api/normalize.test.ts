import { describe, expect, it } from "bun:test"
import { normalizeSponsorPageData } from "./normalize"

describe("sponsor normalizers", () => {
  it("normalizes wrapped sponsor list payloads", () => {
    expect(normalizeSponsorPageData({
      updatedData: {
        summary: {
          totalAmount: "18.00",
          supporterCount: 2,
          generatedAt: "2026-06-20T08:00:00Z",
        },
        items: [
          {
            id: "2",
            user: { name: "Miku", avatar: "https://example.com/miku.png" },
            plan: { title: "Monthly spark" },
            all_sum_amount: "13.00",
            month: "2",
            created_at: "2026-06-19T08:00:00Z",
          },
          {
            id: "1",
            user_name: "Haruki",
            total_amount: "5.00",
            status: 2,
          },
        ],
      },
    })).toEqual({
      summary: {
        totalAmount: 18,
        supporterCount: 2,
        generatedAt: "2026-06-20T08:00:00Z",
      },
      supporters: [
        {
          id: "2",
          name: "Miku",
          avatar: "https://example.com/miku.png",
          planName: "Monthly spark",
          planPrice: null,
          planRank: null,
          planPayMonths: null,
          planExpiresAt: "",
          source: "",
          isActive: true,
          totalAmount: 13,
          month: 2,
          paidAt: "2026-06-19T08:00:00Z",
          message: "",
        },
        {
          id: "1",
          name: "Haruki",
          avatar: "",
          planName: "",
          planPrice: null,
          planRank: null,
          planPayMonths: null,
          planExpiresAt: "",
          source: "",
          isActive: false,
          totalAmount: 5,
          month: null,
          paidAt: "",
          message: "",
        },
      ],
    })
  })

  it("accepts afdian webhook order-shaped payloads and filters unpaid orders", () => {
    const normalized = normalizeSponsorPageData({
      ec: 200,
      em: "ok",
      data: {
        type: "order",
        order: {
          out_trade_no: "202106232138371083454010626",
          user_id: "adf397fe8374811eaacee52540025c377",
          month: 1,
          total_amount: "5.00",
          show_amount: "5.00",
          status: 2,
          remark: "thanks",
        },
      },
    })

    expect(normalized.supporters).toEqual([
      {
        id: "adf397fe8374811eaacee52540025c377",
        name: "",
        avatar: "",
        planName: "",
        planPrice: null,
        planRank: null,
        planPayMonths: null,
        planExpiresAt: "",
        source: "",
        isActive: false,
        totalAmount: 5,
        month: 1,
        paidAt: "",
        message: "thanks",
      },
    ])
    expect(normalized.summary.totalAmount).toBe(5)
    expect(normalizeSponsorPageData({ data: { items: [{ id: "unpaid", status: 1 }] } }).supporters).toEqual([])
  })

  it("normalizes afdian query-sponsor payloads", () => {
    expect(normalizeSponsorPageData({
      ec: 200,
      em: "",
      data: {
        total_count: 14,
        total_page: 2,
        list: [
          {
            current_plan: { name: "独立永久方案", price: "1.00", pay_month: 1, expire_time: 1581083107 },
            all_sum_amount: "13.00",
            create_time: 1576776221,
            last_pay_time: 1581083107,
            user: {
              user_id: "sfff",
              name: "十五种幸福",
              avatar: "https://example.com/avatar.jpeg",
            },
          },
        ],
      },
    })).toEqual({
      summary: {
        totalAmount: 13,
        supporterCount: 14,
        generatedAt: "",
      },
      supporters: [
        {
          id: "sfff",
          name: "十五种幸福",
          avatar: "https://example.com/avatar.jpeg",
          planName: "独立永久方案",
          planPrice: 1,
          planRank: null,
          planPayMonths: 1,
          planExpiresAt: "2020-02-07T13:45:07.000Z",
          source: "",
          isActive: true,
          totalAmount: 13,
          month: null,
          paidAt: "2020-02-07T13:45:07.000Z",
          message: "",
        },
      ],
    })
  })
})
