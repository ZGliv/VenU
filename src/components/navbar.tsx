import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#121212]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[95%] mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
        <div className="mr-4 flex items-center gap-8">
          <Link className="mr-2 flex items-center space-x-2" href="/">
            <span className="font-bold text-2xl tracking-tight text-white">VenU</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium">
            <Link href="/business" className="text-white/70 hover:text-white transition-colors">
                For business
            </Link>
            <div className="h-4 w-[1px] bg-white/20 mx-2" />
           <Link href="/login" className="text-white hover:text-white/80 transition-colors">
              Log in
           </Link>
        </div>
      </div>
    </header>
  );
}
