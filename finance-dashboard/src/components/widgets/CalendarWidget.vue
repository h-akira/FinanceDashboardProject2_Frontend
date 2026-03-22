<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const container = ref<HTMLDivElement | null>(null)

function loadWidget() {
  if (!container.value) return

  const script = document.createElement('script')
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
  script.async = true
  script.type = 'text/javascript'
  script.innerHTML = JSON.stringify({
    width: '100%',
    height: '600',
    colorTheme: 'light',
    isTransparent: false,
    locale: 'ja',
    importanceFilter: '0,1',
    currencyFilter: 'AUD,USD,CAD,EUR,FRF,DEM,JPY,MXN,CHF,TRL,GBP',
  })

  container.value.appendChild(script)
}

onMounted(() => {
  loadWidget()
})

onBeforeUnmount(() => {
  if (container.value) {
    const scripts = container.value.querySelectorAll('script')
    scripts.forEach((s) => s.remove())
  }
})
</script>

<template>
  <div class="calendar-widget">
    <div ref="container" class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
    </div>
  </div>
</template>

<style scoped>
.tradingview-widget-container {
  height: 600px;
}
</style>
