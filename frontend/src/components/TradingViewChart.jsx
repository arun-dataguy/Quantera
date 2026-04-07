import { useEffect, useRef } from 'react'

/**
 * TradingViewChart — script-based embed (not iframe widgetembed which is deprecated).
 * Re-mounts when `symbol` changes so the chart always reflects the selected stock.
 */
export default function TradingViewChart({ symbol, exchange = 'NASDAQ', height = 480, theme = 'light' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = '100%'
    widgetDiv.style.width = '100%'
    containerRef.current.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `${exchange}:${symbol}`,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme,
      style: '1',
      locale: 'en',
      withdateranges: true,
      allow_symbol_change: false,
      calendar: false,
      studies: ['STD;RSI', 'STD;MACD'],
      support_host: 'https://www.tradingview.com',
    })
    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [symbol, exchange, theme])

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden' }}
    />
  )
}
