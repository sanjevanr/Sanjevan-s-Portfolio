import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  columnInSurface,
  easeOutQuick,
  lerpShape,
  makeShape,
  quantiseProgress,
  ROUTE_SHAPES,
  scaleShapeHeight,
  shapeDimensions,
  shapePath,
  shapeViewBox,
  type ShapeMode,
  type Shape,
} from '../../lib/morphGeometry'
import '../../styles/morphing-background.css'

const MORPH_DURATION = 450
const COLUMN_STAGGER = 0.15
const MOBILE_QUERY = '(max-width: 760px) and (orientation: portrait)'
const HOVER_LIFT = 20
const SPRING_STIFFNESS = 220
const SPRING_DAMPING = 18
const SPRING_STEP = 1 / 120
const SPRING_EPSILON = 0.01
const HOVER_TOLERANCE_PX = 28
const HOVER_EXIT_TOLERANCE_PX = 36

interface RouteMorph {
  from: Shape
  to: Shape
  startedAt: number
}

interface PointerPosition {
  viewX: number
  viewY: number
  toleranceX: number
  enterToleranceY: number
  exitToleranceY: number
}

function AmbientBackground() {
  return (
    <div className="ambient">
      <div className="ambient__palette" />
      <div className="ambient__palette ambient__palette--second" />
      <div className="ambient__palette ambient__palette--third" />
      <div className="ambient__palette ambient__palette--fourth" />
      <div className="ambient__bands" />
      <div className="ambient__scanlines" />
      <div className="ambient__texture" />
      <span className="orb orb--one" />
      <span className="orb orb--two" />
      <span className="ring ring--one" />
      <span className="ring ring--two" />
      <span className="dot-cluster dot-cluster--one">••••<br />••••<br />••••</span>
      <span className="dot-cluster dot-cluster--two">••••<br />••••<br />••••</span>
    </div>
  )
}

export default function MorphingBackground() {
  const { pathname } = useLocation()
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  const maskId = `morph-mask-${useId().replace(/:/g, '')}`
  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const renderedShapeRef = useRef<Shape>(makeShape(ROUTE_SHAPES['/'].seed))
  const shapeModeRef = useRef<ShapeMode>('desktop')
  const modeRef = useRef<ShapeMode>('desktop')
  const routePathRef = useRef('/')
  const morphRef = useRef<RouteMorph | null>(null)
  const hoveredColumnRef = useRef<number | null>(null)
  const pointerPositionRef = useRef<PointerPosition | null>(null)
  const liftsRef = useRef<number[]>(Array(9).fill(0))
  const velocitiesRef = useRef<number[]>(Array(9).fill(0))
  const visibleRef = useRef(document.visibilityState === 'visible')
  const reducedMotionRef = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const frameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number | null>(null)
  const springAccumulatorRef = useRef(0)
  const lastPathRef = useRef('')
  const tickRef = useRef<(time: number) => void>(() => {})
  const scheduleFrameRef = useRef<() => void>(() => {})
  const renderPathRef = useRef<() => void>(() => {})
  const routePath = ROUTE_SHAPES[pathname] ? pathname : '/'
  const mode: ShapeMode = isMobile ? 'mobile' : 'desktop'
  const dimensions = shapeDimensions(mode)
  routePathRef.current = routePath
  modeRef.current = mode

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const updateViewportMode = () => setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateViewportMode)
    return () => mediaQuery.removeEventListener('change', updateViewportMode)
  }, [])

  useLayoutEffect(() => {
    const pathElement = pathRef.current
    if (!pathElement) return

    if (shapeModeRef.current !== mode) {
      const previousDimensions = shapeDimensions(shapeModeRef.current)
      const heightScale = dimensions.height / previousDimensions.height
      renderedShapeRef.current = scaleShapeHeight(renderedShapeRef.current, previousDimensions.height, dimensions.height)
      liftsRef.current = liftsRef.current.map((lift) => lift * heightScale)
      velocitiesRef.current = velocitiesRef.current.map((velocity) => velocity * heightScale)
      pointerPositionRef.current = null
      hoveredColumnRef.current = null
      shapeModeRef.current = mode
    }
    lastPathRef.current = ''

    renderPathRef.current = () => {
      const nextPath = shapePath(renderedShapeRef.current, mode, liftsRef.current)
      if (lastPathRef.current === nextPath) return
      pathElement.setAttribute('d', nextPath)
      lastPathRef.current = nextPath
    }

    tickRef.current = (now) => {
      frameRef.current = null
      if (!visibleRef.current || reducedMotionRef.current) return

      let routeMoving = false
      const morph = morphRef.current
      if (morph) {
        const elapsed = now - morph.startedAt
        if (elapsed >= MORPH_DURATION) {
          renderedShapeRef.current = morph.to
          morphRef.current = null
        } else {
          const staggerWindow = MORPH_DURATION * COLUMN_STAGGER
          const columnDuration = MORPH_DURATION - staggerWindow
          const progress = morph.to.map((_, index) => {
            const delay = (index / Math.max(1, morph.to.length - 1)) * staggerWindow
            const localProgress = Math.min(1, Math.max(0, (elapsed - delay) / columnDuration))
            return quantiseProgress(easeOutQuick(localProgress))
          })
          renderedShapeRef.current = lerpShape(morph.from, morph.to, progress)
          routeMoving = true
        }
      }

      const pointerPosition = pointerPositionRef.current
      if (pointerPosition) {
        hoveredColumnRef.current = columnInSurface(
          pointerPosition.viewX,
          pointerPosition.viewY,
          renderedShapeRef.current,
          mode,
          pointerPosition.toleranceX,
          pointerPosition.enterToleranceY,
          pointerPosition.exitToleranceY,
          hoveredColumnRef.current,
        )
      }

      const previousTime = lastFrameTimeRef.current
      if (previousTime === null) lastFrameTimeRef.current = now
      else {
        const frameDelta = Math.min(0.05, Math.max(0, (now - previousTime) / 1000))
        lastFrameTimeRef.current = now
        springAccumulatorRef.current = Math.min(0.05, springAccumulatorRef.current + frameDelta)
      }

      let simulationSteps = 0
      while (springAccumulatorRef.current >= SPRING_STEP && simulationSteps < 8) {
        for (let index = 0; index < liftsRef.current.length; index += 1) {
          const target = hoveredColumnRef.current === index ? HOVER_LIFT : 0
          const displacement = liftsRef.current[index]
          const velocity = velocitiesRef.current[index]
          const acceleration = SPRING_STIFFNESS * (target - displacement) - SPRING_DAMPING * velocity
          let nextVelocity = velocity + acceleration * SPRING_STEP
          let nextDisplacement = displacement + nextVelocity * SPRING_STEP

          if (nextDisplacement < 0) {
            nextDisplacement = 0
            if (nextVelocity < 0) nextVelocity = 0
          }

          liftsRef.current[index] = nextDisplacement
          velocitiesRef.current[index] = nextVelocity
        }
        springAccumulatorRef.current -= SPRING_STEP
        simulationSteps += 1
      }

      let springMoving = false
      for (let index = 0; index < liftsRef.current.length; index += 1) {
        const target = hoveredColumnRef.current === index ? HOVER_LIFT : 0
        if (
          Math.abs(target - liftsRef.current[index]) > SPRING_EPSILON ||
          Math.abs(velocitiesRef.current[index]) > SPRING_EPSILON
        ) {
          springMoving = true
          continue
        }

        liftsRef.current[index] = target
        velocitiesRef.current[index] = 0
      }

      renderPathRef.current()
      if (routeMoving || springMoving) scheduleFrameRef.current()
      else {
        lastFrameTimeRef.current = null
        springAccumulatorRef.current = 0
      }
    }

    scheduleFrameRef.current = () => {
      if (frameRef.current === null && visibleRef.current && !reducedMotionRef.current) {
        frameRef.current = requestAnimationFrame((now) => tickRef.current(now))
      }
    }

    renderPathRef.current()
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [mode, dimensions.height])

  useLayoutEffect(() => {
    const destination = makeShape(ROUTE_SHAPES[routePath].seed, mode)
    if (reducedMotionRef.current || !visibleRef.current) {
      renderedShapeRef.current = destination
      morphRef.current = null
      renderPathRef.current()
      return
    }

    morphRef.current = {
      from: renderedShapeRef.current.map((column) => ({ ...column })),
      to: destination,
      startedAt: performance.now(),
    }
    scheduleFrameRef.current()
  }, [routePath, mode])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReducedMotion = () => {
      reducedMotionRef.current = mediaQuery.matches
      if (mediaQuery.matches) {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
        frameRef.current = null
        pointerPositionRef.current = null
        hoveredColumnRef.current = null
        morphRef.current = null
        renderedShapeRef.current = makeShape(ROUTE_SHAPES[routePathRef.current].seed, modeRef.current)
        liftsRef.current.fill(0)
        velocitiesRef.current.fill(0)
        lastFrameTimeRef.current = null
        springAccumulatorRef.current = 0
        renderPathRef.current()
      } else if (visibleRef.current) {
        morphRef.current = {
          from: renderedShapeRef.current.map((column) => ({ ...column })),
          to: makeShape(ROUTE_SHAPES[routePathRef.current].seed, modeRef.current),
          startedAt: performance.now(),
        }
        scheduleFrameRef.current()
      }
    }
    updateReducedMotion()
    mediaQuery.addEventListener('change', updateReducedMotion)
    return () => mediaQuery.removeEventListener('change', updateReducedMotion)
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      visibleRef.current = visible
      rootRef.current?.classList.toggle('morphing-background--paused', !visible)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      lastFrameTimeRef.current = null
      springAccumulatorRef.current = 0

      if (!visible) {
        pointerPositionRef.current = null
        hoveredColumnRef.current = null
        return
      }
      if (reducedMotionRef.current) return

      morphRef.current = {
        from: renderedShapeRef.current.map((column) => ({ ...column })),
        to: makeShape(ROUTE_SHAPES[routePathRef.current].seed, modeRef.current),
        startedAt: performance.now(),
      }
      scheduleFrameRef.current()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    const updateHoverTarget = (column: number | null) => {
      if (column === hoveredColumnRef.current) return
      hoveredColumnRef.current = column
      scheduleFrameRef.current()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        pointerPositionRef.current = null
        updateHoverTarget(null)
        return
      }
      if (reducedMotionRef.current || !visibleRef.current) return

      const target = event.target
      if (target instanceof Element && target.closest('.bottom-dock, .site-content a, .site-content button, .site-content input, .site-content textarea, .site-content select, .site-content [tabindex]')) {
        pointerPositionRef.current = null
        updateHoverTarget(null)
        return
      }

      const svg = svgRef.current
      const matrix = svg?.getScreenCTM()
      if (!svg || !matrix) return
      const scale = Math.hypot(matrix.a, matrix.b)
      if (!Number.isFinite(scale) || scale <= 0) return

      const point = svg.createSVGPoint()
      point.x = event.clientX
      point.y = event.clientY
      const viewPoint = point.matrixTransform(matrix.inverse())
      const toleranceX = HOVER_TOLERANCE_PX / scale
      const enterToleranceY = HOVER_TOLERANCE_PX / scale
      const exitToleranceY = HOVER_EXIT_TOLERANCE_PX / scale
      pointerPositionRef.current = {
        viewX: viewPoint.x,
        viewY: viewPoint.y,
        toleranceX,
        enterToleranceY,
        exitToleranceY,
      }
      updateHoverTarget(columnInSurface(
        viewPoint.x,
        viewPoint.y,
        renderedShapeRef.current,
        modeRef.current,
        toleranceX,
        enterToleranceY,
        exitToleranceY,
        hoveredColumnRef.current,
      ))
    }

    const clearPointer = () => {
      pointerPositionRef.current = null
      updateHoverTarget(null)
    }
    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) clearPointer()
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerout', handlePointerOut, { passive: true })
    window.addEventListener('blur', clearPointer)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('blur', clearPointer)
    }
  }, [])

  return (
    <div ref={rootRef} className={`morphing-background${visibleRef.current ? '' : ' morphing-background--paused'}`} aria-hidden="true">
      <div className={`morphing-background__stage morphing-background__stage--${mode}`}>
        <svg ref={svgRef} className="morph-mask-svg" viewBox={shapeViewBox(mode)} preserveAspectRatio="xMidYMid meet">
          <defs>
            <mask id={maskId} x="0" y="0" width={dimensions.width} height={dimensions.height} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" mask-type="luminance">
              <rect width={dimensions.width} height={dimensions.height} fill="black" />
              <path ref={pathRef} d={shapePath(renderedShapeRef.current, mode, liftsRef.current)} fill="white" />
            </mask>
          </defs>
          <foreignObject x="0" y="0" width={dimensions.width} height={dimensions.height} mask={`url(#${maskId})`}>
            <div className="morphing-background__masked">
              <AmbientBackground />
            </div>
          </foreignObject>
        </svg>
      </div>
    </div>
  )
}
