'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { Loader2, AlertCircle, Check, Tv } from 'lucide-react';

interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

interface CategoryMenuProps {
  categories: Category[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (id: string, name: string) => void;
  selectedCategory?: string | null;
  initialFocus?: boolean; // se true, foca no primeiro item
  className?: string;
}

export function CategoryMenu({
  categories,
  loading,
  error,
  onRetry,
  onSelect,
  selectedCategory,
  initialFocus = true,
  className
}: CategoryMenuProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const ITEM_HEIGHT = 6; // em vw
  const GAP = 0.5; // em vw

  const { ref: focusRootRef } = useFocusable({
    focusKey: 'category-menu',
    isFocusBoundary: true,
  });

  useEffect(() => {
    if (initialFocus && categories.length > 0) {
      setTimeout(() => setFocus('category-0'), 100);
    }
  }, [categories, initialFocus]);

  const getTranslateY = () => {
    if (!containerRef.current || categories.length === 0) return 0;
    const containerHeight = containerRef.current.offsetHeight;
    const itemHeightPx = (ITEM_HEIGHT / 100) * window.innerWidth;
    const gapPx = (GAP / 100) * window.innerWidth;
    const totalHeight = categories.length * itemHeightPx + (categories.length - 1) * gapPx;

    let desiredY = focusedIndex * (itemHeightPx + gapPx);
    const maxTranslate = totalHeight - containerHeight;
    if (desiredY > maxTranslate) desiredY = maxTranslate;
    return -desiredY;
  };

  return (
    <div ref={focusRootRef} className={`flex flex-col ${className && className}`}>
      <div ref={containerRef} className="relative h-full overflow-visible p-[1vw]">
        <AnimatePresence>
          {loading && <LoadingIndicator />}
          {error && <ErrorIndicator error={error} onRetry={onRetry} />}
          {!loading && !error && categories.length === 0 && <EmptyState />}
          {!loading && !error && categories.length > 0 && (
            <motion.div
              className="absolute top-0 left-0 w-full space-y-[0.5vw]"
              animate={{ y: getTranslateY() }}
              transition={{ type: 'tween', duration: 0.25 }}
              style={{ willChange: 'transform' }}
            >
              {categories.map((cat, i) => (
                <CategoryItem
                  key={cat.category_id}
                  category={cat}
                  index={i}
                  focusedIndex={focusedIndex}
                  setFocusedIndex={setFocusedIndex}
                  isSelected={selectedCategory === cat.category_id}
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* =========================
   Subcomponents
   ========================= */

function CategoryItem({
  category,
  index,
  focusedIndex,
  setFocusedIndex,
  isSelected,
  onSelect,
}: {
  category: Category;
  index: number;
  focusedIndex: number;
  setFocusedIndex: (i: number) => void;
  isSelected: boolean;
  onSelect: (id: string, name: string) => void;
}) {
  const { ref, focused } = useFocusable({
    focusKey: `category-${index}`,
    onEnterPress: () => onSelect(category.category_id, category.category_name),
    onFocus: () => setFocusedIndex(index),
  });

  return (
    <motion.div
      ref={ref}
      layout
      className={`
        relative w-full h-[6vw] flex items-center px-[1vw] transition-all duration-200 rounded-[1vw]
        ${focused
          ? 'scale-[1.08] z-10 shadow-[0_20px_40px_rgba(0,0,0,0.9)] border-2 border-white bg-white'
          : 'opacity-70 bg-neutral-800'}
        ${isSelected ? 'border-blue-500' : ''}
      `}
    >
      <span
        className={`text-[1.8vw] font-medium transition-colors ${
          focused ? 'text-black' : isSelected ? 'text-blue-400' : 'text-neutral-300'
        }`}
      >
        {category.category_name}
      </span>

      {isSelected && (
        <Check className="absolute right-[1vw] w-[1.5vw] h-[1.5vw] text-blue-400" />
      )}
    </motion.div>
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
