<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  CrosshairMode,
  ColorType,
  LineSeries,
} from 'lightweight-charts'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import { getInterestRate } from '@/api/generated/main/finance/finance'

const chartContainer = ref<HTMLDivElement | null>(null)
const loading = ref(false)
const errorMessage = ref('')

let chart: IChartApi | null = null
let targetRateSeries: ISeriesApi<'Line'> | null = null
let dgs10Series: ISeriesApi<'Line'> | null = null

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
    },
    timeScale: {
      borderColor: '#d1d4dc',
      timeVisible: false,
    },
    width: chartContainer.value.clientWidth,
    height: 400,
  })

  targetRateSeries = chart.addSeries(LineSeries, {
    color: '#2962ff',
    lineWidth: 2,
    title: 'Target Rate',
  })

  dgs10Series = chart.addSeries(LineSeries, {
    color: '#ff6d00',
    lineWidth: 2,
    title: 'DGS10',
  })
}

async function fetchData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await getInterestRate()
    if (res.status === 200) {
      const data = res.data.data
      const targetRateData = data.map((d) => ({ time: d.time, value: d.target_rate }))
      const dgs10Data = data.map((d) => ({ time: d.time, value: d.dgs10 }))

      targetRateSeries?.setData(targetRateData)
      dgs10Series?.setData(dgs10Data)
      chart?.timeScale().fitContent()
    } else {
      errorMessage.value = 'データの取得に失敗しました'
    }
  } catch {
    errorMessage.value = '通信エラーが発生しました'
  } finally {
    loading.value = false
  }
}

function handleResize() {
  if (chart && chartContainer.value) {
    chart.applyOptions({ width: chartContainer.value.clientWidth })
  }
}

onMounted(() => {
  initChart()
  fetchData()
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
  <div class="interest-rate-widget">
    <div class="widget-header">
      <h3>政策金利・長期金利</h3>
      <Button icon="pi pi-refresh" severity="secondary" text rounded :loading="loading" @click="fetchData" />
    </div>

    <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

    <div v-if="loading && !chart" class="loading-container">
      <ProgressSpinner />
    </div>

    <div ref="chartContainer" class="chart-container"></div>

    <div class="legend">
      <div class="legend-item">
        <span class="legend-color" style="background: #2962ff"></span>
        <span>Federal Funds Target Rate (Upper)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #ff6d00"></span>
        <span>DGS10 (10-Year Treasury Yield)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.interest-rate-widget {
  padding: 0.5rem 0;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.widget-header h3 {
  margin: 0;
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
