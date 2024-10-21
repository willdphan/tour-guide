// Action-related types
export type ActionResponse =
  | {
      data: any;
      error: any;
    }
  | undefined;


// UI-related interfaces
export interface PopupProps {
  action?: {
    description: string;
    action?: string
    instruction?: string
    thought?: string
  }
}

export interface ExtendedPopupProps extends PopupProps {
  isWaiting: boolean;
  backgroundColor: string;
  onClose: () => void;
}

export interface CursorProps {
  x: number;
  y: number;
  isActive: boolean;
}

// Game-related interfaces
export interface Stage {
  id: number;
  name: string;
  description: string;
  emote: string;
  color: string;
  textColor: string;
  borderColor: string;
  link: string;  
}
