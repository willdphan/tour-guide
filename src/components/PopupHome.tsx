// POPUP FOR THE HOMEPAGE DISPLAY, this is imported on the @page.tsx

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface PopupProps {
    action?: {
      action?: string
      instruction?: string
      thought?: string
    }
    onConfirm: (confirmed: boolean) => void
    isAgentRunning: boolean
    isWaiting: boolean
  }

const PopUpDefault: React.FC<PopupProps> = ({ 
    action = {}, 
    onConfirm, 
    isAgentRunning, 
    isWaiting 
  }) => {
    const [progress, setProgress] = useState(0)
    const [isVisible, setIsVisible] = useState(true)
    const [currentPhase, setCurrentPhase] = useState(0)
    const [isBlinking, setIsBlinking] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [notifications, setNotifications] = useState<string[]>([])
  
    const phases = [
      { name: 'Initializing', description: 'Okay, let us change your email in settings' },
      { name: 'Analyzing', description: 'Working on it! Just one second.' },
      { name: 'Processing', description: 'Alright, changing the email now.' },
      { name: 'Finalizing', description: 'Done! Email is now changed.' }
    ];
  
    useEffect(() => {
      let progressTimer: NodeJS.Timeout
      let phaseTimer: NodeJS.Timeout
      let resetTimer: NodeJS.Timeout
  
      const startAnimation = () => {
        setIsResetting(false)
        setProgress(0)
        setCurrentPhase(0)
        setNotifications([])
  
        progressTimer = setInterval(() => {
          setProgress((prevProgress) => {
            if (prevProgress >= 100) {
              clearInterval(progressTimer)
              return 100
            }
            return prevProgress + 1.25 // Increase by 1.25% every 25ms to reach 100% in 2 seconds
          })
        }, 25)
  
        phaseTimer = setInterval(() => {
          setCurrentPhase((prevPhase) => {
            const nextPhase = (prevPhase + 1) % phases.length
            setNotifications((prevNotifications) => {
              const newNotifications = [phases[nextPhase].name, ...prevNotifications]
              return newNotifications.slice(0, 4)
            })
            if (nextPhase === 0) {
              clearInterval(progressTimer)
              clearInterval(phaseTimer)
              setIsResetting(true)
            }
            return nextPhase
          })
        }, 2000) // Change phase every 2 seconds
      }
  
      startAnimation()
  
      resetTimer = setInterval(() => {
        if (isResetting) {
          startAnimation()
        }
      }, 3000) // Check every 3 seconds if we need to restart the animation
  
      const blinkInterval = setInterval(() => {
        setIsBlinking(true)
        setTimeout(() => setIsBlinking(false), 200)
      }, 3000)
  
      return () => {
        clearInterval(progressTimer)
        clearInterval(phaseTimer)
        clearInterval(resetTimer)
        clearInterval(blinkInterval)
      }
    }, [isResetting])
  
    const getPhaseColor = (phase: string) => {
      switch (phase) {
        case 'Initializing': return '#528A82' // Lightest green (unchanged)
        case 'Analyzing': return '#44756E'    // Slightly darker green
        case 'Processing': return '#365E59'   // Darker green
        case 'Finalizing': return '#26433F'   // Darkest green (as requested)
        default: return '#1D3330'             // Default color (middle shade)
      }
    }
  
    const getEyeAnimation = () => {
      switch (phases[currentPhase].name) {
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
  
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`z-50 w-64 shadow-md bg-white text-gray-800`}
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
                    style={{ backgroundColor: getPhaseColor(phases[currentPhase].name) }}
                  >
                    <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                      <motion.g animate={getEyeAnimation()}>
                        <motion.rect
                          x="11"
                          y="14"  // Changed from 10 to 14
                          width="3"
                          height="7"
                          rx="1.5"
                          fill="white"
                          animate={getBlinkAnimation()}
                        />
                        <motion.rect
                          x="18"
                          y="14"  // Changed from 10 to 14
                          width="3"
                          height="10"
                          rx="1.5"
                          fill="white"
                          animate={getBlinkAnimation()}
                        />
                      </motion.g>
                    </svg>
                  </div>
                  <p className="text-sm font-medium font-Marcellus">{phases[currentPhase].name}</p>
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
                <div className={`h-1 w-full bg-gray-200 overflow-hidden`}>
                  <motion.div 
                    className="h-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${progress}%`,
                      backgroundColor: getPhaseColor(phases[currentPhase].name)
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
                    {progress.toFixed(0)}%
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
              {phases[currentPhase].description}
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

  export default PopUpDefault;