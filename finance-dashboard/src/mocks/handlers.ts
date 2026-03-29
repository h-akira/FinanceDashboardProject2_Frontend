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
      local_group: 'us',
      default: true,
    },
    {
      id: 'dgs10',
      name: '米国10年国債利回り',
      axis_group: 'rate_pct1',
      axis_label: '%',
      local_group: 'us',
      default: true,
    },
    {
      id: 'baa10y',
      name: '米国Baa社債スプレッド',
      axis_group: 'rate_pct1',
      axis_label: '%',
      local_group: 'us',
      default: false,
    },
    {
      id: 'sp500',
      name: 'S&P 500',
      axis_group: 'independent1',
      axis_label: 'USD',
      local_group: 'stock_index',
      default: false,
    },
    {
      id: 'sp500_yoy',
      name: 'S&P 500 前年比',
      axis_group: 'ratio1',
      axis_label: '倍率',
      local_group: 'stock_index',
      default: false,
    },
    {
      id: 'dtwexbgs',
      name: 'ドル指数 (実効為替レート)',
      axis_group: 'index1',
      axis_label: '指数',
      default: false,
    },
    {
      id: 'score',
      name: '投資環境スコア（堀井）',
      axis_group: 'independent1',
      axis_label: 'スコア',
      local_group: 'investment_env',
      default: false,
    },
    {
      id: 'ecb_mro_rate',
      name: 'ECB政策金利 (主要リファイナンス金利)',
      axis_group: 'rate_pct1',
      axis_label: '%',
      local_group: 'eu',
      default: false,
    },
    {
      id: 'de_10y',
      name: 'ドイツ10年国債利回り',
      axis_group: 'rate_pct1',
      axis_label: '%',
      local_group: 'eu',
      default: false,
    },
  ],
  axis_groups: {
    rate_pct1: {
      label: '%',
      display_name: '金利・スプレッド',
      independent: false,
      local_groups: { us: { display_name: '米国' }, eu: { display_name: '欧州' } },
    },
    ratio1: {
      label: '倍率',
      display_name: '前年比',
      independent: false,
      local_groups: { stock_index: { display_name: '株価指数' } },
    },
    index1: {
      label: '指数',
      display_name: '通貨指数',
      independent: false,
    },
    independent1: {
      display_name: '独立軸',
      independent: true,
      local_groups: {
        stock_index: { display_name: '株価指数' },
        investment_env: { display_name: '投資環境' },
      },
    },
  },
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
  ecb_mro_rate: () => generateSeriesData('ecb_mro_rate', 2.5, 3.0),
  de_10y: () => generateSeriesData('de_10y', 2.0, 2.5),
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
        const src = sourcesMap[id]!
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
