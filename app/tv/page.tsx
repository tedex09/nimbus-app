'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useAppStore } from '@/stores/useAppStore';
import { api } from '@/lib/api';
import { CategoryMenu } from '@/components/ui/CategoryMenu';
import { Tv } from 'lucide-react';

interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export default function TVPage() {
  const router = useRouter();
  const { session, initializeApp } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp().then(() => setIsInitialized(true));
  }, [initializeApp]);

  const fetchCategories = useCallback(async () => {
    if (!session) {
      setError('Sessão inválida');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { serverCode, username, password } = session;
      const data = await api.getCategories(serverCode, username, password);
      if (Array.isArray(data)) setCategories(data);
      else throw new Error('Formato de resposta inválido');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchCategories();
  }, [session, router, fetchCategories, isInitialized]);

  if (!isInitialized) return <p>Carregando app...</p>;
  if (!session) return <p>Redirecionando...</p>;

  return (
    <FocusContext.Provider value="">
      <motion.div className="w-screen h-screen bg-black flex">
        <CategoryMenu
          categories={categories}
          loading={loading}
          error={error}
          onRetry={fetchCategories}
          selectedCategory={selectedCategory}
          onSelect={(id, name) => {
            setSelectedCategory(id);
            console.log('Selecionou', name);
          }}
          className="ml-[2vw] mt-[1vw] w-[30vw]"
        />

        {/* Área principal */}
        <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
          <Tv className="w-[10vh] h-[10vh] mb-4 opacity-30" />
          {selectedCategory ? (
            <p className="text-[3vh]">Categoria {selectedCategory} selecionada</p>
          ) : (
            <p className="text-[3vh]">Selecione uma categoria</p>
          )}
        </div>
      </motion.div>
    </FocusContext.Provider>
  );
}
