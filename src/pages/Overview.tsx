import { api, type Stats } from '../lib/api'
import { useLoad } from '../lib/useLoad'
import { LANGUAGE_LABELS, PROVIDER_LABELS, formatDate, label } from '../lib/format'

function Breakdown({ title, data, labels }: { title: string; data: Record<string, number>; labels: Record<string, string> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1])
  return (
    <div className="card pad">
      <h2>{title}</h2>
      {rows.length === 0 && <p className="mu">No data yet.</p>}
      {rows.map(([k, n]) => {
        const pct = total ? Math.round((n / total) * 100) : 0
        return (
          <div key={k} style={{ marginTop: 12 }}>
            <div className="row between"><span>{label(labels, k)}</span><b>{pct}% ({n})</b></div>
            <div className="bar"><div style={{ width: `${pct}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}

function Chart({ daily }: { daily: Stats['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => d.count))
  const w = 560, h = 140, gap = 8, bw = (w - gap * (daily.length - 1)) / Math.max(1, daily.length)
  const summary = `Daily signups for the last ${daily.length} days: ${daily.map((d) => d.count).join(', ')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={summary} style={{ marginTop: 12 }}>
      {daily.map((d, i) => {
        const bh = Math.max(2, (d.count / max) * (h - 8))
        const last = i === daily.length - 1
        return <rect key={d.day} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} fill={last ? 'var(--accent)' : 'var(--bar)'}><title>{`${d.day}: ${d.count}`}</title></rect>
      })}
    </svg>
  )
}

export function Overview() {
  const stats = useLoad(() => api.stats(), [])
  const recent = useLoad(() => api.list({ q: '', language: '', provider: '', status: '' }, 5, 0), [])
  const s = stats.data
  const err = stats.error || recent.error
  const cards: [string, number | undefined][] = [['Total signups', s?.total], ['Today (UTC)', s?.today], ['Last 7 days', s?.last7], ['Removal requests', s?.removals]]
  return (
    <>
      <div className="row between wrap" style={{ marginBottom: 20 }}>
        <div><h1>Overview</h1><span className="mu">Waitlist activity. Times are UTC.</span></div>
        <button className="btn" type="button" onClick={() => { stats.reload(); recent.reload() }}>Refresh</button>
      </div>
      {err && <div className="msg err" role="alert">{err}</div>}
      <div className="g4">
        {cards.map(([name, n]) => (
          <div className="card pad" key={name}>
            <div className="mu">{name}</div>
            {stats.loading && !s ? <div className="skel" style={{ width: 80, marginTop: 14 }} /> : <div className="metric">{(n ?? 0).toLocaleString('en-GB')}</div>}
          </div>
        ))}
      </div>
      <div className="two">
        <div className="card pad"><h2>Signups, last 14 days</h2>{s ? <Chart daily={s.daily} /> : <div className="skel" style={{ height: 140, marginTop: 12 }} />}</div>
        <Breakdown title="By language" data={s?.by_language ?? {}} labels={LANGUAGE_LABELS} />
      </div>
      <div className="two" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <Breakdown title="By payment provider" data={s?.by_provider ?? {}} labels={PROVIDER_LABELS} />
        <div className="card">
          <div className="row between pad"><h2>Recent signups</h2><a className="link" href="#/waitlist">View all</a></div>
          <div className="tablewrap"><table className="tb" style={{ minWidth: 480 }}>
            <thead><tr><th>Email</th><th>Language</th><th>Provider</th><th>Joined</th></tr></thead>
            <tbody>
              {(recent.data?.rows ?? []).map((r) => (
                <tr key={r.id}><td>{r.email}</td><td>{label(LANGUAGE_LABELS, r.language)}</td><td>{label(PROVIDER_LABELS, r.payment_provider)}</td><td className="mono">{formatDate(r.created_at)}</td></tr>
              ))}
            </tbody>
          </table></div>
          {!recent.loading && (recent.data?.rows.length ?? 0) === 0 && <div className="empty">No signups yet. Share the waitlist link to get started.</div>}
        </div>
      </div>
    </>
  )
}
