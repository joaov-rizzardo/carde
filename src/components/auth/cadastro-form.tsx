'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { requestCadastro } from '@/app/(marketing)/cadastro/actions'

type CadastroState =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'error_email_exists'
  | 'error_invalid_nome'
  | 'error_invalid_email'
  | 'error_generic'

export function CadastroForm() {
  const [state, setState] = useState<CadastroState>('idle')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [termosAceitos, setTermosAceitos] = useState(false)
  const [nomeError, setNomeError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [genericError, setGenericError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isSubmitting = state === 'submitting'
  const ctaDisabled = isSubmitting || !termosAceitos

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setNomeError(null)
    setEmailError(null)
    setGenericError(null)

    const trimmedNome = nome.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedNome) {
      setNomeError('Nome é obrigatório')
      setState('error_invalid_nome')
      return
    }
    if (!trimmedEmail) {
      setEmailError('E-mail é obrigatório')
      setState('error_invalid_email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Formato de e-mail inválido')
      setState('error_invalid_email')
      return
    }

    setState('submitting')

    const result = await requestCadastro({
      nome: trimmedNome,
      email: trimmedEmail,
      termosAceitos: true,
    })

    if (result.ok) {
      setState('success')
    } else if (result.error === 'EMAIL_EXISTS') {
      setState('error_email_exists')
    } else {
      setGenericError(result.error ?? 'Algo deu errado. Tente novamente.')
      setState('error_generic')
    }
  }

  return (
    <div className="min-h-screen bg-brand-warm flex items-center justify-center px-4 py-12">
      <div
        className={`w-full max-w-[400px] transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="bg-brand-surface rounded-2xl shadow-[0_4px_32px_rgba(26,26,46,0.08)] px-8 py-10">
          {/* Brand */}
          <div className="text-center mb-7">
            <h1 className="font-display text-[2.75rem] leading-none tracking-tight text-brand-primary mb-1">
              Cardê
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-2 mb-3">
              <div className="h-px w-8 bg-brand-border" />
              <div className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <div className="h-px w-8 bg-brand-border" />
            </div>
            <p className="text-sm text-brand-muted leading-snug px-2">
              Crie sua conta e coloque seu cardápio no ar em menos de uma hora
            </p>
          </div>

          {state === 'success' ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="text-lg font-semibold text-brand-primary mb-2">
                Verifique seu e-mail
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed">
                Enviamos um link de acesso para{' '}
                <span className="font-medium text-brand-primary">{email}</span>.
                <br />
                Clique nele para criar sua conta.
              </p>
            </div>
          ) : (
            <>
              {state === 'error_generic' && genericError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {genericError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Nome */}
                <div className="mb-4">
                  <label
                    htmlFor="nome"
                    className="block text-sm font-medium text-brand-primary mb-1.5"
                  >
                    Nome
                  </label>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value)
                      if (state === 'error_invalid_nome') {
                        setState('idle')
                        setNomeError(null)
                      }
                    }}
                    placeholder="Seu nome completo"
                    disabled={isSubmitting}
                    autoComplete="name"
                    aria-invalid={state === 'error_invalid_nome'}
                    aria-describedby={
                      state === 'error_invalid_nome' ? 'nome-error' : undefined
                    }
                    className={`w-full h-11 rounded-lg border px-3.5 text-sm text-brand-primary placeholder:text-brand-muted/60 outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                      state === 'error_invalid_nome'
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-brand-border bg-white focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15'
                    }`}
                  />
                  {state === 'error_invalid_nome' && nomeError && (
                    <p id="nome-error" className="mt-1.5 text-xs text-red-600">
                      {nomeError}
                    </p>
                  )}
                </div>

                {/* E-mail */}
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-brand-primary mb-1.5"
                  >
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (
                        state === 'error_invalid_email' ||
                        state === 'error_email_exists'
                      ) {
                        setState('idle')
                        setEmailError(null)
                      }
                    }}
                    placeholder="seu@email.com"
                    disabled={isSubmitting}
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={
                      state === 'error_invalid_email' || state === 'error_email_exists'
                    }
                    aria-describedby={
                      state === 'error_invalid_email'
                        ? 'email-error'
                        : state === 'error_email_exists'
                          ? 'email-exists-error'
                          : undefined
                    }
                    className={`w-full h-11 rounded-lg border px-3.5 text-sm text-brand-primary placeholder:text-brand-muted/60 outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                      state === 'error_invalid_email' || state === 'error_email_exists'
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-brand-border bg-white focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15'
                    }`}
                  />
                  {state === 'error_invalid_email' && emailError && (
                    <p id="email-error" className="mt-1.5 text-xs text-red-600">
                      {emailError}
                    </p>
                  )}
                  {state === 'error_email_exists' && (
                    <p id="email-exists-error" className="mt-1.5 text-xs text-red-600">
                      Esta conta já existe.{' '}
                      <Link href="/login" className="font-medium underline">
                        Fazer login →
                      </Link>
                    </p>
                  )}
                </div>

                {/* LGPD Checkbox */}
                <div className="mb-5">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <div className="relative flex-shrink-0 mt-0.5" >
                      <input
                        type="checkbox"
                        checked={termosAceitos}
                        onChange={(e) => setTermosAceitos(e.target.checked)}
                        disabled={isSubmitting}
                        className="sr-only"
                        onClick={() => !isSubmitting && setTermosAceitos((v) => !v)}
                      />
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-150 cursor-pointer ${
                          termosAceitos
                            ? 'bg-brand-accent border-brand-accent'
                            : 'bg-white border-brand-border hover:border-brand-accent/50'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        role="presentation"
                        aria-hidden
                      >
                        {termosAceitos && (
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                            aria-hidden
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-brand-muted leading-snug">
                      Li e aceito os{' '}
                      <Link
                        href="/termos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Termos de Uso
                      </Link>{' '}
                      e a{' '}
                      <Link
                        href="/privacidade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Política de Privacidade
                      </Link>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={ctaDisabled}
                  className="w-full h-11 rounded-lg bg-brand-accent text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                >
                  {state === 'submitting' ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Enviando…
                    </>
                  ) : (
                    'Criar conta'
                  )}
                </button>
              </form>

              <div className="relative flex items-center my-5">
                <div className="flex-1 border-t border-brand-border" />
                <span className="mx-3 text-xs text-brand-muted">ou</span>
                <div className="flex-1 border-t border-brand-border" />
              </div>

              <button
                type="button"
                onClick={() => void signIn('google')}
                disabled={isSubmitting}
                className="w-full h-11 rounded-lg border border-brand-border bg-brand-surface text-sm font-medium text-brand-primary flex items-center justify-center gap-2.5 hover:bg-brand-warm active:bg-brand-warm/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              >
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Entrar com Google
              </button>
            </>
          )}
        </div>

        {state !== 'success' && (
          <p className="text-center mt-5 text-sm text-brand-muted">
            Já tenho conta.{' '}
            <Link href="/login" className="text-brand-accent font-medium hover:underline">
              Fazer login →
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
