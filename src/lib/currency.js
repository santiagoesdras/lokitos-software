const CURRENCY_CONFIG = Object.freeze({
  code: 'GTQ',
  locale: 'es-GT',
  symbol: 'Q'
})

const numberFormatter = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatCurrency(value) {
  const amount = Number(value ?? 0)

  if (!Number.isFinite(amount)) {
    return `${CURRENCY_CONFIG.symbol}0.00`
  }

  const prefix = amount < 0 ? '-' : ''
  const formattedAmount = numberFormatter.format(Math.abs(amount))

  return `${prefix}${CURRENCY_CONFIG.symbol}${formattedAmount}`
}

export function formatCurrencyLabel(label) {
  return `${label} (${CURRENCY_CONFIG.symbol})`
}

export function getCurrencyConfig() {
  return CURRENCY_CONFIG
}
