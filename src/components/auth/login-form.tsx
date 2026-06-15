'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { requestMagicLink } from '@/app/(marketing)/login/actions'

type LoginState =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'error_invalid_email'
  | 'error_email_not_found'
  | 'error_no_cookies'
  | 'error_generic'

const NEXTAUTH_ERROR_MESSAGES: Record<string, string> = {
  Verification: 'Link expirado ou inválido. Solicite um novo link de acesso.',
  OAuthAccountNotLinked: 'Este e-mail já está vinculado a outro método de login.',
  EmailSignin: 'Não conseguimos enviar o e-mail. Tente novamente.',
}

interface Props {
  searchParams?: Record<string, string | string[] | undefined>
}

export function LoginForm({ searchParams }: Props) {
  const [loginState, setLoginState] = useState<LoginState>('idle')
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [genericError, setGenericError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (!navigator.cookieEnabled) {
      setLoginState('error_no_cookies')
      return
    }

    const errorCode =
      typeof searchParams?.error === 'string' ? searchParams.error : undefined
    if (errorCode) {
      const msg =
        NEXTAUTH_ERROR_MESSAGES[errorCode] ?? 'Algo deu errado. Tente novamente.'
      setGenericError(msg)
      setLoginState('error_generic')
    }
  }, [searchParams])

  const isDisabled = loginState === 'submitting'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setFieldError(null)
    setGenericError(null)

    const trimmed = email.trim().toLowerCase()

    if (!trimmed) {
      setFieldError('E-mail é obrigatório')
      setLoginState('error_invalid_email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError('Formato de e-mail inválido')
      setLoginState('error_invalid_email')
      return
    }

    setLoginState('submitting')

    const result = await requestMagicLink({ email: trimmed })

    if (result.ok) {
      setLoginState('success')
    } else if (result.error === 'EMAIL_NOT_FOUND') {
      setLoginState('error_email_not_found')
    } else {
      setGenericError(result.error ?? 'Algo deu errado. Tente novamente.')
      setLoginState('error_generic')
    }
  }

  return (
    <div className="min-h-screen bg-brand-warm flex items-center justify-center px-4 py-12">
      {loginState === 'error_no_cookies' && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200">
          <span aria-hidden>🍪</span>
          <p className="text-sm text-amber-800 font-medium">
            Cookies precisam estar habilitados para usar o Cardê
          </p>
        </div>
      )}

      <div
        className={`w-full max-w-[400px] transition-all duration-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="bg-brand-surface rounded-2xl shadow-[0_4px_32px_rgba(26,26,46,0.08)] px-8 py-10">
          {/* Brand */}
          <div className="text-center mb-8">
            <h1 className="font-display text-[2.75rem] leading-none tracking-tight text-brand-primary mb-1">
              Cardê
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-2 mb-3">
              <div className="h-px w-8 bg-brand-border" />
              <div className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              <div className="h-px w-8 bg-brand-border" />
            </div>
            <p className="text-sm text-brand-muted">
              Cardápio digital para o seu restaurante
            </p>
          </div>

          {loginState === 'success' ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="text-lg font-semibold text-brand-primary mb-2">
                Verifique seu e-mail
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed">
                Enviamos um link de acesso para{' '}
                <span className="font-medium text-brand-primary">{email}</span>.
                <br />
                Clique nele para entrar.
              </p>
            </div>
          ) : (
            <>
              {loginState === 'error_generic' && genericError && (
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
                        loginState === 'error_invalid_email' ||
                        loginState === 'error_email_not_found'
                      ) {
                        setLoginState('idle')
                        setFieldError(null)
                      }
                    }}
                    placeholder="seu@email.com"
                    disabled={isDisabled}
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={
                      loginState === 'error_invalid_email' ||
                      loginState === 'error_email_not_found'
                    }
                    aria-describedby={
                      loginState === 'error_invalid_email'
                        ? 'email-error'
                        : loginState === 'error_email_not_found'
                          ? 'email-not-found-error'
                          : undefined
                    }
                    className={`w-full h-11 rounded-lg border px-3.5 text-sm text-brand-primary placeholder:text-brand-muted/60 outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                      loginState === 'error_invalid_email' ||
                      loginState === 'error_email_not_found'
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-brand-border bg-white focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15'
                    }`}
                  />
                  {loginState === 'error_invalid_email' && fieldError && (
                    <p id="email-error" className="mt-1.5 text-xs text-red-600">
                      {fieldError}
                    </p>
                  )}
                  {loginState === 'error_email_not_found' && (
                    <p id="email-not-found-error" className="mt-1.5 text-xs text-red-600">
                      Conta não encontrada.{' '}
                      <Link href="/cadastro" className="font-medium underline">
                        Criar conta →
                      </Link>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isDisabled}
                  className="w-full h-11 rounded-lg bg-brand-accent text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                >
                  {loginState === 'submitting' ? (
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
                    'Enviar link de acesso'
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
                disabled={isDisabled}
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

        {loginState !== 'success' && (
          <p className="text-center mt-5 text-sm text-brand-muted">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="text-brand-accent font-medium hover:underline">
              Criar conta →
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
