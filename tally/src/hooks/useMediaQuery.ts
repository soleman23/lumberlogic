import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = () => setMatches(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function useBreakpoints() {
  const isMobile = useMediaQuery('(max-width: 760px)')
  const isTablet = useMediaQuery('(min-width: 761px) and (max-width: 1099px)')
  const isShort = useMediaQuery('(max-height: 480px)')
  const isNarrow = useMediaQuery('(max-width: 999px)')
  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile,
    isWide: !isMobile && !isTablet,
    isShort,
    isNarrow,
  }
}
