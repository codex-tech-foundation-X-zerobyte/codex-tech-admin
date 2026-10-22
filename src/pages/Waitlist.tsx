import { useEffect, useState } from 'react'
import { api, type Filters, type Role } from '../lib/api'
import { useLoad } from '../lib/useLoad'
import { toCsv } from '../lib/csv'
import { LANGUAGE_LABELS, PROVIDER_LABELS, STATUS_LABELS, formatDate, label } from '../lib/format'
import { Pagination } from '../components/Pagination'

const EMPTY: Filters = { q: '', language: '', provider: '', status: '' }

export function Waitlist({ role, params }: { role: Role; params: URLSearchParams }) {
  const canEdit = role !== 'viewer'
  const [filters, setFilters] = useState<Filters>({ ...EMPTY, q: params.get('q') ?? '' })
  const [debounced, setDebounced] = useState(filters.q)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(25)
  const [notice, setNotice] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // A search from the top bar changes the URL query; follow it.
  const urlQ = params.get('q') ?? ''
  useEffect(() => { setFilters((f) => ({ ...f, q: urlQ })); setPage(1) }, [urlQ])
  useEffect(() => { const t = setTimeout(() => setDebounced(filters.q), 300); return () => clearTimeout(t) }, [filters.q])

  const effective = { ...filters, q: debounced }
  const { data, error, loading, reload } = useLoad(
    () => api.list(effective, size, (page - 1) * size),
    [debounced, filters.language, filters.provider, filters.status, page, size],
  )

  function setFilter(k: keyof Filters, v: string) { setFilters((f) => ({ ...f, [k]: v })); setPage(1) }

  async function act(fn: () => Promise<unknown>, done: string) {
    setNotice('')
    try { await fn(); setNotice(done); reload() } catch (e) { setNotice((e as Error).message) }
  }

  async function exportCsv() {
    setExporting(true); setNotice('')
    try {
      const rows: unknown[][] = []
      let offset = 0, total = 1
      while (offset < total && offset < 20000) {
        const res = await api.list(effective, 1000, offset)
        total = res.total
        for (const r of res.rows) rows.push([r.email, label(LANGUAGE_LABELS, r.language), label(PROVIDER_LABELS, r.payment_provider), r.note ?? '', label(STATUS_LABELS, r.status), r.created_at])
        if (res.rows.length === 0) break
        offset += res.rows.length
      }
      const csv = toCsv(['email', 'language', 'payment_provider', 'note', 'status', 'joined_at'], rows)
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url; a.download = `codex-waitlist-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
      URL.revokeObjectURL(url)
      await api.logExport(rows.length)
      setNotice(`Exported ${rows.length.toLocaleString('en-GB')} rows.`)
    } catch (e) { setNotice((e as Error).message) } finally { setExporting(false) }
  }

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 20 }}>
        <div><h1>Waitlist</h1><span className="mu">{total.toLocaleString('en-GB')} matching signups.</span></div>
        {canEdit && <button className="btn pri" type="button" onClick={exportCsv} disabled={exporting}>{exporting ? 'Exporting...' : 'Export CSV'}</button>}
      </div>
      {notice && <div className="msg" role="status">{notice}</div>}
      {error && <div className="msg err" role="alert">{error} <button className="link" type="button" onClick={reload}>Retry</button></div>}
      <div className="card">
        <div className="row wrap pad" style={{ borderBottom: '1px solid var(--border)', alignItems: 'flex-end' }}>
          <div><label htmlFor="fq">Email</label><input id="fq" className="in" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} placeholder="Search emails" /></div>
          <div><label htmlFor="fl">Language</label><select id="fl" className="in" value={filters.language} onChange={(e) => setFilter('language', e.target.value)}><option value="">All</option>{Object.entries(LANGUAGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label htmlFor="fp">Provider</label><select id="fp" className="in" value={filters.provider} onChange={(e) => setFilter('provider', e.target.value)}><option value="">All</option>{Object.entries(PROVIDER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label htmlFor="fs">Status</label><select id="fs" className="in" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><option value="">All</option>{Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <button className="btn" type="button" onClick={() => { setFilters(EMPTY); setPage(1) }}>Clear filters</button>
        </div>
        <div className="tablewrap"><table className="tb">
          <thead><tr><th>Email</th><th>Language</th><th>Provider</th><th>Note</th><th>Status</th><th>Joined</th>{canEdit && <th>Actions</th>}</tr></thead>
          <tbody>
            {loading && rows.length === 0 && [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={canEdit ? 7 : 6}><div className="skel" /></td></tr>)}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.email}</td><td>{label(LANGUAGE_LABELS, r.language)}</td><td>{label(PROVIDER_LABELS, r.payment_provider)}</td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.note ?? ''}>{r.note || <span className="mu">None</span>}</td>
                <td><span className={`bd${r.status === 'invited' ? ' ok' : r.status === 'removal_requested' ? ' ac' : ''}`}>{label(STATUS_LABELS, r.status)}</span></td>
                <td className="mono">{formatDate(r.created_at)}</td>
                {canEdit && (
                  <td>
                    <div className="row">
                      <label className="sr-only" htmlFor={`st-${r.id}`}>Status for {r.email}</label>
                      <select id={`st-${r.id}`} className="in sm" value={r.status} onChange={(e) => act(() => api.setStatus(r.id, e.target.value), 'Status updated.')}>
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      {confirmId === r.id ? (
                        <>
                          <button className="btn sm danger" type="button" onClick={() => { setConfirmId(null); act(() => api.remove(r.id), 'Signup deleted.') }}>Confirm delete</button>
                          <button className="btn sm" type="button" onClick={() => setConfirmId(null)}>Cancel</button>
                        </>
                      ) : <button className="btn sm" type="button" onClick={() => setConfirmId(r.id)}>Delete</button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table></div>
        {!loading && rows.length === 0 && !error && <div className="empty">No signups match these filters.</div>}
        <Pagination total={total} page={page} size={size} onPage={setPage} onSize={(s) => { setSize(s); setPage(1) }} />
      </div>
    </>
  )
}
