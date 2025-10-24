import { Search, Mail } from "lucide-react";
import { useState } from "react";

import { SearchPanel } from "./SearchPanel";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function TopHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="flex lg:grid lg:grid-cols-[240px_1fr_380px] gap-2 sm:gap-4 lg:gap-8 h-14 items-center">
          {/* Logo - aligned with left sidebar */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[rgb(21,93,252)] rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">YW</span>
              </div>
              <span className="text-lg hidden sm:inline">YoungWings</span>
            </a>
          </div>

          {/* Empty center space for alignment */}
          <div className="flex-1"></div>

          {/* Action buttons - aligned with right sidebar */}
          <div className="flex justify-end gap-2 flex-shrink-0">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-gray-200"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Поиск</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(90vw,560px)] sm:w-[520px] p-0"
                align="end"
                sideOffset={8}
              >
                <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" className="gap-2 border-gray-200">
              <Mail className="w-4 h-4" />
              <span className="hidden lg:inline">Написать автору</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
