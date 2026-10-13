export function generateColors(count: number, stauration = 65, lightness = 55): string[] {
  if (count < 0) return []
  return Array.from({ length: count }, (_, i) => {
    const hue = (i * 360) / count
    return hslToHex(hue, stauration, lightness)
  })
}
