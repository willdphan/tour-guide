// POPUP FOR THE HOMEPAGE DISPLAY
// this is imported on page.tsx in the landing page video box

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getHomeEyeAnimation, getBlinkAnimation } from "@/utils/animations";
import { stages } from "@/utils/stagesData";
import { getPhaseColor } from "@/utils/animations";
import { PopupProps } from "@/types/action-response";

const PopUpDefault: React.FC<PopupProps> = ({ action = {} }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  const phases = [
    {
      name: "Initializing",
      description: "Okay, let us change your email.",
    },
    { name: "Analyzing", description: "Working on it! Just one second..." },
    { name: "Processing", description: "Alright, changing the email now." },
    { name: "Finalizing", description: "Done! Email is now changed." },
  ];

  useEffect(() => {
    const PROGRESS_INTERVAL = 25;
    const PHASE_INTERVAL = 2000;
    const RESET_INTERVAL = 3000;

    const updateProgress = () => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 1.25));
    };

    const updatePhase = () => {
      setCurrentPhase((prev) => {
        const next = (prev + 1) % phases.length;
        setNotifications((prevNotifs) =>
          [phases[next].name, ...prevNotifs].slice(0, 4)
        );
        if (next === 0) setIsResetting(true);
        return next;
      });
    };

    const startAnimation = () => {
      setIsResetting(false);
      setProgress(0);
      setCurrentPhase(0);
      setNotifications([]);
    };

    const progressTimer = setInterval(updateProgress, PROGRESS_INTERVAL);
    const phaseTimer = setInterval(updatePhase, PHASE_INTERVAL);
    const resetTimer = setInterval(
      () => isResetting && startAnimation(),
      RESET_INTERVAL
    );

    // Add blinking effect
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 100);
    }, 3000);

    startAnimation();

    return () => {
      [progressTimer, phaseTimer, resetTimer, blinkInterval].forEach(
        clearInterval
      );
    };
  }, [isResetting]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="z-50 w-64 bg-black/80 text-white shadow-md"
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
                  style={{
                    backgroundColor: getPhaseColor(phases[currentPhase].name),
                  }}
                >
                  <svg
                    width="32"
                    height="38"
                    viewBox="0 0 32 38"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative z-10"
                  >
                    <motion.g
                      animate={getHomeEyeAnimation(stages[currentPhase].emote)}
                    >
                      <motion.rect
                        x="11"
                        y="14"
                        width="3"
                        height="7"
                        rx="1.5"
                        fill="white"
                        animate={getBlinkAnimation(isBlinking)}
                      />
                      <motion.rect
                        x="18"
                        y="14"
                        width="3"
                        height="10"
                        rx="1.5"
                        fill="white"
                        animate={getBlinkAnimation(isBlinking)}
                      />
                    </motion.g>
                  </svg>
                </div>
                <p className="font-Marcellus text-sm font-medium">
                  {phases[currentPhase].name}
                </p>
              </motion.div>
              <motion.button
                className="text-gray-400 transition-colors duration-200 hover:text-gray-200"
                aria-label="Close"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={14} />
              </motion.button>
            </div>
            <div className="space-y-2">
              <div className="h-1 w-full overflow-hidden bg-gray-700">
                <motion.div
                  className="h-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${progress}%`,
                    backgroundColor: getPhaseColor(phases[currentPhase].name),
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
                  className="text-xs font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {progress.toFixed(0)}%
                </motion.span>
                <motion.span
                  className="text-xs text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {progress < 100 ? "In progress" : "Complete"}
                </motion.span>
              </div>
            </div>
            <motion.p
              className="mt-2 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {phases[currentPhase].description}
            </motion.p>
            {action?.thought && (
              <motion.p
                className="mt-1 text-xs leading-relaxed text-gray-400"
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

export default PopUpDefault;
