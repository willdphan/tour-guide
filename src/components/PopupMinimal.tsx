import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { IBM_Plex_Sans } from 'next/font/google'
import { getEyeAnimation, getBlinkAnimation } from '@/utils/animations'

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'Initializing': return '#528A82' // Lightest green (unchanged)
    case 'Analyzing': return '#44756E'    // Slightly darker green
    case 'Processing': return '#365E59'   // Darker green
    case 'Finalizing': return '#26433F'   // Darkest green (as requested)
    default: return '#1D3330'             // Default color (middle shade)
  }
}

interface PopupProps {
  action?: {
    action?: string
    instruction?: string
    thought?: string
  }
}

const PopUpDefault: React.FC<PopupProps> = ({ 
  action = {}, 
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

  const getCurrentPhaseIndex = () => {
    return phases.indexOf(currentPhase)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed right-4 bottom-4 z-50 w-64 shadow-md ${ibmPlexSans.className}`}
          style={{ backgroundColor: 'white' }}
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
                    <motion.g animate={getEyeAnimation(currentPhase, isBlinking)}>
                      <motion.rect
                        x="4"
                        y="5"
                        width="2"
                        height="6"
                        rx="1"
                        fill="white"
                        animate={getBlinkAnimation(isBlinking)}
                      />
                      <motion.rect
                        x="10"
                        y="5"
                        width="2"
                        height="6"
                        rx="1"
                        fill="white"
                        animate={getBlinkAnimation(isBlinking)}
                      />
                    </motion.g>
                  </svg>
                </div>
                <p className="text-xs font-medium">{currentPhase}</p>
              </motion.div>
              <div className="flex items-center space-x-2">
                <motion.button
                  className={`text-gray-600 hover:text-gray-800 transition-colors duration-200`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                </motion.button>
                <motion.button 
                  className={`text-gray-600 hover:text-gray-800 transition-colors duration-200`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={14} />
                </motion.button>
              </div>
            </div>
            <div className="space-y-2">
              <div className={`h-1 w-full bg-gray-200 overflow-hidden`}>
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
                  className={`text-xs text-gray-500`}
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
                className={`mt-1 text-xs text-gray-500 leading-relaxed`}
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