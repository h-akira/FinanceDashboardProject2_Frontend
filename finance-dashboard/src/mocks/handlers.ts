import { HttpResponse, delay, http } from 'msw'
import type { InterestRateResponse } from '@/api/generated/main/model'

function generateInterestRateData(): InterestRateResponse {
  const data = []
  const startYear = 2020
  const endYear = 2025

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === endYear && month > 6) break

      const lastDay = new Date(year, month, 0).getDate()
      const time = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      // Simulate realistic rate movements
      const baseTarget = year < 2022 ? 0.25 : year < 2023 ? 1.5 + month * 0.3 : 5.5
      const baseDgs10 = year < 2022 ? 1.5 + Math.random() * 0.5 : 3.5 + Math.random() * 1.0

      data.push({
        time,
        target_rate: Math.round(Math.min(baseTarget, 5.5) * 100) / 100,
        dgs10: Math.round(baseDgs10 * 100) / 100,
      })
    }
  }

  return { data }
}

export const customHandlers = [
  http.get('/api/v1/main/finance/interest-rate', async () => {
    await delay(300)
    return HttpResponse.json(generateInterestRateData(), { status: 200 })
  }),
]
