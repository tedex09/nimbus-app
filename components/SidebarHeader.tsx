import { ArrowLeft } from "lucide-react";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "framer-motion";

interface SidebarHeaderProps {
  onBack: () => void;
}

export default function SidebarHeader({ onBack }: SidebarHeaderProps) {
  const { ref, focused } = useFocusable({
    focusKey: "sidebar-header",
    onEnterPress: onBack,
  });

  return (
    <div className="flex items-center gap-[0.2vw]">
      {/* Seta fora do pill */}
      <div className={`${focused ? '-translateX-[1vw]': ''}`}>
        <img
          src="/icons/back.png"
          className="w-auto h-[1.4vw]"
          alt="Voltar"
        />
      </div>

      {/* Botão pill */}
      <div
        ref={ref}
        onClick={onBack}
        className={`flex items-center gap-[0.2vw] py-[0.4vw] px-[0.4vw] rounded-full bg-neutral-800/40`}
      >
        {/* Círculo com ícone */}
        <div className="flex items-center justify-center w-[2.8vw] h-[2.8vw] rounded-full bg-neutral-700">
          <img
            src="/icons/movies.svg"
            className="w-[1.4vw] h-[1.4vw]"
            alt="Voltar"
          />
        </div>

        {/* Texto */}
        <span className="text-[1.4vw] font-bold text-white px-[1vw]">Filmess</span>
      </div>
    </div>
  );
}
