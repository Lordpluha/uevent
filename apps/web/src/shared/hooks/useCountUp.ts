import { useEffect, useRef, useState } from 'react'

/** Easing: ease-out cubic */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

interface Options {
  duration?: number /** ms, default 1400 */
  start?: number /** start value, default 0 */
}

/**
 * Animates a number from `start` to `end` when the element
 * referenced by the returned `ref` enters the viewport.
 */
export function useCountUp<T extends HTMLElement = HTMLElement>(
  end: number,
  { duration = 1400, start = 0 }: Options = {},
) {
  const [value, setValue] = useState(start)
  const ref = useRef<T | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRun.current) return
        hasRun.current = true

        const startTime = performance.now()

        const tick = (now: number) => {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = easeOutCubic(progress)
          setValue(Math.round(start + (end - start) * eased))
          if (progress < 1) requestAnimationFrame(tick)
        }

        requestAnimationFrame(tick)
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [end, start, duration])

  return { value, ref }
}
