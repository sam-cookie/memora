import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const MIN_W = 280
const MAX_W = 860
const MIN_H = 300
const MAX_H = 920

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function useDragResize(initialW: number, initialH: number) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(0, window.innerWidth - initialW - 24),
    y: Math.max(0, window.innerHeight - initialH - 96),
  }))
  const [size, setSize] = useState({ w: initialW, h: initialH })

  // Always-current refs — updated synchronously on every render
  const posRef = useRef(pos)
  const sizeRef = useRef(size)
  posRef.current = pos
  sizeRef.current = size

  const drag = useRef({ on: false, sx: 0, sy: 0, px: 0, py: 0 })
  const resize = useRef({ on: false, dir: 'se' as ResizeDir, sx: 0, sy: 0, px: 0, py: 0, sw: 0, sh: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = drag.current
      if (d.on) {
        const dx = e.clientX - d.sx
        const dy = e.clientY - d.sy
        setPos({
          x: clamp(d.px + dx, 0, window.innerWidth - sizeRef.current.w),
          y: clamp(d.py + dy, 0, window.innerHeight - sizeRef.current.h),
        })
      }

      const r = resize.current
      if (r.on) {
        const dx = e.clientX - r.sx
        const dy = e.clientY - r.sy
        let nx = r.px, ny = r.py, nw = r.sw, nh = r.sh

        if (r.dir.includes('e')) nw = clamp(r.sw + dx, MIN_W, MAX_W)
        if (r.dir.includes('w')) { nw = clamp(r.sw - dx, MIN_W, MAX_W); nx = r.px + r.sw - nw }
        if (r.dir.includes('s')) nh = clamp(r.sh + dy, MIN_H, MAX_H)
        if (r.dir.includes('n')) { nh = clamp(r.sh - dy, MIN_H, MAX_H); ny = r.py + r.sh - nh }

        setPos({ x: nx, y: ny })
        setSize({ w: nw, h: nh })
      }
    }

    const onUp = () => { drag.current.on = false; resize.current.on = false }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, []) // empty deps — uses always-current refs

  const startDrag = useCallback((e: ReactMouseEvent) => {
    e.preventDefault()
    drag.current = { on: true, sx: e.clientX, sy: e.clientY, px: posRef.current.x, py: posRef.current.y }
  }, [])

  const startResize = useCallback(
    (dir: ResizeDir) => (e: ReactMouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      resize.current = {
        on: true, dir,
        sx: e.clientX, sy: e.clientY,
        px: posRef.current.x, py: posRef.current.y,
        sw: sizeRef.current.w, sh: sizeRef.current.h,
      }
    },
    [],
  )

  return { pos, size, startDrag, startResize }
}
