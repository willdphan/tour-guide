// ACTUAL POPUP IMPLEMENTATION WHEN PRESSING CMD +K

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  getNaviEyeAnimation,
  getPhaseColor,
  getBlinkAnimation,
} from "@/utils/animations";
import { ExtendedPopupProps } from "@/types/action-response";
import { getCurrentPhase } from "@/utils/phase";
import { formatPercentage } from "@/utils/percentage";

export const PopupContent: React.FC<
  ExtendedPopupProps & { onClose: () => void }
> = ({ action, isWaiting, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPhase = getCurrentPhase({ isWaiting, action });

  // is isWaiting is true, update progress every 100ms
  // progress increases by 1 each time, but it stops at 99% to give the impression
  // that it's almost complete but still waiting.
  useEffect(() => {
    const updateProgress = () => {
      setProgress((prev) => (prev >= 99 ? 99 : prev + 1));
    };

    let intervalId: NodeJS.Timeout | null = null;

    if (isWaiting) {
      intervalId = setInterval(updateProgress, 100);
    } else {
      setProgress(100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isWaiting]);

  // Reset progress when entering Initializing phase
  useEffect(() => {
    if (currentPhase === "Initializing") {
      setProgress(0);
    }
  }, [currentPhase]);

  // Add new useEffect for blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 100);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <motion.div
      className={`fixed bottom-4 right-4 z-50 w-64 bg-white  text-gray-800 shadow-md`}
      style={{ backgroundColor: "white" }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div
              className="relative flex h-6 w-6 items-center justify-center overflow-hidden"
              style={{ backgroundColor: getPhaseColor(currentPhase) }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10"
              >
                <motion.g
                  animate={getNaviEyeAnimation(currentPhase, isBlinking)}
                >
                  <motion.rect
                    x="4"
                    y="5"
                    width="2"
                    height="6"
                    rx="1"
                    fill="white"
                    animate={getBlinkAnimation(isBlinking)}
                  />
                  <motion.rect
                    x="10"
                    y="5"
                    width="2"
                    height="6"
                    rx="1"
                    fill="white"
                    animate={getBlinkAnimation(isBlinking)}
                  />
                </motion.g>
              </svg>
            </div>
            <p className="font-Marcellus text-sm font-medium">{currentPhase}</p>
          </motion.div>
          <div className="flex items-center space-x-2">
            <motion.button
              className={`text-gray-600 transition-colors duration-200 hover:text-gray-800`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            ></motion.button>
            <motion.button
              className={`text-gray-600 transition-colors duration-200 hover:text-gray-800`}
              aria-label="Close"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={14} />
            </motion.button>
          </div>
        </div>
        <div className="space-y-2">
          <div className={`h-1 w-full overflow-hidden bg-gray-200`}>
            <motion.div
              className="h-full"
              initial={{ width: 0 }}
              animate={{
                width: `${progress}%`,
                backgroundColor: getPhaseColor(currentPhase),
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
                backgroundColor: { duration: 1, ease: "easeInOut" },
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <motion.span
              className="text-xs font-medium "
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {progress}%
            </motion.span>
            <motion.span
              className={`text-xs text-gray-600`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {currentPhase === "Initializing"
                ? "Planning next step"
                : isWaiting
                ? "In progress"
                : "Complete"}
            </motion.span>
          </div>
        </div>
        <motion.p
          className="mt-2 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          dangerouslySetInnerHTML={{
            __html: formatPercentage(action?.instruction || "Processing..."),
          }}
        />
        {action?.thought && (
          <motion.p
            className={`mt-1 text-xs leading-relaxed text-gray-600`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            dangerouslySetInnerHTML={{
              __html: formatPercentage(action.thought),
            }}
          />
        )}
      </div>
    </motion.div>
  );
};
