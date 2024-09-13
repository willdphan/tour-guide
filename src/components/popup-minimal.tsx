"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sun, Moon } from 'lucide-react'  // Add Sun and Moon here
import { IBM_Plex_Sans } from 'next/font/google'

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

interface AgentActionConfirmationProps {
  action?: {
    action?: string
    instruction?: string
    thought?: string
  }
  onConfirm: (confirmed: boolean) => void
  isAgentRunning: boolean
  isWaiting: boolean
}

const PopUpDefault: React.FC<AgentActionConfirmationProps> = ({ 
  action = {}, 
  onConfirm, 
  isAgentRunning, 
  isWaiting 
}) => {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [currentPhase, setCurrentPhase] = useState('Initializing')
  const [isBlinking, setIsBlinking] = useState(false)
  const [cycleIndex, setCycleIndex] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)

  const phases = ['Analyzing', 'Processing', 'Finalizing']

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return prevProgress + 1
      })
    }, 100)

    const cycleTimer = setInterval(() => {
      setCycleIndex((prevIndex) => (prevIndex + 1) % phases.length)
    }, 2000)

    return () => {
      clearInterval(progressTimer)
      clearInterval(cycleTimer)
    }
  }, [])

  useEffect(() => {
    setCurrentPhase(phases[cycleIndex])
  }, [cycleIndex])

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 200)
    }, 3000)

    return () => clearInterval(blinkInterval)
  }, [])

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Analyzing':
        return '#3B82F6' // Blue-500
      case 'Processing':
        return '#2563EB' // Blue-600
      case 'Finalizing':
        return '#1D4ED8' // Blue-700
      default:
        return '#3B82F6' // Blue-500
    }
  }

  const getEyeAnimation = () => {
    switch (currentPhase) {
      case 'Analyzing':
        return {
          x: isBlinking ? 0 : [0, 2, -2, 1, -1, 2, -2, 0],
          y: isBlinking ? 0 : [-1, 1, -1, 2, -2, 1, -1, 0],
          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
        }
      case 'Processing':
        return {
          x: isBlinking ? 0 : [-2, 2, -1, 1, 0, -2, 2, -1, 1, 0],
          y: isBlinking ? 0 : [1, -1, 2, -2, 0, -1, 1, -2, 2, 0],
          transition: { repeat: Infinity, duration: 1.5, ease: "linear" }
        }
      case 'Finalizing':
        return {
          x: isBlinking ? 0 : [0, 2, 0, -2, 1, -1, 2, -2, 1, -1, 0],
          y: isBlinking ? 0 : [0, -1, 2, -1, 1, -2, 1, 0, -1, 2, 0],
          transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        }
      default:
        return {}
    }
  }

  const getBlinkAnimation = () => {
    return {
      scaleY: isBlinking ? 0.1 : 1,
      transition: { duration: 0.1 }
    }
  }

  const getCurrentPhaseIndex = () => {
    return phases.indexOf(currentPhase)
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed right-4 bottom-4 z-50 w-64 shadow-md ${ibmPlexSans.className} ${
            isDarkMode ? 'text-white' : 'bg-white text-gray-800'
          }`}
          style={{ backgroundColor: isDarkMode ? '#31313C' : undefined }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <motion.div
                className="flex items-center space-x-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div 
                  className="w-6 h-6 flex items-center justify-center overflow-hidden relative"
                  style={{ backgroundColor: getPhaseColor(currentPhase) }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                    <motion.g animate={getEyeAnimation()}>
                      <motion.rect
                        x="4"
                        y="5"
                        width="2"
                        height="6"
                        rx="1"
                        fill="white"
                        animate={getBlinkAnimation()}
                      />
                      <motion.rect
                        x="10"
                        y="5"
                        width="2"
                        height="6"
                        rx="1"
                        fill="white"
                        animate={getBlinkAnimation()}
                      />
                    </motion.g>
                  </svg>
                </div>
                <p className="text-xs font-medium">{currentPhase}</p>
              </motion.div>
              <div className="flex items-center space-x-2">
                <motion.button
                  className={`text-${isDarkMode ? 'gray-400 hover:text-gray-200' : 'gray-600 hover:text-gray-800'} transition-colors duration-200`}
                  onClick={toggleTheme}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                </motion.button>
                <motion.button 
                  className={`text-${isDarkMode ? 'gray-400 hover:text-gray-200' : 'gray-600 hover:text-gray-800'} transition-colors duration-200`}
                  aria-label="Close"
                  onClick={() => onConfirm(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={14} />
                </motion.button>
              </div>
            </div>
            <div className="space-y-2">
              <div className={`h-1 w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                <motion.div 
                  className="h-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(getCurrentPhaseIndex() + 1) * (100 / phases.length)}%`,
                    backgroundColor: getPhaseColor(currentPhase)
                  }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeInOut",
                    backgroundColor: { duration: 1, ease: "easeInOut" }
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <motion.span 
                  className="text-xs font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {progress}%
                </motion.span>
                <motion.span 
                  className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {progress < 100 ? "In progress" : "Complete"}
                </motion.span>
              </div>
            </div>
            <motion.p 
              className="mt-2 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {action?.instruction || "Processing..."}
            </motion.p>
            {action?.thought && (
              <motion.p 
                className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {action.thought}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PopUpDefault