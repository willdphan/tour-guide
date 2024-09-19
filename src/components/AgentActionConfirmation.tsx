import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sun, Moon } from 'lucide-react'

interface AgentActionConfirmationProps {
  action: {
    thought?: string;
    action: string;
    instruction: string;
  };
  onConfirm: (confirmed: boolean) => void;
  isAgentRunning: boolean;
  isWaiting: boolean;
  initialResponse: string;
}

const AgentActionConfirmationContent: React.FC<AgentActionConfirmationProps & { onClose: () => void }> = ({ 
  action, 
  onConfirm, 
  isAgentRunning, 
  isWaiting,
  onClose,
  initialResponse
}) => {
  const [progress, setProgress] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isBlinking, setIsBlinking] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('AgentActionConfirmation mounted')
    return () => console.log('AgentActionConfirmation unmounted')
  }, [])

  useEffect(() => {
    if (isWaiting) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 99) {
            return 99
          }
          return prevProgress + 1
        })
      }, 100)
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      setProgress(100)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isWaiting])

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 200)
    }, 3000)

    return () => clearInterval(blinkInterval)
  }, [])

  const getCurrentPhase = () => {
    if (isWaiting) return 'Analyzing'
    if (action.action === 'FINAL_ANSWER') return 'Finalizing'
    if (action.instruction && action.instruction.toLowerCase().includes('planning my next step')) {
      return 'Initializing'
    }
    if (action.action) return 'Processing'
    return 'Initializing'
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Initializing': return '#528A82' // Lightest green (unchanged)
      case 'Analyzing': return '#44756E'    // Slightly darker green
      case 'Processing': return '#365E59'   // Darker green
      case 'Finalizing': return '#26433F'   // Darkest green (as requested)
      default: return '#1D3330'             // Default color (middle shade)
    }
  }

  // blue
  // const getPhaseColor = (phase: string) => {
  //   switch (phase) {
  //     case 'Analyzing': return '#3B82F6'
  //     case 'Processing': return '#2563EB'
  //     case 'Finalizing': return '#1D4ED8'
  //     case 'Initializing': return '#60A5FA'
  //     default: return '#3B82F6'
  //   }
  // }

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
      case 'Initializing':
        return {
          x: isBlinking ? 0 : [0, 1, -1, 0],
          y: isBlinking ? 0 : [0, -1, 1, 0],
          transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
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

  const currentPhase = getCurrentPhase()

  // Reset progress when entering Initializing phase
  useEffect(() => {
    if (currentPhase === 'Initializing') {
      setProgress(0)
    }
  }, [currentPhase])

  const formatPercentage = (text: string) => {
    return text.replace(/(\d+(\.\d+)?%)/g, (match) => `<span class="">${match}</span>`);
  };

  return (
    <motion.div
      className={`fixed right-4 bottom-4 z-50 w-64 shadow-md  ${
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
                    x="4" y="5" width="2" height="6" rx="1" fill="white"
                    animate={getBlinkAnimation()}
                  />
                  <motion.rect
                    x="10" y="5" width="2" height="6" rx="1" fill="white"
                    animate={getBlinkAnimation()}
                  />
                </motion.g>
              </svg>
            </div>
            <p className="text-sm font-medium font-Marcellus">{currentPhase}</p>
          </motion.div>
          <div className="flex items-center space-x-2">
            <motion.button
              className={`text-${isDarkMode ? 'gray-400 hover:text-gray-200' : 'gray-600 hover:text-gray-800'} transition-colors duration-200`}
              onClick={() => setIsDarkMode(!isDarkMode)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </motion.button>
            <motion.button 
              className={`text-${isDarkMode ? 'gray-400 hover:text-gray-200' : 'gray-600 hover:text-gray-800'} transition-colors duration-200`}
              aria-label="Close"
              onClick={onClose}
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
                width: `${progress}%`,
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
              className="text-xs font-medium "
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {progress}%
            </motion.span>
            <motion.span 
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {currentPhase === 'Initializing' ? "Planning next step" : (isWaiting ? "In progress" : "Complete")}
            </motion.span>
          </div>
        </div>
        <motion.p 
          className="mt-2 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          dangerouslySetInnerHTML={{ __html: formatPercentage(action.instruction || "Processing...") }}
        />
        {action.thought && (
          <motion.p 
            className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            dangerouslySetInnerHTML={{ __html: formatPercentage(action.thought) }}
          />
        )}
      </div>
    </motion.div>
  )
}

const AgentActionConfirmation: React.FC<AgentActionConfirmationProps> = (props) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    console.log('Close button clicked')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && <AgentActionConfirmationContent {...props} onClose={handleClose} />}
    </AnimatePresence>
  )
}

export default AgentActionConfirmation