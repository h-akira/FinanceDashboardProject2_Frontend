<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  CrosshairMode,
  ColorType,
  LineSeries,
} from 'lightweight-charts'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { getCustomChartSources, getCustomChartData } from '@/api/generated/main/finance/finance'
import type { CustomChartSource } from '@/api/generated/main/model'

const SERIES_COLORS = [
  '#2962ff',
  '#ff6d00',
  '#2e7d32',
  '#d50000',
  '#6a1b9a',
  '#00838f',
  '#ef6c00',
]

interface SourceEntry {
  source: CustomChartSource
  checked: boolean
}

const chartContainer = ref<HTMLDivElement | null>(null)
const sourceEntries = ref<SourceEntry[]>([])
const maxAxes = ref(2)
const loading = ref(false)
const sourcesLoading = ref(false)
const errorMessage = ref('')
const warningMessage = ref('')

let chart: IChartApi | null = null
let seriesList: ISeriesApi<'Line'>[] = []
const renderedSources = ref<CustomChartSource[]>([])

const selectedSources = computed(() =>
  sourceEntries.value.filter((e) => e.checked).map((e) => e.source),
)

const selectedAxisGroups = computed(() => {
  const groups = new Set(selectedSources.value.map((s) => s.axis_group))
  return groups
})

function initChart() {
  if (!chartContainer.value) return

  chart = createChart(chartContainer.value, {
    layout: {
      background: { type: ColorType.Solid, color: '#ffffff' },
      textColor: '#333333',
    },
    grid: {
      vertLines: { color: '#e1e4e8' },
      horzLines: { color: '#e1e4e8' },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
    },
    rightPriceScale: {
      borderColor: '#d1d4dc',
      visible: false,
    },
    leftPriceScale: {
      borderColor: '#d1d4dc',
      visible: false,
    },
    timeScale: {
      borderColor: '#d1d4dc',
      timeVisible: false,
    },
    width: chartContainer.value.clientWidth,
    height: 500,
  })
}

function clearChart() {
  if (!chart) return
  for (const s of seriesList) {
    chart.removeSeries(s)
  }
  seriesList = []
  chart.applyOptions({
    rightPriceScale: { visible: false },
    leftPriceScale: { visible: false },
  })
}

async function fetchSources() {
  sourcesLoading.value = true
  try {
    const res = await getCustomChartSources()
    if (res.status === 200) {
      sourceEntries.value = res.data.sources.map((s) => ({
        source: s,
        checked: false,
      }))
      maxAxes.value = res.data.max_axes
    } else {
      errorMessage.value = 'ソース一覧の取得に失敗しました'
    }
  } catch {
    errorMessage.value = '通信エラーが発生しました'
  } finally {
    sourcesLoading.value = false
    await nextTick()
    initChart()
  }
}

async function handleApply() {
  warningMessage.value = ''
  errorMessage.value = ''

  const selected = selectedSources.value
  if (selected.length === 0) {
    clearChart()
    renderedSources.value = []
    return
  }

  // Check axis group count
  const axisGroups = selectedAxisGroups.value
  if (axisGroups.size > maxAxes.value) {
    warningMessage.value = `Y軸は最大${maxAxes.value}種類までです。選択を見直してください。`
    return
  }

  loading.value = true
  try {
    const sourceIds = selected.map((s) => s.id).join(',')
    const res = await getCustomChartData({ sources: sourceIds })
    if (res.status === 200) {
      renderChart(res.data.series)
      renderedSources.value = [...selected]
    } else {
      errorMessage.value = 'データの取得に失敗しました'
    }
  } catch {
    errorMessage.value = '通信エラーが発生しました'
  } finally {
    loading.value = false
  }
}

function renderChart(
  series: {
    id: string
    name: string
    axis_group: string
    axis_label: string
    data: { time: string; value: number }[]
  }[],
) {
  if (!chart) return
  clearChart()

  // Determine axis assignment
  const uniqueGroups = [...new Set(series.map((s) => s.axis_group))]
  const groupToScale: Record<string, 'right' | 'left'> = {}
  const groupToLabel: Record<string, string> = {}

  uniqueGroups.forEach((group, i) => {
    groupToScale[group] = i === 0 ? 'right' : 'left'
    const matchingSeries = series.find((s) => s.axis_group === group)
    if (matchingSeries) {
      groupToLabel[group] = matchingSeries.axis_label
    }
  })

  // Enable the needed price scales
  chart.applyOptions({
    rightPriceScale: {
      visible: uniqueGroups.length >= 1,
      borderColor: '#d1d4dc',
    },
    leftPriceScale: {
      visible: uniqueGroups.length >= 2,
      borderColor: '#d1d4dc',
    },
  })

  series.forEach((s, i) => {
    const scale = groupToScale[s.axis_group]
    const color = SERIES_COLORS[i % SERIES_COLORS.length]

    const lineSeries = chart!.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      title: s.name,
      priceScaleId: scale,
    })

    const data = s.data
      .map((d) => ({ time: d.time, value: d.value }))
      .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0))
    lineSeries.setData(data)
    seriesList.push(lineSeries)
  })

  chart.timeScale().fitContent()
}

function handleResize() {
  if (chart && chartContainer.value) {
    chart.applyOptions({ width: chartContainer.value.clientWidth })
  }
}

onMounted(() => {
  fetchSources()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.remove()
    chart = null
  }
})
</script>

<template>
  <div class="custom-chart-page">
    <h1>カスタムチャート</h1>

    <div v-if="sourcesLoading" class="loading-container">
      <ProgressSpinner />
    </div>

    <template v-else>
      <div class="controls">
        <div class="source-list">
          <div v-for="entry in sourceEntries" :key="entry.source.id" class="source-item">
            <Checkbox
              v-model="entry.checked"
              :inputId="entry.source.id"
              :binary="true"
            />
            <label :for="entry.source.id">{{ entry.source.name }}</label>
            <Tag :value="entry.source.axis_label" severity="secondary" class="axis-tag" />
          </div>
        </div>
        <Button
          label="反映"
          icon="pi pi-check"
          :loading="loading"
          @click="handleApply"
        />
      </div>

      <Message v-if="warningMessage" severity="warn" :closable="false">{{ warningMessage }}</Message>
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

      <div ref="chartContainer" class="chart-container"></div>

      <div v-if="renderedSources.length > 0" class="legend">
        <div
          v-for="(s, i) in renderedSources"
          :key="s.id"
          class="legend-item"
        >
          <span
            class="legend-color"
            :style="{ background: SERIES_COLORS[i % SERIES_COLORS.length] }"
          ></span>
          <span>{{ s.name }} ({{ s.axis_label }})</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.custom-chart-page {
  padding: 1rem 0;
}

h1 {
  margin-bottom: 1rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.source-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex: 1;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.source-item label {
  font-size: 0.875rem;
  cursor: pointer;
}

.axis-tag {
  font-size: 0.7rem;
}

.chart-container {
  border-radius: 8px;
  overflow: hidden;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--p-text-muted-color, #6b7280);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.legend-color {
  width: 16px;
  height: 3px;
  border-radius: 2px;
}
</style>
