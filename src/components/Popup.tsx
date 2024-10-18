// POPUP WRAPPER
// we wrap PopupApple.tsx or PopupNavi.tsx depending
// on what styling we want to use.

import { ExtendedPopupProps } from "@/types/action-response";
import { AnimatePresence } from "framer-motion";
import { PopupContent } from "./PopupNavi";
import { useState } from "react";

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
