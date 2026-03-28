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
import type {
  CustomChartSource,
  CustomChartSourcesResponseAxisGroups,
} from '@/api/generated/main/model'

const SERIES_COLORS = ['#2962ff', '#ff6d00', '#2e7d32', '#d50000', '#6a1b9a', '#00838f', '#ef6c00']

interface SourceEntry {
  source: CustomChartSource
  checked: boolean
}

interface SubGroup {
  key: string
  displayName: string
  entries: SourceEntry[]
}

interface SourceGroup {
  key: string
  displayName: string
  independent: boolean
  entries: SourceEntry[]
  subGroups?: SubGroup[]
}

const chartContainer = ref<HTMLDivElement | null>(null)
const sourceEntries = ref<SourceEntry[]>([])
const axisGroups = ref<CustomChartSourcesResponseAxisGroups>({})
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

const selectedAxisCount = computed(() => {
  const selected = selectedSources.value
  const normalGroups = new Set(
    selected.filter((s) => !axisGroups.value[s.axis_group]?.independent).map((s) => s.axis_group),
  )
  const independentCount = selected.filter(
    (s) => axisGroups.value[s.axis_group]?.independent,
  ).length
  return normalGroups.size + independentCount
})

const groupedSources = computed((): SourceGroup[] => {
  const groups: SourceGroup[] = []
  const entriesByGroup: Record<string, SourceEntry[]> = {}

  for (const entry of sourceEntries.value) {
    const group = entry.source.axis_group
    if (!entriesByGroup[group]) {
      entriesByGroup[group] = []
    }
    entriesByGroup[group].push(entry)
  }

  for (const [key, groupDef] of Object.entries(axisGroups.value)) {
    if (!entriesByGroup[key]) continue

    const localGroupsDef = groupDef.local_groups ?? {}
    const subGroupMap: Record<string, SourceEntry[]> = {}
    const ungrouped: SourceEntry[] = []

    for (const entry of entriesByGroup[key]) {
      const lgKey = entry.source.local_group
      if (lgKey && localGroupsDef[lgKey]) {
        if (!subGroupMap[lgKey]) subGroupMap[lgKey] = []
        subGroupMap[lgKey].push(entry)
      } else {
        ungrouped.push(entry)
      }
    }

    const subGroups: SubGroup[] = []
    for (const [lgKey, lgDef] of Object.entries(localGroupsDef)) {
      if (subGroupMap[lgKey]) {
        subGroups.push({
          key: lgKey,
          displayName: lgDef.display_name,
          entries: subGroupMap[lgKey],
        })
      }
    }

    const displayName = groupDef.independent
      ? groupDef.display_name
      : `${groupDef.display_name}（${groupDef.label}）`

    groups.push({
      key,
      displayName,
      independent: groupDef.independent,
      entries: ungrouped,
      subGroups: subGroups.length > 0 ? subGroups : undefined,
    })
  }

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
        checked: s.default,
      }))
      axisGroups.value = res.data.axis_groups
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

    // Auto-apply if there are default sources
    const hasDefaults = sourceEntries.value.some((e) => e.checked)
    if (hasDefaults) {
      await handleApply()
    }
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

  // Check axis count
  if (selectedAxisCount.value > maxAxes.value) {
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
      <div ref="chartContainer" class="chart-container"></div>

      <div v-if="renderedSources.length > 0" class="legend">
        <div v-for="(s, i) in renderedSources" :key="s.id" class="legend-item">
          <span
            class="legend-color"
            :style="{ background: SERIES_COLORS[i % SERIES_COLORS.length] }"
          ></span>
          <span>{{ s.name }} ({{ s.axis_label }})</span>
        </div>
      </div>

      <Message v-if="warningMessage" severity="warn" :closable="false">{{
        warningMessage
      }}</Message>
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

      <div class="controls">
        <div class="source-groups">
          <template v-for="group in groupedSources" :key="group.key">
            <div class="source-group" :class="{ 'source-group--has-subgroups': group.subGroups }">
              <div class="source-group-header">{{ group.displayName }}</div>
              <div class="source-group-body">
                <!-- Ungrouped sources (no local_group) -->
                <div v-if="group.entries.length > 0" class="source-group-items">
                  <div v-for="entry in group.entries" :key="entry.source.id" class="source-item">
                    <Checkbox v-model="entry.checked" :inputId="entry.source.id" :binary="true" />
                    <label :for="entry.source.id">{{ entry.source.name }}</label>
                    <Tag
                      v-if="group.independent"
                      :value="entry.source.axis_label"
                      severity="secondary"
                      class="axis-tag"
                    />
                  </div>
                </div>
                <!-- Subgroups (local_groups) -->
                <div v-for="sub in group.subGroups" :key="sub.key" class="subgroup">
                  <div class="subgroup-header">{{ sub.displayName }}</div>
                  <div class="source-group-items">
                    <div v-for="entry in sub.entries" :key="entry.source.id" class="source-item">
                      <Checkbox v-model="entry.checked" :inputId="entry.source.id" :binary="true" />
                      <label :for="entry.source.id">{{ entry.source.name }}</label>
                      <Tag
                        v-if="group.independent"
                        :value="entry.source.axis_label"
                        severity="secondary"
                        class="axis-tag"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
        <Button label="反映" icon="pi pi-check" :loading="loading" @click="handleApply" />
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

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem;
  margin-top: 1rem;
}

.source-groups {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.source-group {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.source-group--has-subgroups {
  flex-direction: column;
  align-items: flex-start;
}

.source-group-header {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--p-text-muted-color, #6b7280);
  white-space: nowrap;
  min-width: 6rem;
}

.source-group-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 0.5rem;
}

.subgroup {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.subgroup-header {
  font-size: 0.75rem;
  color: var(--p-text-muted-color, #6b7280);
  white-space: nowrap;
  min-width: 5.5rem;
}

.source-group-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
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
</style>
