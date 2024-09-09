import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AgentActionConfirmationProps {
  action: {
    thought?: string;
    action: string;
    instruction: string;
    element_description?: string | null;
    screen_location?: { x: number; y: number };
    hover_before_action?: boolean;
    text_input?: string | null;
  };
  onConfirm: (confirmed: boolean) => void;
  isAgentRunning: boolean;
  isWaiting: boolean;
}

const AgentActionConfirmation: React.FC<AgentActionConfirmationProps> = ({ 
  action, 
  onConfirm, 
  isAgentRunning, 
  isWaiting 
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [currentPhase, setCurrentPhase] = useState('Initializing');

  useEffect(() => {
    if (isWaiting || action.action === 'Processing') {
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prevProgress + 1;
        });
      }, 100);

      return () => clearInterval(timer);
    } else {
      setProgress(100); // Set progress to 100% for action instructions
    }
  }, [isWaiting, action.action]);

  useEffect(() => {
    if (progress < 33) {
      setCurrentPhase('Analyzing');
    } else if (progress < 66) {
      setCurrentPhase('Processing');
    } else {
      setCurrentPhase('Finalizing');
    }
  }, [progress]);

  const boxStyle: React.CSSProperties = {
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    zIndex: 9999,
    maxWidth: '320px',
    width: '100%',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={boxStyle}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-gray-100 font-sans">
            <div className="flex justify-between items-center mb-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center space-x-2"
              >
                <motion.div 
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
                <p className="text-sm font-medium text-gray-900">One second, I'm thinking...</p>
              </motion.div>
              <motion.button 
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Close"
                onClick={() => onConfirm(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={16} />
              </motion.button>
            </div>
            <div className="space-y-3">
              <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
              <div className="flex justify-between items-center">
                <motion.span 
                  className="text-xs font-medium text-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {progress}% • {currentPhase}
                </motion.span>
                <motion.span 
                  className="text-xs text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {progress < 100 ? "Couple secs" : "Complete"}
                </motion.span>
              </div>
            </div>
            <motion.p 
              className="mt-3 text-xs text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {action.instruction || "Processing..."}
            </motion.p>
            {action.thought && (
              <motion.p 
                className="mt-3 text-xs text-gray-600 leading-relaxed"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {action.thought}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgentActionConfirmation;