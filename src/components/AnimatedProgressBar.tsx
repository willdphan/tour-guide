"use client"

import React, { useState, useEffect } from 'react'
import * as Progress from "@radix-ui/react-progress"

export default function AnimatedProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const duration = 2000 // 2 seconds in milliseconds
    const interval = 16 // Update roughly every 16ms for smooth animation (60fps)
    const steps = duration / interval
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const newProgress = Math.min((currentStep / steps) * 100, 100)
      setProgress(newProgress)
      console.log('Progress:', newProgress) // Log the progress

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <Progress.Root
      className="relative overflow-hidden bg-gray-200 rounded-full w-full h-1"
      style={{
        // Fix for Safari
        transform: 'translateZ(0)',
      }}
    >
      <Progress.Indicator
        className="bg-blue-500 w-full h-full transition-transform duration-[660ms] ease-[cubic-bezier(0.65, 0, 0.35, 1)]"
        style={{ transform: `translateX(-${100 - progress}%)` }}
      />
    </Progress.Root>
  )
}