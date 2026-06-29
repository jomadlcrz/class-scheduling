import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { CloseIcon } from "../components/ui/icons";
import { SidebarBrand, SidebarNav } from "./sidebar";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && <DrawerContent key="mobile-nav" onClose={onClose} />}
    </AnimatePresence>
  );
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  // Freeze body scroll while the drawer is open (same pattern as AskAiPanel).
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-navy-950/40 lg:hidden"
        aria-hidden="true"
      />

      {/* Drawer */}
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-linear-to-b from-[#0b3b9e] to-[#072b75] shadow-2xl lg:hidden"
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <SidebarBrand />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid size-9 cursor-pointer place-items-center rounded-full text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5 text-white">
          <SidebarNav onNavigate={onClose} />
        </div>
      </motion.aside>
    </>
  );
}
