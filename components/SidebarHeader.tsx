import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "framer-motion";

interface SidebarHeaderProps {
  onBack: () => void;
  title?: string;
  icon?: string;
}

export default function SidebarHeader({
  onBack,
  title = "Categoria",
  icon = "/icons/tv.png",
}: SidebarHeaderProps) {
  const { ref, focused } = useFocusable({
    focusKey: "sidebar-header",
    onEnterPress: onBack,
  });

  return (
    <motion.div
      ref={ref}
      onClick={onBack}
      className={`
        relative w-full h-[6vw] flex items-center gap-[1vw] px-[1vw] rounded-[1vw] cursor-pointer transition-all duration-200
        ${focused
          ? "scale-[1.04] z-10 shadow-[0_20px_40px_rgba(0,0,0,0.9)] bg-white"
          : "scale-[1.04] z-10 shadow-[0_20px_40px_rgba(0,0,0,0.9)] bg-white"}
      `}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/*
      <div className="flex items-center justify-center w-[4vw] h-[4vw] min-w-[4vw] p-[1vw] rounded-full overflow-hidden bg-neutral-900/10">
        <img
          src="/icons/back.png"
          className="w-full h-full object-contain"
          alt="Voltar"  
        />
      </div> */}

      {/* Texto */}
      <div
        className='flex-1 text-black text-[1.6vw] font-semibold whitespace-nowrap truncate px-[1vw]'
      >
        {title || ""}
      </div>
    </motion.div>
  );
}
