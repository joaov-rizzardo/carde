export type ApiResponse<T> =
  | { sucesso: true; dados: T }
  | { sucesso: false; erro: string; codigo?: string }

export const ok = <T>(dados: T): ApiResponse<T> => ({ sucesso: true, dados })

export const erro = (mensagem: string, codigo?: string): ApiResponse<never> =>
  ({ sucesso: false, erro: mensagem, codigo })
