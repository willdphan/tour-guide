"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Link, 
  List, 
  ListOrdered, 
  Plus, 
  Maximize,
  Sun,
  Moon,
  X
} from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'

interface CursorProps {
  x: number;
  y: number;
  color: string;
  label: string;
}

function Cursor({ x, y, color, label }: CursorProps) {
  return (
    <div style={{
      position: "fixed",
      left: x,
      top: y,
      transform: 'translate(-50%, -50%)',
      transition: 'left 0.5s ease-out, top 0.5s ease-out',
      zIndex: 9999,
    }}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="m13.67 6.03-11-4a.5.5 0 0 0-.64.64l4 11a.5.5 0 0 0 .935.015l1.92-4.8 4.8-1.92a.5.5 0 0 0 0-.935h-.015Z"
          fill={color}
        />
      </svg>
      <span className="ml-2 px-2 py-1 text-xs text-white shadow-md font-montserrat" style={{ backgroundColor: color }}>
        {label}
      </span>
    </div>
  );
}

interface AgentActionConfirmationProps {
  action: {
    thought?: string;
    action: string;
    instruction: string;
  };
  onConfirm: (confirmed: boolean) => void;
  isAgentRunning: boolean;
  isWaiting: boolean;
}

const PopUpDefault: React.FC<AgentActionConfirmationProps> = ({ 
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
  const [isDarkMode, setIsDarkMode] = useState(true)

  const phases = [
    { name: 'Initializing', description: 'Okay, let us find the font and new doc buttons.' },
    { name: 'Analyzing', description: 'Working on it! Just one second.' },
    { name: 'Processing', description: 'Alright, showing you now!' },
    { name: 'Finalizing', description: 'Hope you found what you are looking for' },
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`absolute bottom-4 right-4 z-50 w-64 shadow-md ${
            isDarkMode ? 'text-white bg-black bg-opacity-60 backdrop-blur-md ' : 'bg-white text-gray-800'
          }`}
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
                        y="14"
                        width="3"
                        height="7"
                        rx="1.5"
                        fill="white"
                        animate={getBlinkAnimation()}
                      />
                      <motion.rect
                        x="18"
                        y="14"
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
            {phases[currentPhase].description}
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

export default function Component() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const normalButtonRef = useRef<HTMLSelectElement>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCursorPosition = (x: number, y: number) => {
      setCursorPosition({ x, y });
    };

    const moveCursor = () => {
      // Start from bottom right of the screen
      updateCursorPosition(window.innerWidth - 20, window.innerHeight - 20);

      // Move to normal button after 2 seconds
      setTimeout(() => {
        if (normalButtonRef.current) {
          const rect = normalButtonRef.current.getBoundingClientRect();
          updateCursorPosition(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }, 2000);

      // Move to plus button after 4 seconds
      setTimeout(() => {
        if (plusButtonRef.current) {
          const rect = plusButtonRef.current.getBoundingClientRect();
          updateCursorPosition(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }, 4000);
    };

    moveCursor();
    const interval = setInterval(moveCursor, 6000);

    return () => clearInterval(interval);
  }, []);

  const [agentAction, setAgentAction] = useState({
    action: 'INITIAL_ACTION',
    instruction: 'Starting the collaborative editing process...',
  });

  useEffect(() => {
    // Simulating agent actions
    const actions = [
      { action: 'ANALYZE', instruction: 'Analyzing the current document structure...' },
      { action: 'PROCESS', instruction: 'Processing user input and suggestions...' },
      { action: 'FINAL_ANSWER', instruction: 'Finalizing the document with collaborative edits...' },
    ];

    let index = 0;
    const interval = setInterval(() => {
      setAgentAction(actions[index]);
      index = (index + 1) % actions.length;
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white/80 p-4">
      <div ref={containerRef} className="relative w-full max-w-3xl font-montserrat">
        <Card className="relative z-1 p-6 shadow-lg bg-[#FDF9ED] border-[#2F4F4F] border rounded-none">
          <div className="flex items-center space-x-2 mb-4">
            <select ref={normalButtonRef} className="border px-2 py-1 text-sm bg-[#FDF9ED] text-[#2F4F4F] border-[#2F4F4F]">
              <option>Normal</option>
            </select>
            <Button variant="ghost" size="icon" className="text-[#2F4F4F] hover:bg-[#E2DFD5] rounded-none">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#2F4F4F] hover:bg-[#E2DFD5] rounded-none">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#2F4F4F] hover:bg-[#E2DFD5] rounded-none">
              <Underline className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#2F4F4F] hover:bg-[#E2DFD5] rounded-none">
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#2F4F4F] hover:bg-[#E2DFD5] rounded-none">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#2F4F4F] hover:bg-[#E2DFD5] rounded-none">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#2F4F4F] hover:bg-[#E2DFD5] rounded-none">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <div className="flex-grow" />
            <Button ref={plusButtonRef} variant="ghost" size="icon" className="text-[#2F4F4F] hover:bg-[#E2DFD5] rounded-none">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#2F4F4F] hover:bg-[#E2DFD5] rounded-none">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-[#2F4F4F]" style={{ fontFamily: 'Marcellus, serif' }}>Meet Navi, your AI Tour Guide</h1>
<p className="mb-4 text-[#2F4F4F]">
  Welcome to ze wonderful world of AI-powered tourismus! Navi is your digital tour guide, a clever guide with vast knowledge of website details. With the state-of-the-art NLP model, Navi understands your questions and preferences, tailoring each journey to your unique interests.
</p>
<p className="mb-4 text-[#2F4F4F]">
  For a personalized experience, Navi uses parses HTML and uses vision.
</p>
<p className="text-[#2F4F4F]">
 With Command+K, ask Navi anything. Navi will guide you through your task - or even do it for you!
</p>
        </Card>
        <Cursor x={cursorPosition.x} y={cursorPosition.y} color="#2F4F4F" label="Navi" />
        <div className="absolute -bottom-16 -right-16 z-10">
          <PopUpDefault
            action={agentAction}
            onConfirm={() => {}}
            isAgentRunning={true}
            isWaiting={agentAction.action !== 'FINAL_ANSWER'}
          />
        </div>
      </div>
    </div>
  )
}