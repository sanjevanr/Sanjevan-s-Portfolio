export interface ShapeColumn {
  width: number
  top: number
  bottom: number
}

export type Shape = ShapeColumn[]

const DESKTOP_WIDTH = 1000
const DESKTOP_HEIGHT = 650
const MOBILE_WIDTH = 650
const MOBILE_HEIGHT = 1000
const COLUMN_COUNT = 9
export type ShapeMode = 'desktop' | 'mobile'

export const ROUTE_SHAPES: Record<string, { seed: number }> = {
  '/': { seed: 7 },
  '/projects': { seed: 19 },
  '/photography': { seed: 31 },
  '/about': { seed: 43 },
  '/contact': { seed: 59 },
}

export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function makeShape(seed: number, mode: ShapeMode = 'desktop'): Shape {
  const widthLimit = mode === 'mobile' ? MOBILE_WIDTH : DESKTOP_WIDTH
  const heightLimit = mode === 'mobile' ? MOBILE_HEIGHT : DESKTOP_HEIGHT
  const random = mulberry32(seed)
  const widths: number[] = []
  let remainingWidth = widthLimit

  for (let index = 0; index < COLUMN_COUNT - 1; index += 1) {
    const remainingColumns = COLUMN_COUNT - index
    const average = remainingWidth / remainingColumns
    const width = Math.round(average * (0.78 + random() * 0.44))
    widths.push(width)
    remainingWidth -= width
  }
  widths.push(remainingWidth)

  let top = mode === 'mobile' ? 95 + random() * 85 : 75 + random() * 50
  let bottom = mode === 'mobile' ? 860 - random() * 100 : 570 - random() * 55
  return widths.map((width, index) => {
    if (index > 0) {
      top = mode === 'mobile'
        ? clamp(top + (random() - 0.5) * 230, 45, 355)
        : clamp(top + (random() - 0.5) * 170, 35, 235)
      bottom = mode === 'mobile'
        ? clamp(bottom + (random() - 0.5) * 220, 645, heightLimit - 25)
        : clamp(bottom + (random() - 0.5) * 150, 420, heightLimit - 25)
    }

    const column = { width, top: Math.round(top), bottom: Math.round(bottom) }
    top = column.top
    bottom = column.bottom
    return column
  })
}

export function lerpShape(from: Shape, to: Shape, progress: number | readonly number[]): Shape {
  return to.map((column, index) => {
    const start = from[index] ?? column
    const amount = typeof progress === 'number' ? progress : progress[index] ?? 1
    return {
      width: lerp(start.width, column.width, amount),
      top: lerp(start.top, column.top, amount),
      bottom: lerp(start.bottom, column.bottom, amount),
    }
  })
}

export function shapePath(shape: Shape, mode: ShapeMode = 'desktop', lift: readonly number[] = []): string {
  const viewWidth = mode === 'mobile' ? MOBILE_WIDTH : DESKTOP_WIDTH
  const columns = normalizeShape(shape, viewWidth).map((column, index) => ({
    ...column,
    top: column.top - (lift[index] ?? 0),
    bottom: column.bottom + (lift[index] ?? 0),
  }))
  const left = -viewWidth * 0.02
  const scale = (viewWidth - left * 2) / viewWidth
  let x = left
  const topPoints: Array<[number, number]> = [[left, columns[0].top]]

  columns.forEach((column, index) => {
    x += column.width * scale
    topPoints.push([x, column.top])
    if (index < columns.length - 1) topPoints.push([x, columns[index + 1].top])
  })

  x = left
  const bottomPoints: Array<[number, number]> = [[left, columns[0].bottom]]
  columns.forEach((column, index) => {
    x += column.width * scale
    bottomPoints.push([x, column.bottom])
    if (index < columns.length - 1) bottomPoints.push([x, columns[index + 1].bottom])
  })

  const points = [...topPoints, ...bottomPoints.reverse()]
  return `M ${points.map(([pointX, pointY]) => `${round(pointX)} ${round(pointY)}`).join(' L ')} Z`
}

export function topEdgePath(shape: Shape, mode: ShapeMode = 'desktop', lift: readonly number[] = []): string {
  const viewWidth = mode === 'mobile' ? MOBILE_WIDTH : DESKTOP_WIDTH
  const columns = normalizeShape(shape, viewWidth).map((column, index) => ({
    ...column,
    top: column.top - (lift[index] ?? 0),
  }))
  const left = -viewWidth * 0.02
  const scale = (viewWidth - left * 2) / viewWidth
  let x = left
  const points: Array<[number, number]> = [[left, columns[0].top]]

  columns.forEach((column, index) => {
    x += column.width * scale
    points.push([x, column.top])
    if (index < columns.length - 1) points.push([x, columns[index + 1].top])
  })

  return `M ${points.map(([pointX, pointY]) => `${round(pointX)} ${round(pointY)}`).join(' L ')}`
}

export function columnAt(viewX: number, shape: Shape, mode: ShapeMode = 'desktop'): number | null {
  const viewWidth = mode === 'mobile' ? MOBILE_WIDTH : DESKTOP_WIDTH
  const left = -viewWidth * 0.02
  const scale = (viewWidth - left * 2) / viewWidth
  const shapeX = (viewX - left) / scale
  if (shapeX < 0 || shapeX > viewWidth) return null

  const totalWidth = shape.reduce((sum, column) => sum + column.width, 0)
  let edge = 0
  for (let index = 0; index < shape.length; index += 1) {
    edge += (shape[index].width / totalWidth) * viewWidth
    if (shapeX <= edge || index === shape.length - 1) return index
  }
  return null
}

export function columnInSurface(
  viewX: number,
  viewY: number,
  shape: Shape,
  mode: ShapeMode,
  toleranceX: number,
  enterToleranceY: number,
  exitToleranceY: number,
  previousColumn: number | null,
): number | null {
  if (shape.length === 0) return null

  const viewWidth = mode === 'mobile' ? MOBILE_WIDTH : DESKTOP_WIDTH
  const left = -viewWidth * 0.02
  const scale = (viewWidth - left * 2) / viewWidth
  const right = left + viewWidth * scale
  let columnIndex = columnAt(viewX, shape, mode)
  if (columnIndex === null) {
    if (viewX < left && viewX >= left - toleranceX) columnIndex = 0
    else if (viewX > right && viewX <= right + toleranceX) columnIndex = shape.length - 1
    else return null
  }

  const toleranceY = columnIndex === previousColumn ? exitToleranceY : enterToleranceY
  const column = shape[columnIndex]
  return viewY >= column.top - toleranceY && viewY <= column.bottom + toleranceY
    ? columnIndex
    : null
}

export function easeOutQuick(value: number): number {
  return 1 - Math.pow(1 - value, 2)
}

export function shapeViewBox(mode: ShapeMode): string {
  return mode === 'mobile'
    ? `0 0 ${MOBILE_WIDTH} ${MOBILE_HEIGHT}`
    : `0 0 ${DESKTOP_WIDTH} ${DESKTOP_HEIGHT}`
}

export function shapeDimensions(mode: ShapeMode): { width: number; height: number } {
  return mode === 'mobile'
    ? { width: MOBILE_WIDTH, height: MOBILE_HEIGHT }
    : { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT }
}

export function scaleShapeHeight(shape: Shape, fromHeight: number, toHeight: number): Shape {
  const scale = toHeight / fromHeight
  return shape.map((column) => ({
    width: column.width,
    top: column.top * scale,
    bottom: column.bottom * scale,
  }))
}

export function quantiseProgress(progress: number, steps = 14): number {
  if (progress >= 1) return 1
  return Math.floor(Math.max(0, progress) * steps) / steps
}

function normalizeShape(shape: Shape, width: number): Shape {
  const totalWidth = shape.reduce((sum, column) => sum + column.width, 0)
  return shape.map((column) => ({ ...column, width: (column.width / totalWidth) * width }))
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
