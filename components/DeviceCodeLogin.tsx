'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useAppStore } from '@/stores/useAppStore';
import { Smartphone, Monitor, Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface DeviceCodeLoginProps {
  onBack: () => void;
}

export function DeviceCodeLogin({ onBack }: DeviceCodeLoginProps) {
  const { 
    deviceCode, 
    deviceCodePolling, 
    error, 
    isLoading,
    loginWithDeviceCode, 
    startDeviceCodePolling,
    stopDeviceCodePolling,
    setError
  } = useAppStore();
  
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Container focusable
  const { ref: containerRef } = useFocusable({
    focusKey: 'device-code-container',
    isFocusBoundary: true,
  });

  useEffect(() => {
  if (deviceCode) {
    setTimeRemaining(deviceCode.expiresIn); // se a propriedade no seu tipo for expiresIn
    startDeviceCodePolling(deviceCode); // passe o objeto inteiro
  }
}, [deviceCode, startDeviceCodePolling]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timeRemaining > 0 && deviceCode) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setError('Código expirado. Gere um novo código.');
            stopDeviceCodePolling();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeRemaining, deviceCode, setError, stopDeviceCodePolling]);

  const handleGenerateCode = useCallback(async () => {
    try {
      setError(null);
      await loginWithDeviceCode();
    } catch (error) {
      console.error('Failed to generate device code:', error);
    }
  }, [loginWithDeviceCode, setError]);

  const handleBack = useCallback(() => {
    stopDeviceCodePolling();
    onBack();
  }, [stopDeviceCodePolling, onBack]);

  const formatTime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatUserCode = (code?: string) => {
    if (!code) return '';
    return code.replace(/(.{4})/g, '$1-').slice(0, -1);
  };

  return (
    <motion.div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-4xl">
        <motion.div 
          className="bg-black/80 backdrop-blur-xl rounded-3xl p-12 border border-gray-700"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 className="text-6xl font-bold text-white mb-4" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
              Entrar com Código
            </motion.h1>
            <motion.p className="text-2xl text-gray-300" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
              Autentique esta TV usando seu celular ou computador
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {/* Botão gerar código */}
            {!deviceCode && !isLoading && (
              <motion.div key="generate" className="text-center space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="flex justify-center mb-8">
                  <div className="bg-blue-600/20 p-8 rounded-full">
                    <Smartphone className="w-24 h-24 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl text-gray-300 mb-8">
                  Clique no botão abaixo para gerar um código de autenticação
                </p>
                <GenerateCodeButton onGenerate={handleGenerateCode} />
              </motion.div>
            )}

            {/* Loading */}
            {isLoading && (
              <motion.div key="loading" className="text-center space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="flex justify-center">
                  <motion.div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                </div>
                <p className="text-2xl text-gray-300">Gerando código...</p>
              </motion.div>
            )}

            {/* Código gerado */}
            {deviceCode && !error && (
              <motion.div key="code-display" className="text-center space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-blue-900/30 rounded-2xl p-8 border border-blue-500/30">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Monitor className="w-12 h-12 text-blue-400" />
                    <span className="text-4xl text-gray-300">→</span>
                    <Smartphone className="w-12 h-12 text-blue-400" />
                  </div>
                  <p className="text-2xl text-gray-200 mb-4">No seu celular ou computador, acesse:</p>
                  <div className="bg-black/50 rounded-xl p-6 mb-6">
                    <p className="text-3xl font-mono text-blue-400 font-bold">https://nimbus.app/tv</p>
                  </div>
                  <p className="text-2xl text-gray-200">E digite o código:</p>
                </div>

                <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-3xl p-12 border border-green-500/30">
                  <motion.div className="text-8xl font-mono font-bold text-white text-center tracking-wider"
                    animate={{ scale: [1, 1.05, 1], textShadow: ['0 0 20px rgba(34, 197, 94, 0.5)','0 0 30px rgba(34, 197, 94, 0.8)','0 0 20px rgba(34, 197, 94, 0.5)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {formatUserCode(deviceCode.code)}
                  </motion.div>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <div className="flex items-center gap-3 text-2xl text-gray-300">
                    <Clock className="w-8 h-8" />
                    <span>Expira em: {formatTime(timeRemaining)}</span>
                  </div>
                  {deviceCodePolling && (
                    <div className="flex items-center gap-3 text-2xl text-blue-400">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                        <RefreshCw className="w-8 h-8" />
                      </motion.div>
                      <span>Aguardando autenticação...</span>
                    </div>
                  )}
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeRemaining / (deviceCode.expiresIn || 300)) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div key="error" className="text-center space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="flex justify-center">
                  <div className="bg-red-600/20 p-8 rounded-full">
                    <XCircle className="w-24 h-24 text-red-400" />
                  </div>
                </div>
                <div className="bg-red-900/30 rounded-2xl p-8 border border-red-500/30">
                  <p className="text-2xl text-red-400 mb-6">{error}</p>
                  <RetryButton onRetry={handleGenerateCode} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center mt-12">
            <BackButton onBack={handleBack} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
// Componentes focáveis separados
function GenerateCodeButton({ onGenerate }: { onGenerate: () => void; }) {
  const { ref, focused } = useFocusable({
    focusKey: 'generate-code-button',
    onEnterPress: onGenerate,
  });

  return (
    <motion.button
      ref={ref}
      className={`
        px-12 py-6 rounded-2xl text-2xl font-bold 
        bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 
        text-white border-3 transition-all duration-200
        ${focused ? 'border-white shadow-lg shadow-white/20' : 'border-transparent'}
      `}
      onClick={onGenerate}
      whileFocus={{ scale: 1.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Gerar Código
    </motion.button>
  );
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: 'retry-button',
    onEnterPress: onRetry,
  });

  return (
    <motion.button
      ref={ref}
      className={`
        px-8 py-4 rounded-xl text-xl font-bold 
        bg-red-600 hover:bg-red-500 text-white 
        border-3 transition-all duration-200
        ${focused ? 'border-white shadow-lg shadow-white/20' : 'border-transparent'}
      `}
      onClick={onRetry}
      whileFocus={{ scale: 1.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Tentar Novamente
    </motion.button>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  const { ref, focused } = useFocusable({
    focusKey: 'back-button',
    onEnterPress: onBack,
  });

  return (
    <motion.button
      ref={ref}
      className={`
        px-8 py-4 rounded-xl text-xl font-medium 
        bg-gray-700 hover:bg-gray-600 text-white 
        border-3 transition-all duration-200
        ${focused ? 'border-white shadow-lg shadow-white/20' : 'border-transparent'}
      `}
      onClick={onBack}
      whileFocus={{ scale: 1.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      ← Voltar
    </motion.button>
  );
}