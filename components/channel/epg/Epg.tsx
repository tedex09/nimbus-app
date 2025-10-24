'use client';

import { useState, useCallback, useRef } from 'react';
import { useFocusable, FocusContext } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from 'framer-motion';
import { ProgramCard } from "./ProgramCard";

const ITEM_WIDTH = 30; // vw
const GAP = 0.4; // vw

export function Epg({ filteredPrograms }: { filteredPrograms: any[] }) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { ref, focusKey } = useFocusable({
    focusKey: 'epg',
    saveLastFocusedChild: true,
    trackChildren: true,
  });

  const getTranslateX = useCallback(() => {
    if (!containerRef.current || filteredPrograms.length === 0) {
      return 0;
    }

    const containerWidth = containerRef.current.offsetWidth;
    const itemWidthPx = (ITEM_WIDTH / 100) * window.innerWidth;
    const gapPx = (GAP / 100) * window.innerWidth;
    const itemWidthWithGapPx = itemWidthPx + gapPx;
    const totalContentWidth = filteredPrograms.length * itemWidthWithGapPx - gapPx;

    if (totalContentWidth <= containerWidth) {
      return 0;
    }

    // Alinha o item focado à esquerda, respeitando os limites do container.
    const desiredScrollPosition = focusedIndex * itemWidthWithGapPx;
    const maxScroll = totalContentWidth - containerWidth;
    const finalScrollPosition = Math.min(desiredScrollPosition, maxScroll);

    return -finalScrollPosition;
  }, [filteredPrograms.length, focusedIndex]);

  return (
    <FocusContext.Provider value={focusKey}>
      {filteredPrograms && (
        <h3 className="text-[1.5vw] font-bold text-white mb-[1vw]">
          Programação
        </h3>
      )}
      <div ref={ref} className="relative w-full">
        <div ref={containerRef} className="overflow-hidden">
          <motion.div
            className="flex gap-[0.4vw] w-max"
            animate={{ x: getTranslateX() }}
            transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
            style={{ willChange: 'transform' }}
          >
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((p: any, index: number) => (
                <ProgramCard
                  key={`${p.id}-${index}`}
                  program={p}
                  isCurrent={p.isLive}
                  index={index}
                  onFocus={setFocusedIndex}
                  focusKey={`program-${index}`}
                />
              ))
            ) : (
              <div className="text-neutral-400 text-[1.2vw] w-full text-center py-4">
                Nenhuma programação encontrada para este dia.
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </FocusContext.Provider>
  );
}
