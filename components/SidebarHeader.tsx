import { ArrowLeft } from "lucide-react";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "framer-motion";

interface SidebarHeaderProps {
  onBack: () => void;
  title?: string;
  icon?: string;
}

export default function SidebarHeader({ onBack, title = "Categoria", icon = "/icons/tv.png" }: SidebarHeaderProps) {
  const { ref, focused } = useFocusable({
    focusKey: "sidebar-header",
    onEnterPress: onBack,
  });

  return (
    <div className="flex items-center gap-[0.2vw]">
      {/* Seta fora do pill */}
      <div className={focused ? 'scale-[1.2]' : '' }>
        <img
          src="/icons/back.png"
          className="w-auto h-[1.4vw]"
          alt="Voltar"
        />
      </div>

      {/* Botão pill */}
      <motion.div
        ref={ref}
        onClick={onBack}
        className={`flex items-center gap-[0.2vw] py-[0.4vw] px-[0.4vw] rounded-full bg-neutral-800/60 shadow-[0_20px_40px_rgba(0,0,0,0.9)]`}
      >
        {/* Círculo com ícone */}
        <div className="flex items-center justify-center w-[2.8vw] h-[2.8vw] rounded-full bg-neutral-700">
          <img
            src={icon}
            className="w-auto h-[1.4vw]"
            alt="Voltar"
          />
        </div>

        {/* Texto */}
        <span className="text-[1.4vw] font-bold text-white px-[1vw]">{title || ''}</span>
      </motion.div>
    </div>
  );
}
