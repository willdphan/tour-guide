import { ReactNode } from "react";

import NaviInterface from "./NaviAssistant";

export default function NaviWrapper({ children }: { children: ReactNode }) {
  return <NaviInterface>{children}</NaviInterface>;
}
