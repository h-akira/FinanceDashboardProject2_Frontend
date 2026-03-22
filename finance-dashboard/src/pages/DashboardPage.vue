<script setup lang="ts">
import { ref, computed, type Component, shallowRef } from 'vue'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import MarketSummaryWidget from '@/components/widgets/MarketSummaryWidget.vue'
import CalendarWidget from '@/components/widgets/CalendarWidget.vue'
import ExchangeWidget from '@/components/widgets/ExchangeWidget.vue'
import JP225Widget from '@/components/widgets/JP225Widget.vue'
import M2Widget from '@/components/widgets/M2Widget.vue'
import InterestRateWidget from '@/components/widgets/InterestRateWidget.vue'

interface ChartEntry {
  id: string
  label: string
  component: Component
  visible: boolean
}

const availableCharts = ref<ChartEntry[]>([
  {
    id: 'market-summary',
    label: 'マーケット概況',
    component: shallowRef(MarketSummaryWidget),
    visible: true,
  },
  { id: 'calendar', label: '経済カレンダー', component: shallowRef(CalendarWidget), visible: true },
  { id: 'exchange', label: 'FX チャート', component: shallowRef(ExchangeWidget), visible: true },
  { id: 'jp225', label: '日経225', component: shallowRef(JP225Widget), visible: true },
  { id: 'm2', label: 'マネーサプライ M2', component: shallowRef(M2Widget), visible: true },
  {
    id: 'interest-rate',
    label: '政策金利・長期金利',
    component: shallowRef(InterestRateWidget),
    visible: true,
  },
])

const columnOptions = [
  { label: '1列', value: 1 },
  { label: '2列', value: 2 },
  { label: '3列', value: 3 },
]
const columnsPerRow = ref(2)

const visibleCharts = computed(() => availableCharts.value.filter((c) => c.visible))

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columnsPerRow.value}, 1fr)`,
  gap: '1rem',
}))
</script>

<template>
  <div class="dashboard-page">
    <h1>ダッシュボード</h1>

    <div class="controls">
      <div class="chart-toggles">
        <div v-for="chart in availableCharts" :key="chart.id" class="toggle-item">
          <Checkbox v-model="chart.visible" :inputId="chart.id" :binary="true" />
          <label :for="chart.id">{{ chart.label }}</label>
        </div>
      </div>
      <div class="layout-select">
        <label for="columns-select">列数:</label>
        <Select
          id="columns-select"
          v-model="columnsPerRow"
          :options="columnOptions"
          optionLabel="label"
          optionValue="value"
          class="columns-dropdown"
        />
      </div>
    </div>

    <div class="chart-grid" :style="gridStyle">
      <div v-for="chart in visibleCharts" :key="chart.id" class="chart-cell">
        <component :is="chart.component" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding: 1rem 0;
}

h1 {
  margin-bottom: 1rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.toggle-item label {
  font-size: 0.875rem;
  cursor: pointer;
}

.layout-select {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.layout-select label {
  font-size: 0.875rem;
  white-space: nowrap;
}

.columns-dropdown {
  width: 5rem;
}

.chart-cell {
  min-width: 0;
}

@media screen and (max-width: 768px) {
  .chart-grid {
    grid-template-columns: 1fr !important;
  }

  .layout-select {
    display: none;
  }
}
</style>
