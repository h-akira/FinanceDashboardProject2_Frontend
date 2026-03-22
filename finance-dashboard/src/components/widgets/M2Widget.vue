<script setup lang="ts">
import { ref, computed } from 'vue'
import DatePicker from 'primevue/datepicker'

const today = new Date()
const tenYearsAgo = new Date()
tenYearsAgo.setFullYear(today.getFullYear() - 10)

const startDate = ref(tenYearsAgo)
const endDate = ref(today)

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

const chartUrl = computed(() => {
  const d1 = formatDate(startDate.value)
  const d2 = formatDate(endDate.value)
  return `https://tradingeconomics.com/embed/?s=japanmonsupm2&v=202509111345V20230410&lang=all&h=300&w=600&ref=/japan/money-supply-m2&type=spline&d1=${d1}&d2=${d2}`
})
</script>

<template>
  <div class="m2-widget">
    <h3>日本のマネーサプライ M2</h3>
    <p class="subtitle">単位: JPY Billion</p>

    <div class="date-controls">
      <div class="date-field">
        <label>開始日:</label>
        <DatePicker v-model="startDate" dateFormat="yy-mm-dd" showIcon class="date-picker" />
      </div>
      <div class="date-field">
        <label>終了日:</label>
        <DatePicker v-model="endDate" dateFormat="yy-mm-dd" showIcon class="date-picker" />
      </div>
    </div>

    <div class="iframe-container">
      <iframe
        :src="chartUrl"
        height="300"
        width="600"
        frameborder="0"
        scrolling="no"
        :key="chartUrl"
      ></iframe>
    </div>

    <p class="source">
      source:
      <a
        href="https://jp.tradingeconomics.com/japan/money-supply-m2"
        target="_blank"
        rel="noopener noreferrer"
      >
        tradingeconomics.com
      </a>
    </p>
  </div>
</template>

<style scoped>
.m2-widget {
  padding: 0.5rem 0;
}

h3 {
  margin-bottom: 0.25rem;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--p-text-muted-color, #6b7280);
  margin-bottom: 0.75rem;
}

.date-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.date-field {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.date-field label {
  font-size: 0.875rem;
  white-space: nowrap;
}

.date-picker {
  width: 10rem;
}

.iframe-container {
  overflow-x: auto;
  overflow-y: hidden;
}

.iframe-container iframe {
  display: block;
}

.source {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--p-text-muted-color, #6b7280);
}
</style>
