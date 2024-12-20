"use client";

// CMD + K SEARCH

import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SpotLightSearchProps } from "@/types/search";
import { getPhaseColor } from "@/utils/animations";

import Popup from "./PopUpWrapper";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const SpotLightSearch: React.FC<SpotLightSearchProps> = ({
  simulateAgentAction,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [agentRunning, setAgentRunning] = useState(false);
  const [currentAction, setCurrentAction] = useState<any>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const [finalAction, setFinalAction] = useState<any>(null);
  const [phase, setPhase] = useState<
    "Initializing" | "Analyzing" | "Processing" | "Finalizing"
  >("Initializing");
  const [initialResponse, setInitialResponse] = useState("");
  const [shouldAbort, setShouldAbort] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [actionQueue, setActionQueue] = useState<any[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNewAction = useCallback((action: any) => {
    setActionQueue((prevQueue) => [...prevQueue, action]);
  }, []);

  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingQueue || actionQueue.length === 0) return;

      setIsProcessingQueue(true);
      const action = actionQueue[0];

      try {
        console.log("Processing action:", action);

        if (action.action === "Wait") {
          setIsWaiting(true);
          setPhase("Initializing");
        } else {
          setIsWaiting(false);
          setCurrentAction(action);

          // Set phase based on action
          if (action.action === "FINAL_ANSWER") {
            setPhase("Finalizing");
          } else if (
            action.action &&
            typeof action.action === "string" &&
            action.action.startsWith("HUMAN_ACTION")
          ) {
            setPhase("Processing");
          } else {
            setPhase("Analyzing");
          }

          // Simulate the action
          await simulateAgentAction(action);

          if (action.action === "FINAL_ANSWER") {
            setFinalAction(action);
            await sleep(5000); // Display final action for 5 seconds
            setFinalAction(null);
          } else {
            await sleep(3000); // Display action for 3 seconds
          }

          setCurrentAction(null);
        }
      } finally {
        setActionQueue((prevQueue) => prevQueue.slice(1));
        setIsProcessingQueue(false);
      }
    };

    processQueue();
  }, [actionQueue, isProcessingQueue, simulateAgentAction]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        console.log("Enter key pressed, search query:", search);
        setIsWaiting(true);
        setIsAgentProcessing(true);
        setOpen(false);
        setShouldAbort(false);

        const controller = new AbortController();
        setAbortController(controller);

        try {
          const currentUrl = window.location.href;
          console.log(`Current URL: ${currentUrl}`);

          const response = await fetch(`http://127.0.0.1:8000/api/run-agent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify({
              question: search,
              currentUrl: currentUrl,
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let isFirstResponse = true;
          while (true) {
            if (shouldAbort) {
              console.log("Aborting process");
              reader?.cancel();
              break;
            }
            const { value, done } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonData = line.slice(6);
                if (jsonData === "[DONE]") {
                  console.log("Stream completed");
                  setIsWaiting(false);
                  setIsAgentProcessing(false);
                  break;
                }
                try {
                  const parsedData = JSON.parse(jsonData);
                  console.log("Received data:", parsedData);

                  if (shouldAbort) {
                    console.log("Aborting process");
                    break;
                  }

                  handleNewAction(parsedData);

                  if (isFirstResponse) {
                    if (parsedData.action === "INITIAL_RESPONSE") {
                      setInitialResponse(parsedData.instruction);
                    } else {
                      setInitialResponse(
                        parsedData.thought || parsedData.instruction || ""
                      );
                    }
                    isFirstResponse = false;
                    continue;
                  }
                  if (parsedData.action === "FINAL_ANSWER") {
                    setIsWaiting(false);
                    setIsAgentProcessing(false);
                  } else {
                    setIsAgentProcessing(true);
                  }
                } catch (error) {
                  console.error("Error parsing JSON:", error);
                }
              }
            }
          }
        } catch (error) {
          if (error.name === "AbortError") {
            console.log("Fetch aborted");
          } else {
            console.error("Error fetching search results:", error);
          }
        } finally {
          setIsAgentProcessing(false);
          setIsWaiting(false);
          setAbortController(null);
        }
      }
    },
    [search, simulateAgentAction, handleNewAction, shouldAbort, abortController]
  );

  const handleAbort = useCallback(() => {
    setShouldAbort(true);
    if (abortController) {
      abortController.abort();
    }
    setIsWaiting(false);
    setIsAgentProcessing(false);
    setCurrentAction(null);
    setFinalAction(null);
    setSearch(""); // Clear the search input
    console.log("Agent process aborted");
  }, [abortController]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="backdrop-blur-xs overflow-hidden bg-white p-0">
          <Command className="border-none">
            <div className="relative flex w-full items-center !rounded-t-xl text-gray-500">
              <CommandInput
                placeholder="Search or type a command"
                value={search}
                onValueChange={setSearch}
                onKeyDown={handleKeyDown}
                disabled={agentRunning}
                className="s h-12 w-full bg-transparent px-0 text-sm outline-none placeholder:text-gray-400 focus:ring-0"
              />
              <div className="absolute right-3 flex items-center space-x-1">
                <kbd className="inline-flex h-6 w-6 items-center justify-center bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500">
                  <span className="text-base font-semibold">⌘</span>
                </kbd>
                <kbd className="inline-flex h-6 w-6 items-center justify-center bg-gray-200 px-1.5 py-0.5 font-Marcellus text-xs text-gray-500">
                  <span className="text-sm">K</span>
                </kbd>
              </div>
            </div>
            <CommandList className="hidden">
              <CommandGroup>
                <CommandItem value="placeholder"></CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
      {(isWaiting ||
        currentAction ||
        finalAction ||
        (isAgentProcessing &&
          !currentAction &&
          !isWaiting &&
          !finalAction)) && (
        <Popup
          action={
            isWaiting
              ? { action: "Wait", instruction: "" }
              : currentAction
              ? currentAction
              : finalAction
              ? finalAction
              : {
                  action: "One sec, planning my next step...",
                  instruction: "One sec, planning my next step...",
                }
          }
          isWaiting={isWaiting}
          backgroundColor={getPhaseColor(phase)}
          onClose={handleAbort}
        />
      )}
    </>
  );
};
export default SpotLightSearch;
