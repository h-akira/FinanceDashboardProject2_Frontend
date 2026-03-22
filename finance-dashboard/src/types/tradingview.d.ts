interface TradingViewWidgetOptions {
  width: string | number
  height: number
  symbol: string
  interval: string
  timezone: string
  theme: string
  style: string
  locale: string
  details: boolean
  enable_publishing: boolean
  allow_symbol_change: boolean
  studies: string[]
  container_id: string
}

interface TradingViewWidgetInstance {
  remove: () => void
}

interface TradingViewNamespace {
  widget: new (options: TradingViewWidgetOptions) => TradingViewWidgetInstance
}

interface Window {
  TradingView?: TradingViewNamespace
}
