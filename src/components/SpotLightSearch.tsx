import React, { useState, useCallback, useEffect } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Command } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import AgentActionPrompt from './AgentActionPrompt'
import AgentActionConfirmation from './AgentActionConfirmation';


interface SpotLightSearchProps {
  onSelect: (selectedItem: { title: string; description: string }) => void;
  updateMyPresenceFn: (presence: { cursor: { x: number; y: number }, isAgent: boolean }) => void;
  simulateAgentAction: (action: any) => void;
}

const mockSearchResults = [
  { id: 1, title: 'Arnold Circus Stool', description: 'Iconic stool design by Martino Gamper' },
  { id: 2, title: 'Arnoldino Stool', description: 'Compact version of the classic Arnold Circus' },
  { id: 3, title: 'Hookalotti', description: 'Versatile hook system for modern spaces' },
  { id: 4, title: 'Where to buy', description: 'Find authorized retailers in Australia & New Zealand' },
  { id: 5, title: 'Become a stockist', description: 'Partner with Stools & Co. for quality furniture' },
  { id: 6, title: 'Care Instructions', description: 'Maintain the beauty of your Stools & Co. products' },
  { id: 7, title: 'Custom Orders', description: 'Explore options for bespoke stool designs' },
  { id: 8, title: 'Our Story', description: 'Learn about the heritage of Stools & Co.' },
]

const SpotLightSearch: React.FC<SpotLightSearchProps> = ({ onSelect, updateMyPresenceFn, simulateAgentAction }) => {
  const [agentCursor, setAgentCursor] = useState({ x: 0, y: 0 });
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [currentInstruction, setCurrentInstruction] = useState('')
  const [actions, setActions] = useState<any[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);

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

  const filteredResults = mockSearchResults.filter(
    (result) =>
      result.title.toLowerCase().includes(search.toLowerCase()) ||
      result.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleNewAction = useCallback((action: any) => {
    if (action.action === 'Wait') {
      setIsWaiting(true);
    } else {
      setIsWaiting(false);
      const actionWithId = { ...action, id: Date.now() };
      setActions(prevActions => [...prevActions, actionWithId]);
      
      // Remove the action after 2 seconds
      setTimeout(() => {
        setActions(prevActions => prevActions.filter(a => a.id !== actionWithId.id));
      }, 2000);
    }
  }, []);

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('Enter key pressed, search query:', search);
      setIsWaiting(true);
      setIsAgentProcessing(true);
      setOpen(false);

      try {
        const currentUrl = window.location.href;
        console.log(`Current URL: ${currentUrl}`);

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
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader!.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(6);
              if (jsonData === '[DONE]') {
                console.log('Stream completed');
                setIsWaiting(false);
                setIsAgentProcessing(false);
                break;
              }
              try {
                const parsedData = JSON.parse(jsonData);
                console.log('Received data:', parsedData);
                
                handleNewAction(parsedData);

                if (parsedData.action === 'FINAL_ANSWER') {
                  setIsWaiting(false);
                  setIsAgentProcessing(false);
                } else {
                  await simulateAgentAction(parsedData);
                  // Keep isAgentProcessing true between steps
                  setIsAgentProcessing(true);
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        setIsAgentProcessing(false);
        setIsWaiting(false);
      }
    }
  }, [search, simulateAgentAction, handleNewAction]);

  return (
    <>
      <Button
        variant="ghost"
        className="hidden relative w-full justify-start text-base text-black sm:pr-12 md:w-64 lg:w-80 font-serif"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 shrink-0" />
        <span className="text-gray-500">Search stools, hooks, and more...</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 bg-[#f5f0e8] border border-[#e0d9c7] shadow-lg max-w-2xl">
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-600 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <div className="flex items-center border-b border-[#e0d9c7] px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 text-gray-600" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 font-serif"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search Stools & Co. products..."
                disabled={agentRunning}
              />
              {agentRunning && <span className="ml-2 text-sm text-gray-500">Agent running...</span>}
            </div>
            {agentResponse && (
              <div className="p-4 text-sm text-gray-700 font-serif">
                <h3 className="font-medium mb-2">Agent Response:</h3>
                <p className="whitespace-pre-line">{agentResponse}</p>
              </div>
            )}
            <ul className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              {filteredResults.map((result) => (
                <li
                  key={result.id}
                  className="cursor-pointer px-2 py-1.5 text-sm hover:bg-[#faf6f0] font-serif"
                  onClick={() => {
                    console.log(`Selected: ${result.title}`)
                    setOpen(false)
                    onSelect(result)
                  }}
                >
                  <div className="font-medium text-black">{result.title}</div>
                  <div className="text-xs text-gray-600">{result.description}</div>
                </li>
              ))}
            </ul>
            {filteredResults.length === 0 && !agentRunning && !agentResponse && (
              <div className="py-6 text-center text-sm text-gray-600 font-serif">
                No results found. Try searching for our product names or categories.
              </div>
            )}
          </Command>
        </DialogContent>
      </Dialog>
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