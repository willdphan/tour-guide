import React from 'react';
import { useCallback } from 'react';

interface simulateAgentProps {
    setCurrentAction: React.Dispatch<React.SetStateAction<any>>,
    setIsAgentActive: React.Dispatch<React.SetStateAction<boolean>>,
    setAgentCursor: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
}

export function simulateAgent({
  setCurrentAction,
  setIsAgentActive,
  setAgentCursor
}: simulateAgentProps) {
  return async (action: any) => {
    console.log('Simulating action:', action);
    setCurrentAction(action);
    setIsAgentActive(true);

    const moveMouseTo = (x: number, y: number) => {
      if (x !== undefined && y !== undefined) {
        setAgentCursor({ x, y });
        console.log(`Moved cursor to (${x}, ${y})`);
      }
    };

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const scrollToElement = (element: Element) => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      console.log('Scrolled to element:', element);
    };

    const getElementFromPoint = (x: number, y: number) => {
      return document.elementFromPoint(x, y);
    };

    const findElementByText = (text: string) => {
      return Array.from(document.querySelectorAll('*'))
        .find(el => el.textContent?.trim() === text);
    };

    async function performAction() {
      switch (action.action) {
        case 'Click':
          if (action.element_description) {
            const element = findElementByText(action.element_description);
            if (element instanceof HTMLElement) {
              const rect = element.getBoundingClientRect();
              moveMouseTo(rect.left + rect.width / 2, rect.top + rect.height / 2);
              await wait(1000);
              scrollToElement(element);
              await wait(1000);
              element.click();
              console.log('Clicked element:', element);
              // Visual feedback
              element.style.border = '2px solid #365E59';
              setTimeout(() => element.style.border = '', 2000);
            }
          } else if (action.screen_location) {
            moveMouseTo(action.screen_location.x, action.screen_location.y);
            await wait(1000);
            const elementAtPoint = getElementFromPoint(action.screen_location.x, action.screen_location.y);
            if (elementAtPoint instanceof HTMLElement) {
              scrollToElement(elementAtPoint);
              await wait(1000);
              elementAtPoint.click();
              console.log('Clicked element at point:', elementAtPoint);
              // Visual feedback
              elementAtPoint.style.border = '2px solid red';
              setTimeout(() => elementAtPoint.style.border = '', 1000);
            } else {
              console.log('No clickable element found at the specified location or with the given description');
            }
          }
          break;

        case 'Type':
          if (action.screen_location && action.text_input) {
            moveMouseTo(action.screen_location.x, action.screen_location.y);
            await wait(1000);
            const element = getElementFromPoint(action.screen_location.x, action.screen_location.y);
            if (element instanceof HTMLInputElement) {
              scrollToElement(element);
              await wait(1000);
              element.value = action.text_input;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              console.log('Typed into input:', action.text_input);
              // Visual feedback
              element.style.backgroundColor = 'yellow';
              setTimeout(() => element.style.backgroundColor = '', 1000);
            } else {
              console.log('No input element found at the specified location');
            }
          }
          break;

        case 'Scroll':
          if (action.screen_location) {
            moveMouseTo(action.screen_location.x, action.screen_location.y);
            await wait(1000);
            const element = getElementFromPoint(action.screen_location.x, action.screen_location.y);
            if (element) {
              scrollToElement(element);
            } else {
              console.log('No element found at the specified location for scrolling');
            }
          }
          break;

        case 'Wait':
          console.log('Waiting for 0 seconds');
          await wait(0);
          break;

        case 'GoBack':
          console.log('Navigating back');
          window.history.back();
          break;

        case 'Home':
          console.log('Navigating to home page');
          window.location.href = '/';
          break;

        case 'FINAL_ANSWER':
          console.log('Task completed. Answer:', action.instruction);
          break;

        default:
          console.log('Unknown action:', action.action, action.instruction);
      }
    }

    await performAction();
    await wait(1000);
    setIsAgentActive(false);
  };
};
