// src/hooks/useMobileDetection.ts
'use client'

import { useState, useEffect } from 'react'

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768

      setIsMobile(mobile)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}