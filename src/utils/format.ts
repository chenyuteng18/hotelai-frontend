export function formatMoney(val: number | null | undefined, decimals = 0): string {
  if (val == null || Number.isNaN(val)) return '--'
  const fixed = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString()
  const [intPart, decPart] = fixed.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart ? `${formatted}.${decPart}` : formatted
}

export function formatCurrency(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return '--'
  return `¥${formatMoney(val)}`
}

export function formatCurrencyDecimal(val: number | null | undefined): string {
  if (val == null || Number.isNaN(val)) return '--'
  return `¥${formatMoney(val, 1)}`
}
