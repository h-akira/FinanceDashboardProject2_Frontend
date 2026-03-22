<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Select from 'primevue/select'

const CONTAINER_ID = 'tradingview_jp225'

const indicators = [
  { label: '一目均衡表', value: 'Ichimoku' },
  { label: 'BB+SMA', value: 'Bollinger_SMA' },
]

const selectedIndicator = ref('Ichimoku')
const currentHeight = ref(700)
let widget: TradingViewWidgetInstance | null = null
let isResizing = false

function getStudies(indicator: string): string[] {
  if (indicator === 'Ichimoku') return ['STD;Ichimoku%1Cloud']
  if (indicator === 'Bollinger_SMA') return ['STD;Bollinger_Bands', 'STD;SMA']
  return []
}

function createWidget() {
  if (widget) {
    widget.remove()
  }

  if (!window.TradingView) return

  widget = new window.TradingView.widget({
    width: '100%',
    height: currentHeight.value,
    symbol: 'OANDA:JP225USD',
    interval: 'D',
    timezone: 'Asia/Tokyo',
    theme: 'light',
    style: '1',
    locale: 'ja',
    details: true,
    enable_publishing: false,
    allow_symbol_change: true,
    studies: getStudies(selectedIndicator.value),
    container_id: CONTAINER_ID,
  })
}

function loadTradingViewScript() {
  if (window.TradingView) {
    createWidget()
    return
  }

  const script = document.createElement('script')
  script.src = 'https://s3.tradingview.com/tv.js'
  script.async = true
  script.onload = () => createWidget()
  document.head.appendChild(script)
}

function updateWidget() {
  createWidget()
}

function onMouseMove(event: MouseEvent) {
  if (!isResizing) return
  const el = document.getElementById(CONTAINER_ID)
  if (!el) return
  const rect = el.getBoundingClientRect()
  const newHeight = event.clientY - rect.top
  if (newHeight > 300 && newHeight < 1200) {
    currentHeight.value = newHeight
    updateWidget()
  }
}

function stopResize() {
  isResizing = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

function startResize() {
  isResizing = true
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', stopResize)
}

onMounted(() => {
  loadTradingViewScript()
})

onBeforeUnmount(() => {
  if (widget) widget.remove()
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <div class="jp225-widget">
    <div class="widget-controls">
      <Select
        v-model="selectedIndicator"
        :options="indicators"
        optionLabel="label"
        optionValue="value"
        class="control-select"
        @change="updateWidget"
      />
    </div>

    <div class="tradingview-widget-container">
      <div :id="CONTAINER_ID"></div>
    </div>

    <div class="resizer" @mousedown="startResize"></div>
  </div>
</template>

<style scoped>
.widget-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.control-select {
  width: auto;
}

.resizer {
  height: 10px;
  background: #ccc;
  cursor: ns-resize;
  margin: 4px 0;
  border-radius: 4px;
}

.resizer:hover {
  background: #999;
}
</style>
