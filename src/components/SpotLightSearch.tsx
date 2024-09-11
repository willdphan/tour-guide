'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import AgentActionConfirmation from './AgentActionConfirmation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import PopUpApple from './popup-apple'
import PopUpDefault from './popup-default'

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
          action={{ action: 'One sec, planning my next step...', instruction: 'One sec, planning my next step...' }}
          onConfirm={() => {}}
          isWaiting={false}
        />
      )}
    </>
  )
}

export default SpotLightSearch