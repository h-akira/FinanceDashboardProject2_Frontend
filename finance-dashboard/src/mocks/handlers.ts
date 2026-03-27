import { HttpResponse, delay, http } from 'msw'
import type {
  InterestRateResponse,
  CustomChartSourcesResponse,
  CustomChartDataResponse,
} from '@/api/generated/main/model'

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

const customChartSources: CustomChartSourcesResponse = {
  sources: [
    {
      id: 'target_rate',
      name: '政策金利 (FF金利誘導目標上限)',
      axis_group: 'rate_pct1',
      axis_label: '%',
    },
    { id: 'dgs10', name: '米国10年国債利回り', axis_group: 'rate_pct1', axis_label: '%' },
    { id: 'baa10y', name: 'Baa社債スプレッド', axis_group: 'rate_pct1', axis_label: '%' },
    { id: 'sp500', name: 'S&P 500', axis_group: 'price_usd1', axis_label: 'USD' },
    { id: 'sp500_yoy', name: 'S&P 500 前年比', axis_group: 'ratio1', axis_label: '倍率' },
    { id: 'dtwexbgs', name: 'ドル指数 (実効為替レート)', axis_group: 'index1', axis_label: '指数' },
    { id: 'score', name: '複合スコア', axis_group: 'score1', axis_label: 'スコア' },
  ],
  max_axes: 2,
}

function generateSeriesData(id: string, baseValue: number, variance: number) {
  const data = []
  for (let year = 2020; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === 2025 && month > 6) break
      for (const day of [1, 15]) {
        const time = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        data.push({
          time,
          value: Math.round((baseValue + (Math.random() - 0.5) * variance) * 100) / 100,
        })
      }
    }
  }
  return data
}

const seriesGenerators: Record<string, () => { time: string; value: number }[]> = {
  target_rate: () => generateSeriesData('target_rate', 3.0, 4.0),
  dgs10: () => generateSeriesData('dgs10', 3.5, 2.0),
  baa10y: () => generateSeriesData('baa10y', 2.0, 1.5),
  sp500: () => generateSeriesData('sp500', 4500, 1500),
  sp500_yoy: () => generateSeriesData('sp500_yoy', 1.1, 0.4),
  dtwexbgs: () => generateSeriesData('dtwexbgs', 110, 20),
  score: () => generateSeriesData('score', 0, 10),
}

export const customHandlers = [
  http.get('/api/v1/main/finance/interest-rate', async () => {
    await delay(300)
    return HttpResponse.json(generateInterestRateData(), { status: 200 })
  }),
  http.get('/api/v1/main/finance/custom-chart/sources', async () => {
    await delay(300)
    return HttpResponse.json(customChartSources, { status: 200 })
  }),
  http.get('/api/v1/main/finance/custom-chart/data', async ({ request }) => {
    await delay(500)
    const url = new URL(request.url)
    const sourcesParam = url.searchParams.get('sources') || ''
    const sourceIds = sourcesParam.split(',').filter(Boolean)
    const sourcesMap = Object.fromEntries(customChartSources.sources.map((s) => [s.id, s]))

    const series: CustomChartDataResponse['series'] = sourceIds
      .filter((id) => id in sourcesMap)
      .map((id) => {
        const src = sourcesMap[id]
        return {
          id: src.id,
          name: src.name,
          axis_group: src.axis_group,
          axis_label: src.axis_label,
          data: seriesGenerators[id]?.() ?? [],
        }
      })

    return HttpResponse.json({ series }, { status: 200 })
  }),
]
