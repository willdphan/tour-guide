export type ActionResponse =
  | {
      data: any;
      error: any;
    }
  | undefined;


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

export interface PopupProps {
  action?: {
    description: string;
    action?: string
    instruction?: string
    thought?: string
  }
}

// Define a new interface that extends PopupProps and includes isWaiting and onClose
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