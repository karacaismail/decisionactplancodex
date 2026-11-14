import { personalOnly } from './hosting'

export type Role = 'admin' | 'editor' | 'reader' | 'reviewer'
export const roleLabel: Record<Role, string> = {
  admin: 'Yönetici',
  editor: 'Düzenleyen',
  reader: 'Okuyucu',
  reviewer: 'İnceleyen',
}
export interface Member {
  id: string
  name: string
  role: Role
}
export interface Session {
  user: Member
  workspace: { id: string; name: string }
}
export interface AuditEvent {
  seq: number
  actor: string
  action: string
  planId: string | null
  revision: number | null
  detail: string
  at: string
}
export async function teamRequest<T>(
  action: string,
  body?: unknown,
  session?: Session,
): Promise<T> {
  if (personalOnly) throw Error('Kurum alanı yerel sunucuda açılır.')
  const response = await fetch('/api/team/' + action, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(session
        ? {
            'X-Atlas-Space': session.workspace.id,
            'X-Atlas-Member': session.user.id,
          }
        : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw Error('Kurum hizmeti açık değil. Yerel sunucuyu yeniden başlatın.')
  const data = await response.json()
  if (!response.ok) throw Error(data.error || 'Kurum kaydı açılamadı.')
  return data
}
