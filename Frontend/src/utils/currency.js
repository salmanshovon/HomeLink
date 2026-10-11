const bdtFormatter = new Intl.NumberFormat('en-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatBDT(amount) {
  if (amount == null || amount === '') return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(num)) return '—'
  return bdtFormatter.format(num)
}

export function formatNumber(num) {
  if (num == null) return '—'
  return new Intl.NumberFormat('en-BD').format(num)
}
