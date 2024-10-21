  // EYE BLINKING ANIMATIONS
export const getBlinkAnimation = (isBlinking: boolean) => {
  return {
      scaleY: isBlinking ? 0.1 : 1,
      transition: { duration: 0.1 }
  }
  }

  // NAVI PHASE COLORS
 export const getPhaseColor = (phase: string) => {
  switch (phase) {
    case "Initializing":
      return "#528A82"; // Lightest green (unchanged)
    case "Analyzing":
      return "#44756E"; // Slightly darker green
    case "Processing":
      return "#365E59"; // Darker green
    case "Finalizing":
      return "#26433F"; // Darkest green (as requested)
    default:
      return "#1D3330"; // Default color (middle shade)
  }
};
  
  // NAVI EYE ANIMATIONS (ACTUAL IMPLEMENTATION)
  export const getNaviEyeAnimation = (currentPhase: string, isBlinking: boolean) => {
    switch (currentPhase) {
      case 'Analyzing':
        return {
          x: isBlinking ? 0 : [0, 2, -2, 1, -1, 2, -2, 0],
          y: isBlinking ? 0 : [-1, 1, -1, 2, -2, 1, -1, 0],
          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
        }
      case 'Processing':
        return {
          x: isBlinking ? 0 : [-2, 2, -1, 1, 0, -2, 2, -1, 1, 0],
          y: isBlinking ? 0 : [1, -1, 2, -2, 0, -1, 1, -2, 2, 0],
          transition: { repeat: Infinity, duration: 1.5, ease: "linear" }
        }
      case 'Finalizing':
        return {
          x: isBlinking ? 0 : [0, 2, 0, -2, 1, -1, 2, -2, 1, -1, 0],
          y: isBlinking ? 0 : [0, -1, 2, -1, 1, -2, 1, 0, -1, 2, 0],
          transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        }
      case 'Initializing':
        return {
          x: isBlinking ? 0 : [0, 1, -1, 0],
          y: isBlinking ? 0 : [0, -1, 1, 0],
          transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        }
      default:
        return {}
    }
  }

// DEMO HOME NAVI ANIMATIONS
  export const getHomeEyeAnimation = (emote: string) => {
    switch (emote) {
      case "neutral":
        return {
          x: 0,
          y: 0,
          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
        };
      case "thinking":
        return {
          x: [0, 2, -2, 1, -1, 2, -2, 0],
          y: [-1, 1, -1, 2, -2, 1, -1, 0],
          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
        };
      case "working":
        return {
          x: [-2, 2, -1, 1, 0, -2, 2, -1, 1, 0],
          y: [1, -1, 2, -2, 0, -1, 1, -2, 2, 0],
          transition: { repeat: Infinity, duration: 1.5, ease: "linear" }
        };
      case "happy":
        return {
          x: [0, 2, 0, -2, 1, -1, 2, -2, 1, -1, 0],
          y: [0, -1, 2, -1, 1, -2, 1, 0, -1, 2, 0],
          transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
        };
      default:
        return {};
    }
  };
