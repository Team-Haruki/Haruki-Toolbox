export interface SponsorSupporter {
  id: string
  name: string
  avatar: string
  planName: string
  planPrice: number | null
  planRank: number | null
  planPayMonths: number | null
  planExpiresAt: string
  source: string
  isActive: boolean
  totalAmount: number | null
  month: number | null
  paidAt: string
  message: string
}

export interface SponsorSummary {
  totalAmount: number | null
  supporterCount: number
  generatedAt: string
}

export interface SponsorPageData {
  summary: SponsorSummary
  supporters: SponsorSupporter[]
}
