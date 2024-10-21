// DATA STRUCTURE REPRESENTING DIFFERENT STAGES OF USER JOURNEY

import { Stage } from "@/types/action-response";
  
 export const stages: Stage[] = [
    {
      id: 1,
      name: "Initialize",
      description: "Getting ready to start your journey",
      emote: "neutral",
      color: "#27433F",
      textColor: "white",
      borderColor: "#FDF9ED",
      link: "/initialize"  
    },
    {
      id: 2,
      name: "Analyze",
      description: "Examining the path ahead",
      emote: "thinking",
      color: "#FDF9ED",
      textColor: "#27433F",
      borderColor: "#27433F",
      link: "/analyze"
    },
    {
      id: 3,
      name: "Process",
      description: "Calculating the best route for you",
      emote: "working",
      color: "#27433F",
      textColor: "white",
      borderColor: "#FDF9ED",
      link: "/process"
    },
    {
      id: 4,
      name: "Finalize",
      description: "Preparing your personalized experience",
      emote: "happy",
      color: "#FDF9ED",
      textColor: "#27433F",
      borderColor: "#27433F",
      link: "/finalize"
    },
  ];