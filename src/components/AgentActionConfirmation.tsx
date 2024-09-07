import React from 'react';
import { Button } from '@/components/ui/button';

interface AgentActionConfirmationProps {
  action: {
    thought?: string;
    action: string;
    instruction: string;
    element_description?: string | null;
    screen_location?: any;
    hover_before_action?: boolean;
    text_input?: string | null;
  };
  onConfirm: (confirmed: boolean) => void;
}

const AgentActionConfirmation: React.FC<AgentActionConfirmationProps> = ({ action, onConfirm }) => {
  console.log('Rendering AgentActionConfirmation', action);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Confirm Action</h2>
        <p className="mb-6 text-lg">{action.instruction}</p>
        {action.action !== 'FINAL_ANSWER' && (
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => onConfirm(false)} className="px-6 py-2">
              Cancel
            </Button>
            <Button onClick={() => onConfirm(true)} className="px-6 py-2 bg-red-600 hover:bg-red-700">
              Proceed
            </Button>
          </div>
        )}
        {action.action === 'FINAL_ANSWER' && (
          <Button onClick={() => onConfirm(true)} className="px-6 py-2 bg-green-600 hover:bg-green-700 w-full">
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
};

export default AgentActionConfirmation;