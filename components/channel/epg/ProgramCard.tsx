'use client';

import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";

export function ProgramCard({
  program,
  isCurrent,
  index,
  onFocus,
  focusKey,
}: {
  program: any;
  isCurrent?: boolean;
  index: number;
  onFocus: (index: number) => void;
  focusKey: string;
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => {},
    onFocus: () => onFocus(index),
  });

  const time = new Date(program.startTime).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const end = new Date(program.endTime).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      ref={ref}
      className={`
        flex-shrink-0 w-[30vw] p-[1vw] rounded-[1vw] transition-all
        ${isCurrent ? "bg-white/40 text-black" : "bg-black/70 text-white"}
        ${focused ? "!bg-white !text-black" : ""}
      `}
    >
      <div className="flex justify-between mb-[1vw]">
        <span className="text-[1vw] font-thin">
          {time} - {end}
        </span>
        {isCurrent && (
          <div className="bg-red-600 text-white rounded-[4vw] text-[0.8vw] font-bold px-[1vw] py-[0.3vw]">
            AO VIVO
          </div>
        )}
      </div>
      <h4 className="font-bold mb-[0.5vw] line-clamp-2 text-[1.3vw]">
        {program.title}
      </h4>
    </div>
  );
}
