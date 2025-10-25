"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface MobileHamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileHamburgerMenu({ isOpen, onToggle }: MobileHamburgerMenuProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="md:hidden text-white hover:bg-white/10 cursor-pointer"
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <Menu className="w-6 h-6" />
      )}
    </Button>
  );
}
