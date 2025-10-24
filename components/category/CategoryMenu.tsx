'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { Loader as Loader2, CircleAlert as AlertCircle, Tv } from 'lucide-react';
import { useFocusStore } from '@/stores/useFocusStore';
import { Category, CategoryItem } from './CategoryItem';

interface CategoryMenuProps {
  categories: Category[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (id: string, name: string) => void;
  initialFocus?: boolean;
  className?: string;
}

export function CategoryMenu({
  categories,
  loading,
  error,
  onRetry,
  onSelect,
  initialFocus = true,
  className
}: CategoryMenuProps) {
  const { currentCategoryId } = useFocusStore();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Injeta a categoria de Favoritos no topo
  const categoriesWithFavorites = useMemo(() => {
    return [
      { category_id: 'favorites', category_name: 'Favoritos' },
      ...categories,
    ];
  }, [categories]);

  const ITEM_HEIGHT = 6; // em vw
  const GAP = 0.5; // em vw

  const preferredCategoryKey = useMemo(() => {
    if (currentCategoryId && categoriesWithFavorites.length > 0) {
      const foundIndex = categoriesWithFavorites.findIndex(c => c.category_id === currentCategoryId);
      if (foundIndex >= 0) return `category-${foundIndex}`;
    }
    return 'category-0';
  }, [currentCategoryId, categoriesWithFavorites]);

  const { ref: focusRootRef, focusSelf, focusKey } = useFocusable({
    focusKey: 'category-menu',
    isFocusBoundary: true,
    focusBoundaryDirections: ['up', 'down'],
    saveLastFocusedChild: true,
    trackChildren: true,
    preferredChildFocusKey: preferredCategoryKey,
  });

  useEffect(() => {
    if (initialFocus && categoriesWithFavorites.length > 0) {
      focusSelf();
    }
  }, [categoriesWithFavorites, initialFocus, focusSelf]);

  const getTranslateY = useCallback(() => {
    if (!containerRef.current || categoriesWithFavorites.length === 0) return 0;
    const containerHeight = containerRef.current.offsetHeight;
    const itemHeightPx = (ITEM_HEIGHT / 100) * window.innerWidth;
    const gapPx = (GAP / 100) * window.innerWidth;
    const totalHeight = categoriesWithFavorites.length * itemHeightPx + (categoriesWithFavorites.length - 1) * gapPx;

    let desiredY = focusedIndex * (itemHeightPx + gapPx);
    const maxTranslate = totalHeight - containerHeight;
    if (desiredY > maxTranslate) desiredY = maxTranslate;
    return -desiredY;
  }, [focusedIndex, categoriesWithFavorites.length]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={focusRootRef} className={`flex flex-col ${className || ''}`}>
        <div ref={containerRef} className="relative h-full overflow-visible p-[1vw]">
          <AnimatePresence>
            {loading && <LoadingIndicator />}
            {error && <ErrorIndicator error={error} onRetry={onRetry} />}
            {!loading && !error && categoriesWithFavorites.length === 0 && <EmptyState />}
            {!loading && !error && categoriesWithFavorites.length > 0 && (
              <motion.div
                className="absolute top-0 left-0 w-full space-y-[0.5vw]"
                animate={{ y: getTranslateY() }}
                transition={{ type: 'tween', duration: 0.25 }}
                style={{ willChange: 'transform' }}
              >
                {categoriesWithFavorites.map((cat, i) => (
                  <CategoryItem
                    key={cat.category_id}
                    category={cat}
                    index={i}
                    focusedIndex={focusedIndex}
                    setFocusedIndex={setFocusedIndex}
                    isSelected={currentCategoryId === cat.category_id}
                    onSelect={onSelect}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FocusContext.Provider>
  );
}

function LoadingIndicator() {
  return (
    <motion.div
      className="flex items-center justify-center p-[2vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Loader2 className="w-[4vh] h-[4vh] text-white animate-spin" />
      <span className="ml-[1vw] text-[2vh] text-white">Carregando...</span>
    </motion.div>
  );
}

function ErrorIndicator({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      className="flex items-center justify-center p-[4vh] text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="text-red-400">
        <AlertCircle className="w-[4vh] h-[4vh] mx-auto mb-[1vh]" />
        <p className="text-[1.8vh]">{error}</p>
        <button
          onClick={onRetry}
          className="mt-[2vh] px-[2vw] py-[1vh] bg-red-600 hover:bg-red-500 rounded-lg text-[1.6vh] font-medium transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className="flex items-center justify-center p-[4vh] text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-neutral-400">
        <Tv className="w-[4vh] h-[4vh] mx-auto mb-[1vh]" />
        <p className="text-[1.8vh]">Nenhuma categoria encontrada</p>
      </div>
    </motion.div>
  );
}
