'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import AgentActionConfirmation from './AgentActionConfirmation'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

function SampleBox() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [currentPhase, setCurrentPhase] = useState('Downloading')

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer)
          return 100
        }
        return prevProgress + 1
      })
    }, 100)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (progress < 33) {
      setCurrentPhase('Downloading')
    } else if (progress < 66) {
      setCurrentPhase('Verifying')
    } else {
      setCurrentPhase('Installing')
    }
  }, [progress])

  const boxStyle: React.CSSProperties = {
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    zIndex: 9999,
    maxWidth: '320px',
    width: '100%',
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={boxStyle}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-gray-100 font-sans">
            <div className="flex justify-between items-center mb-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center space-x-2"
              >
                <motion.div 
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
                <p className="text-sm font-medium text-gray-900">System Update</p>
              </motion.div>
              <motion.button 
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Close"
                onClick={() => setIsVisible(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={16} />
              </motion.button>
            </div>
            <div className="space-y-3">
              <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
              <div className="flex justify-between items-center">
                <motion.span 
                  className="text-xs font-medium text-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {progress}% • {currentPhase}
                </motion.span>
                <motion.span 
                  className="text-xs text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {Math.max(1, Math.round((100 - progress) / 20))} min left
                </motion.span>
              </div>
            </div>
            <motion.p 
              className="mt-3 text-xs text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              We're enhancing your system. Your device will restart automatically once complete.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface SpotLightSearchProps {
  onSelect: (selectedItem: { title: string; description: string }) => void;
  updateMyPresenceFn: (presence: { cursor: { x: number; y: number }, isAgent: boolean }) => void;
  simulateAgentAction: (action: any) => void;
}

const SpotLightSearch: React.FC<SpotLightSearchProps> = ({ onSelect, updateMyPresenceFn, simulateAgentAction }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [actions, setActions] = useState<any[]>([])
  const [isWaiting, setIsWaiting] = useState(false)
  const [isAgentProcessing, setIsAgentProcessing] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleNewAction = useCallback((action: any) => {
    if (action.action === 'Wait') {
      setIsWaiting(true)
    } else {
      setIsWaiting(false)
      const actionWithId = { ...action, id: Date.now() }
      setActions(prevActions => [...prevActions, actionWithId])
      
      setTimeout(() => {
        setActions(prevActions => prevActions.filter(a => a.id !== actionWithId.id))
      }, 2000)
    }
  }, [])

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      console.log('Enter key pressed, search query:', search)
      setIsWaiting(true)
      setIsAgentProcessing(true)
      setOpen(false)

      try {
        const currentUrl = window.location.href
        console.log(`Current URL: ${currentUrl}`)

        const response = await fetch(`http://127.0.0.1:8000/api/run-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({
            question: search,
            currentUrl: currentUrl
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { value, done } = await reader!.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(6)
              if (jsonData === '[DONE]') {
                console.log('Stream completed')
                setIsWaiting(false)
                setIsAgentProcessing(false)
                break
              }
              try {
                const parsedData = JSON.parse(jsonData)
                console.log('Received data:', parsedData)
                
                handleNewAction(parsedData)

                if (parsedData.action === 'FINAL_ANSWER') {
                  setIsWaiting(false)
                  setIsAgentProcessing(false)
                } else {
                  await simulateAgentAction(parsedData)
                  setIsAgentProcessing(true)
                }
              } catch (error) {
                console.error('Error parsing JSON:', error)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching search results:', error)
        setIsAgentProcessing(false)
        setIsWaiting(false)
      }
    }
  }, [search, simulateAgentAction, handleNewAction])

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden font-Sans !rounded-xl bg-white backdrop-blur-xs border border-gray-200">
          <Command className="border-none">
            <div className="flex items-center !rounded-t-xl w-full relative text-gray-500 ">
              <CommandInput
                placeholder="Search or type a command"
                value={search}
                onValueChange={setSearch}
                onKeyDown={handleKeyDown}
                disabled={agentRunning}
                className="w-full h-12 border-0 outline-none focus:ring-0 text-sm placeholder:text-gray-400 px-0 bg-transparent"
              />
              <div className="absolute right-3 flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-200 rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-200 rounded">K</kbd>
              </div>
            </div>
            <CommandList className='hidden'>
              <CommandGroup>
                <CommandItem value="placeholder">
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* <SampleBox/> */}


      {isWaiting && (
        <AgentActionConfirmation
          action={{ action: 'Wait', instruction: '' }}
          onConfirm={() => {}}
          isWaiting={true}
        />
      )}
      {actions.map((action) => (
        <AgentActionConfirmation
          key={action.id}
          action={action}
          onConfirm={() => {}}
          isWaiting={false}
        />
      ))}
      {isAgentProcessing && actions.length === 0 && !isWaiting && (
        <AgentActionConfirmation
          action={{ action: 'Processing', instruction: 'Agent is thinking...' }}
          onConfirm={() => {}}
          isWaiting={false}
        />
      )}
    </>
  )
}

export default SpotLightSearch