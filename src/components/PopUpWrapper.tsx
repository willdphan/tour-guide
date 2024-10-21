// POPUP WRAPPER
// we wrap PopupApple.tsx or PopupNavi.tsx depending
// on what styling we want to use.

import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { ExtendedPopupProps } from "@/types/action-response";

import { PopupContent } from "./PopupNavi";

const Popup: React.FC<ExtendedPopupProps> = (props) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    console.log("Close button clicked");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && <PopupContent {...props} onClose={handleClose} />}
    </AnimatePresence>
  );
};

export default Popup;
