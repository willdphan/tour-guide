import React from 'react';

interface AgentActionPromptProps {
  instruction: string;
  onProceed: () => void;
  onCancel: () => void;
}

const AgentActionPrompt: React.FC<AgentActionPromptProps> = ({ instruction, onProceed, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Agent Action</h2>
        <p className="mb-4">{instruction}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentActionPrompt;