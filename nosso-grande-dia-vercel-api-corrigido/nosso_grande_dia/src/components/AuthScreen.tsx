import React, { useState } from 'react';
import { Heart, Lock, Mail, User, Sparkles, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const { primaryColor } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  // Register form state
  const [regNomeNoivo, setRegNomeNoivo] = useState('');
  const [regNomeNoiva, setRegNomeNoiva] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regConfirmarSenha, setRegConfirmarSenha] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginEmail) {
      setError('Por favor, preencha o e-mail de acesso.');
      return;
    }

    try {
      setSubmitting(true);
      await login(loginEmail, loginSenha);
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login. Verifique seus dados.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regNomeNoivo.trim() || !regNomeNoiva.trim()) {
      setError('Por favor, informe os nomes do Noivo e da Noiva.');
      return;
    }

    if (!regEmail.trim()) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    if (regSenha && regSenha.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (regSenha !== regConfirmarSenha) {
      setError('As senhas não coincidem. Digite novamente.');
      return;
    }

    try {
      setSubmitting(true);
      await register({
        nome_noivo: regNomeNoivo.trim(),
        nome_noiva: regNomeNoiva.trim(),
        email: regEmail.trim(),
        senha: regSenha
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#800020] selection:text-white">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 px-4">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-[#E5E2D9] shadow-sm text-[#800020] mb-1">
          <Heart className="w-8 h-8 fill-[#800020]/15" />
        </div>

        <h1 className="font-serif font-bold text-3xl text-[#2D2D2D] tracking-tight">
          Nosso Grande Dia
        </h1>
        <p className="text-sm text-stone-600 max-w-sm mx-auto">
          O planejador completo e elegante para organizar o casamento dos seus sonhos a dois.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#E5E2D9] shadow-md space-y-6">
          
          {/* Tabs header */}
          <div className="flex bg-[#F4F1E8] p-1 rounded-2xl border border-[#E5E2D9]">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#2D2D2D] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white text-[#2D2D2D] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Criar Conta do Casal
            </button>
          </div>

          {/* Error feedback */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 leading-relaxed">
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail do Casal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="ex: casal@email.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Senha de Acesso</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={loginSenha}
                    onChange={e => setLoginSenha(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <span>Acessando...</span>
                ) : (
                  <>
                    <span>Entrar no Planejador</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs text-[#800020] font-semibold hover:underline"
                >
                  Ainda não tem uma conta? Cadastre o seu casal
                </button>
              </div>


            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-[#FAF6F0] rounded-2xl border border-[#E5E2D9] text-xs text-stone-600 flex items-start gap-2">
                <HeartHandshake className="w-5 h-5 text-[#800020] shrink-0 mt-0.5" />
                <span>
                  Cadastre o nome do <strong>Noivo</strong> e da <strong>Noiva</strong> para gerenciarem tudo juntos na mesma conta!
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Noivo 🤵</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regNomeNoivo}
                      onChange={e => setRegNomeNoivo(e.target.value)}
                      placeholder="Ex: Eduardo"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-stone-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nome da Noiva 👰</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regNomeNoiva}
                      onChange={e => setRegNomeNoiva(e.target.value)}
                      placeholder="Ex: Maria"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-stone-50/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail do Casal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="ex: noivo.noiva@email.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={regSenha}
                    onChange={e => setRegSenha(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Confirmar Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={regConfirmarSenha}
                    onChange={e => setRegConfirmarSenha(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#800020] focus:outline-none bg-stone-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <span>Criando Conta...</span>
                ) : (
                  <>
                    <span>Criar Conta e Começar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-[#800020] font-semibold hover:underline"
                >
                  Já possuem uma conta? Faça login aqui
                </button>
              </div>
            </form>
          )}

        </div>

        <p className="text-center text-[11px] text-stone-400 mt-6 font-serif">
          Organização, harmonia e transparência para o seu casamento.
        </p>
      </div>
    </div>
  );
};
