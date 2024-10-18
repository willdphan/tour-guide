// NAVIGATION/HEADER COMPONENT WITH RADIX-UI

import Link from "next/link";
import { IoMenu } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navigation() {
  return (
    <div className="relative flex items-center gap-6">
      <>
        {/* used for slide-out menu. */}
        <Sheet>
          <SheetTrigger className="block lg:hidden">
            <IoMenu size={28} />
          </SheetTrigger>
          <SheetContent className="w-full bg-black">
            <SheetHeader>
              <SheetDescription className="py-8">
                <Button className="flex-shrink-0" asChild>
                  <Link href="/signup">Get started for free</Link>
                </Button>
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </>
    </div>
  );
}
