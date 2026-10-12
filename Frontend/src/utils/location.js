/**
 * Public-facing location labels.
 *
 * District and division are deliberately omitted: for most Bangladeshi
 * properties the district, city and division share a name (e.g. Dhaka), which
 * produced labels like "Kafrul, Dhaka, Dhaka". Showing area + city keeps the
 * card readable.
 */

/**
 * "Kafrul, Dhaka"
 *
 * Falls back to public_location when area/city are missing, and collapses
 * duplicates case-insensitively (area === city, e.g. "Dhaka, Dhaka").
 */
export function formatLocation(source) {
  if (!source) return 'Location unavailable'

  const pick = (...keys) =>
    keys
      .map((key) => (source[key] ?? '').toString().trim())
      .filter(Boolean)

  const seen = new Set()
  const parts = []
  for (const part of [...pick('area'), ...pick('city')]) {
    const key = part.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      parts.push(part)
    }
  }

  if (parts.length > 0) return parts.join(', ')

  return pick('public_location')[0] || 'Location unavailable'
}