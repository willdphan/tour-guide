"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/utils/cn"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { useState } from "react"
import Counter from "./Counter"
import Profile from "./profile"

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
]

export function NavigationMenuDemo() {
    const [activeComponent, setActiveComponent] = useState<'counter' | 'profile'>('counter')

    const renderActiveComponent = () => {
      switch (activeComponent) {
        case 'counter':
          return <Counter value={0} />;
        case 'profile':
          return (
            <Profile 
              chartFullyRendered={true} 
              user={{
                name: "John Doe",
                email: "john@example.com",
                avatar: "https://example.com/avatar.jpg"
              }} 
            />
          );
        default:
          return null;
      }
    }

    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-grow">
          {renderActiveComponent()}
        </div>
        <NavigationMenu className="w-full">
          <NavigationMenuList className="w-full flex justify-center">
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                onClick={() => setActiveComponent('counter')}
              >
                Counter
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                onClick={() => setActiveComponent('profile')}
              >
                Profile Settings
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    )
  }