// ⚠️  VENDORED — DO NOT EDIT.
// Copied verbatim from numa-lumi-branding-v2 src/lib/cities.ts @ cfc7b542a15e
// by scripts/sync-lumi3d.mjs. Change it upstream and re-run the script.

// Numa's 14-city palette, lifted from the design-system primitives
// (numa-design-system-skills/numa-design-system/tokens.css). Lumi takes on the
// colour of the city the guest is staying in; it is an accent, never the base.
export interface City {
  id: string
  name: string
  hex: string
}

export const CITIES: City[] = [
  { id: 'london', name: 'London', hex: '#9162ca' },
  { id: 'amsterdam', name: 'Amsterdam', hex: '#d31779' },
  { id: 'barcelona', name: 'Barcelona', hex: '#5e5bff' },
  { id: 'berlin', name: 'Berlin', hex: '#ea2720' },
  { id: 'copenhagen', name: 'Copenhagen', hex: '#617b98' },
  { id: 'florence', name: 'Florence', hex: '#5f824f' },
  { id: 'hague', name: 'The Hague', hex: '#d04b2f' },
  { id: 'lisbon', name: 'Lisbon', hex: '#0962c7' },
  { id: 'madrid', name: 'Madrid', hex: '#b76234' },
  { id: 'milan', name: 'Milan', hex: '#0a8b45' },
  { id: 'munich', name: 'Munich', hex: '#1d7ec3' },
  { id: 'paris', name: 'Paris', hex: '#228775' },
  { id: 'rome', name: 'Rome', hex: '#be5d3c' },
  { id: 'venice', name: 'Venice', hex: '#e63305' },
]

export const DEFAULT_CITY = 'london'
export const NUMA_PINK = '#ffc9d2'
export const NUMA_WHITE = '#ffffff'
export const NUMA_CANVAS = '#f7f3f0'

export function cityById(id: string): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0]
}
