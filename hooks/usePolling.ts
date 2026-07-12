'use client'

import { useEffect, useRef } from 'react'

/**
 * Custom hook to manage polling intervals that automatically pauses
 * when the document is hidden (user switched tabs or minimized browser).
 * 
 * @param callback The function to execute on interval
 * @param intervalMs The interval duration in milliseconds
 */
export function usePolling(callback: () => void | Promise<void>, intervalMs: number, deps: React.DependencyList = []) {
  const savedCallback = useRef(callback)

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    const tick = () => {
      savedCallback.current()
    }

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(tick, intervalMs)
      }
    }

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        // Run immediately upon returning to the tab, then resume polling
        tick()
        startPolling()
      }
    }

    // Run callback immediately on mount
    tick()
    startPolling()

    // Listen to visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs, ...deps])
}
