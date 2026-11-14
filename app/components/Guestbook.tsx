'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'

type GuestbookEntry = {
  id: string
  createdAt: string
  nickname: string
  message: string
}

const MAX_MESSAGE_LENGTH = 500

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [nickname, setNickname] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const startedAt = useRef(Date.now())

  async function loadEntries() {
    setLoading(true)
    try {
      const response = await fetch('/api/guestbook', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setEntries(data.entries || [])
    } catch {
      setNotice('방명록을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          message,
          website: form.get('website'),
          startedAt: startedAt.current,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '등록에 실패했습니다.')

      setNickname('')
      setMessage('')
      setNotice('방명록을 남겼어요. 고마워요!')
      startedAt.current = Date.now()
      await loadEntries()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="guestbook" className="scroll-mt-16 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em]" style={{ color: 'var(--muted)' }}>Guestbook</p>
          <h2 className="text-2xl font-semibold md:text-3xl" style={{ color: 'var(--text)' }}>방명록</h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          홍이삭의 음악과 함께한 마음을 남겨 주세요.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <form onSubmit={submit} className="h-fit rounded-2xl border bg-[#fffdf7] p-5 sm:p-6" style={{ borderColor: 'var(--border)' }}>
          <label className="block text-xs font-semibold" htmlFor="guestbook-nickname">닉네임</label>
          <input
            id="guestbook-nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={30}
            required
            placeholder="30자 이내"
            className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:bg-white"
            style={{ borderColor: 'var(--border)' }}
          />

          <div className="mt-5 flex items-center justify-between gap-3">
            <label className="text-xs font-semibold" htmlFor="guestbook-message">메시지</label>
            <span className="text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>{message.length}/{MAX_MESSAGE_LENGTH}</span>
          </div>
          <textarea
            id="guestbook-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            required
            rows={8}
            placeholder="최대 500자까지 남길 수 있어요."
            className="mt-2 w-full resize-y rounded-xl border bg-transparent px-4 py-3 text-sm leading-relaxed outline-none transition focus:bg-white"
            style={{ borderColor: 'var(--border)' }}
          />

          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="guestbook-website">Website</label>
            <input id="guestbook-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <button
            type="submit"
            disabled={submitting || !nickname.trim() || !message.trim()}
            className="mt-4 w-full rounded-full px-5 py-3 text-xs font-semibold tracking-[0.18em] text-[#fffaf3] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--gyeol-red)' }}
          >
            {submitting ? '등록 중…' : '방명록 남기기'}
          </button>
          {notice && <p role="status" className="mt-4 text-center text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{notice}</p>}
          <p className="mt-4 text-center text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            링크와 개인정보가 포함된 글은 등록하지 말아 주세요.
          </p>
        </form>

        <div>
          {loading ? (
            <p className="rounded-2xl border px-6 py-12 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>방명록을 불러오는 중…</p>
          ) : entries.length === 0 ? (
            <p className="rounded-2xl border px-6 py-12 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>첫 번째 방명록을 남겨 주세요.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <article key={entry.id} className="rounded-2xl border bg-[#fbf5ed]/70 p-5 sm:p-6" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{entry.nickname}</h3>
                    <time className="text-[10px]" style={{ color: 'var(--muted)' }} dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7" style={{ color: 'var(--text)' }}>{entry.message}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
