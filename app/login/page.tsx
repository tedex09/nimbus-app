'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useAppStore } from '@/stores/useAppStore';
import { VirtualKeyboard } from '@/components/VirtualKeyboard';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, session } = useAppStore();
  
  const [serverCode, setServerCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeField, setActiveField] = useState<'server' | 'username' | 'password'>('server');
  const [showKeyboard, setShowKeyboard] = useState(false);

  useEffect(() => {
    if (session) {
      router.push('/');
      return;
    }

    if (typeof window !== 'undefined') {
      init({
        debug: false,
        visualDebug: false,
      });
      
      setTimeout(() => {
        setFocus('server-field');
      }, 100);
    }
  }, [session, router]);

  const handleFieldFocus = useCallback((field: 'server' | 'username' | 'password') => {
    setActiveField(field);
    setShowKeyboard(true);
  }, []);

  const handleKeyboardType = useCallback((char: string) => {
    if (activeField === 'server') {
      setServerCode(prev => prev + char);
    } else if (activeField === 'username') {
      setUsername(prev => prev + char);
    } else if (activeField === 'password') {
      setPassword(prev => prev + char);
    }
  }, [activeField]);

  const handleKeyboardBackspace = useCallback(() => {
    if (activeField === 'server') {
      setServerCode(prev => prev.slice(0, -1));
    } else if (activeField === 'username') {
      setUsername(prev => prev.slice(0, -1));
    } else if (activeField === 'password') {
      setPassword(prev => prev.slice(0, -1));
    }
  }, [activeField]);

  const handleSubmit = useCallback(async () => {
    if (!serverCode.trim() || !username.trim() || !password.trim()) {
      return;
    }

    try {
      await login(serverCode.trim(), username.trim(), password.trim());
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  }, [serverCode, username, password, login, router]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.currentTarget.getAttribute('data-focus-key')?.includes('field')) {
        setShowKeyboard(true);
      }
    } else if (event.key === 'Escape' || event.key === 'Backspace') {
      if (showKeyboard && event.key === 'Escape') {
        setShowKeyboard(false);
        setFocus(`${activeField}-field`);
      }
    }
  }, [showKeyboard, activeField]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">ASSIST+</h1>
          <p className="text-2xl text-gray-300">Entre com suas credenciais</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/50 rounded-2xl p-8 backdrop-blur-sm">
          <div className="space-y-6">
            {/* Server Field */}
            <div>
              <label htmlFor="server" className="block text-xl font-medium text-gray-200 mb-3">
                Código do Servidor
              </label>
              <div
                data-focus-key="server-field"
                className={`
                  w-full h-16 px-6 bg-gray-800 rounded-lg text-xl
                  border-2 border-transparent transition-all
                  focus:border-white focus:outline-none cursor-pointer
                  flex items-center
                  ${activeField === 'server' && showKeyboard ? 'border-blue-500' : ''}
                `}
                tabIndex={0}
                onClick={() => handleFieldFocus('server')}
                onFocus={() => handleFieldFocus('server')}
                onKeyDown={handleKeyDown}
              >
                {serverCode || <span className="text-gray-500">Digite o código do servidor</span>}
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-xl font-medium text-gray-200 mb-3">
                Usuário
              </label>
              <div
                data-focus-key="username-field"
                className={`
                  w-full h-16 px-6 bg-gray-800 rounded-lg text-xl
                  border-2 border-transparent transition-all
                  focus:border-white focus:outline-none cursor-pointer
                  flex items-center
                  ${activeField === 'username' && showKeyboard ? 'border-blue-500' : ''}
                `}
                tabIndex={0}
                onClick={() => handleFieldFocus('username')}
                onFocus={() => handleFieldFocus('username')}
                onKeyDown={handleKeyDown}
              >
                {username || <span className="text-gray-500">Digite seu usuário</span>}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xl font-medium text-gray-200 mb-3">
                Senha
              </label>
              <div
                data-focus-key="password-field"
                className={`
                  w-full h-16 px-6 bg-gray-800 rounded-lg text-xl
                  border-2 border-transparent transition-all
                  focus:border-white focus:outline-none cursor-pointer
                  flex items-center
                  ${activeField === 'password' && showKeyboard ? 'border-blue-500' : ''}
                `}
                tabIndex={0}
                onClick={() => handleFieldFocus('password')}
                onFocus={() => handleFieldFocus('password')}
                onKeyDown={handleKeyDown}
              >
                {password ? '•'.repeat(password.length) : <span className="text-gray-500">Digite sua senha</span>}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-lg text-center p-4 bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Virtual Keyboard */}
          {showKeyboard && (
            <VirtualKeyboard
              focusKey={`login-keyboard-${activeField}`}
              onType={handleKeyboardType}
              onBackspace={handleKeyboardBackspace}
              onSubmit={handleSubmit}
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center mt-8">
              <div className="text-2xl text-blue-400">Conectando...</div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center mt-8 text-gray-400 text-lg">
          <p>Use as setas para navegar • Enter para selecionar • Escape para fechar teclado</p>
        </div>
      </div>
    </div>
  );
}