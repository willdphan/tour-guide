'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import AgentActionConfirmation from './AgentActionConfirmation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import PopUpApple from './popup-apple'
import PopUpDefault from './popup-minimal'
import { IBM_Plex_Sans } from 'next/font/google'
import { debounce } from 'lodash';

// ... existing utility functions ...

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  const [currentAction, setCurrentAction] = useState<any>(null);
  const [isWaiting, setIsWaiting] = useState(false)
  const [isAgentProcessing, setIsAgentProcessing] = useState(false)
  const [finalAction, setFinalAction] = useState<any>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const lastActionRef = useRef<string | null>(null);

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

  const handleNewAction = useCallback(
    debounce(async (action: any) => {
      if (isProcessingAction) return;
      
      // Create a unique key for the action
      const actionKey = `${action.action}-${action.element_description || ''}-${Date.now()}`;
      
      if (actionKey === lastActionRef.current) {
        console.log('Duplicate action detected, skipping:', action);
        return;
      }
      
      setIsProcessingAction(true);
      lastActionRef.current = actionKey;
      
      try {
        console.log('Processing action:', action);
        
        if (action.action === 'Wait') {
          setIsWaiting(true);
        } else {
          setIsWaiting(false);
          setCurrentAction(action);
          
          // Simulate the action
          await simulateAgentAction(action);
          
          if (action.action === 'FINAL_ANSWER') {
            setFinalAction(action);
            // Keep the final action visible for 10 seconds (adjust as needed)
            // await sleep(10000);
            setFinalAction(null);
          } else {
            // Display the action for 3 seconds
            await sleep(3000);
            
            setCurrentAction(null);
            
            // Add a 1-second pause between actions
            // await sleep(1000);
          }
        }
      } finally {
        setIsProcessingAction(false);
      }
    }, 0),
    [simulateAgentAction]
  );

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
                
                await handleNewAction(parsedData)

                if (parsedData.action === 'FINAL_ANSWER') {
                  setIsWaiting(false)
                  setIsAgentProcessing(false)
                } else {
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
      <DialogContent className="p-0 overflow-hidden font-Chakra bg-white backdrop-blur-xs">
        <Command className="border-none">
          <div className="flex items-center !rounded-t-xl w-full relative text-gray-500">
            <CommandInput
              placeholder="Search or type a command"
              value={search}
              onValueChange={setSearch}
              onKeyDown={handleKeyDown}
              disabled={agentRunning}
              className="w-full h-12 s outline-none focus:ring-0 text-sm placeholder:text-gray-400 px-0 bg-transparent"
            />
            <div className="absolute right-3 flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-200 inline-flex items-center justify-center w-6 h-6">
                <span className="text-base font-semibold">⌘</span>
              </kbd>
              <kbd className="px-1.5 py-0.5 text-xs text-gray-500 bg-gray-200 inline-flex items-center justify-center w-6 h-6 font-Chakra">
                <span className="text-sm">K</span>
              </kbd>
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

    {/* <PopUpApple/> */}
    {/* <PopUpDefault onConfirm={function (confirmed: boolean): void {
        throw new Error('Function not implemented.')
      } } isAgentRunning={false} isWaiting={false}/> */}


      {isWaiting && (
        <AgentActionConfirmation
          action={{ action: 'Wait', instruction: '' }}
          onConfirm={() => {}}
          isWaiting={true}
        />
      )}
      {currentAction && !finalAction && (
        <AgentActionConfirmation
          action={currentAction}
          onConfirm={() => {}}
          isWaiting={false}
        />
      )}
      {finalAction && (
        <AgentActionConfirmation
          action={finalAction}
          onConfirm={() => {}}
          isWaiting={false}
        />
      )}
      {isAgentProcessing && !currentAction && !isWaiting && !finalAction && (
        <AgentActionConfirmation
          action={{ action: 'One sec, planning my next step...', instruction: 'One sec, planning my next step...' }}
          onConfirm={() => {}}
          isWaiting={false}
        />
      )}
    </>
  )
}

export default SpotLightSearch