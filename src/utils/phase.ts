import { PopupProps } from '../types/action-response';

export const getCurrentPhase = ({ isWaiting, action }: { isWaiting: boolean; action?: PopupProps['action'] }) => {
  if (isWaiting) return "Analyzing";
  if (action?.action === "FINAL_ANSWER") return "Finalizing";
  if (
    action?.instruction &&
    action.instruction.toLowerCase().includes("planning my next step")
  ) {
    return "Initializing";
  }
  if (action?.action) return "Processing";
  return "Initializing";
};
