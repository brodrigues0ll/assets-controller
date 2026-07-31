'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Cpu, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou senha inválidos');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: '#0a0a0f',
        backgroundImage: `
          linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md rounded-lg p-8"
        style={{
          background: '#0f0f1a',
          border: '1px solid #00d4ff30',
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.08), 0 0 0 1px #00d4ff10',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
            style={{
              background: '#00d4ff10',
              border: '1px solid #00d4ff30',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)',
            }}
          >
            <Cpu className="h-8 w-8" style={{ color: '#00d4ff' }} />
          </div>
          <h1
            className="text-2xl font-bold tracking-widest font-mono"
            style={{
              color: '#00d4ff',
              textShadow: '0 0 15px rgba(0, 212, 255, 0.5)',
            }}
          >
            INFRALEDGER
          </h1>
          <p
            className="text-xs font-mono mt-1 tracking-wider"
            style={{ color: '#64748b' }}
          >
            SISTEMA DE CONTROLE DE INVENTÁRIO
          </p>
          <div
            className="w-full h-px mt-4"
            style={{ background: 'linear-gradient(90deg, transparent, #00d4ff30, transparent)' }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-mono uppercase tracking-widest mb-2"
              style={{ color: '#64748b' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full h-11 px-4 rounded text-sm font-mono transition-all duration-150"
              style={{
                background: '#141428',
                border: '1px solid #1a3a4a',
                color: '#e2e8f0',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00d4ff';
                e.target.style.boxShadow = '0 0 0 1px #00d4ff, 0 0 10px #00d4ff20';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#1a3a4a';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-mono uppercase tracking-widest mb-2"
              style={{ color: '#64748b' }}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full h-11 px-4 rounded text-sm font-mono transition-all duration-150"
              style={{
                background: '#141428',
                border: '1px solid #1a3a4a',
                color: '#e2e8f0',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00d4ff';
                e.target.style.boxShadow = '0 0 0 1px #00d4ff, 0 0 10px #00d4ff20';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#1a3a4a';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded text-sm"
              style={{
                background: '#ff2d5510',
                border: '1px solid #ff2d5540',
                color: '#ff2d55',
              }}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded font-semibold text-sm tracking-wider transition-all duration-150 font-mono mt-2"
            style={{
              background: loading ? '#00d4ff60' : '#00d4ff',
              color: '#0a0a0f',
              boxShadow: loading ? 'none' : '0 0 15px rgba(0, 212, 255, 0.3)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
          </button>
        </form>

        <p
          className="text-center text-xs font-mono mt-6"
          style={{ color: '#1a3a4a' }}
        >
          NAV BRASIL // ACESSO RESTRITO
        </p>
      </div>
    </div>
  );
}
