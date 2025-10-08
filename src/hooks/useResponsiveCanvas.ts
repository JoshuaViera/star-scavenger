// src/hooks/useResponsiveCanvas.ts
'use client'

import { useEffect, useState, RefObject } from 'react'

interface CanvasSize {
  width: number
  height: number
  scale: number
}

export function useResponsiveCanvas(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: 800,
    height: 600,
    scale: 1
  })

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = canvasRef.current?.parentElement
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // Base canvas size
      const baseWidth = 800
      const baseHeight = 600
      const baseRatio = baseWidth / baseHeight

      // Calculate scale to fit container while maintaining aspect ratio
      let width = containerWidth
      let height = containerWidth / baseRatio

      if (height > containerHeight) {
        height = containerHeight
        width = containerHeight * baseRatio
      }

      // Scale factor for game logic
      const scale = width / baseWidth

      setCanvasSize({
        width,
        height,
        scale
      })

      // Update canvas display size
      if (canvasRef.current) {
        canvasRef.current.style.width = `${width}px`
        canvasRef.current.style.height = `${height}px`
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    window.addEventListener('orientationchange', updateCanvasSize)

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      window.removeEventListener('orientationchange', updateCanvasSize)
    }
  }, [canvasRef])

  return canvasSize
}