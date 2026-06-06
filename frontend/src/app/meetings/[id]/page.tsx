'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/Layout';
import { meetingsApi } from '@/lib/api';
import Link from 'next/link';

function CitationPill({ c }: { c: { timestamp: string; speaker: string; text: string } }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 cursor-help" title={`${c.speaker}: ${c.text}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      {c.timestamp} · {c.speaker}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full border ${styles[status] || 'bg-gray-700 text-gray-400'}`}>{status.replace('_', ' ')}</span>;
}

export default function MeetingDetailPage() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'analysis' | 'actions'>('transcript');
  const [error, setError] = useState('');

  const fetchMeeting = async () => {
    try {
      const data = await meetingsApi.get(id as string);
      setMeeting(data);
      if (data.analysis) setActiveTab('analysis');
    } catch (e) { setError('Meeting not found.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMeeting(); }, [id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await meetingsApi.analyze(id as string);
      await fetchMeeting();
    } catch (e: any) {
      setError(e.response?.data?.error?.message || 'AI analysis failed.');
    } finally { setAnalyzing(false); }
  };

  if (loading) return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="h-10 w-64 shimmer rounded-xl mb-6" />
        <div className="glass rounded-2xl p-6 glow"><div className="h-64 shimmer rounded-xl" /></div>
      </div>
    </AuthGuard>
  );

  if (error && !meeting) return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-red-400">{error}</p>
        <Link href="/meetings" className="text-indigo-400 hover:underline mt-4 inline-block">← Back to meetings</Link>
      </div>
    </AuthGuard>
  );

  const transcript: any[] = Array.isArray(meeting?.transcript) ? meeting.transcript : [];
  const analysis = meeting?.analysis;
  const actionItems: any[] = meeting?.actionItems || [];

  return (
    <AuthGuard>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 fade-in">
          <Link href="/meetings" className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Meetings
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-white">{meeting?.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-sm text-gray-400">{new Date(meeting?.meetingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-gray-700">·</span>
                <div className="flex flex-wrap gap-1">
                  {(meeting?.participants || []).map((p: string) => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">{p}</span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleAnalyze} disabled={analyzing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all glow flex-shrink-0"
              style={{ background: analyzing ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {analyzing ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Analyzing...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>{analysis ? 'Re-analyze' : 'Analyze with AI'}</>
              )}
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900/60 rounded-xl p-1 w-fit">
          {(['transcript', 'analysis', 'actions'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200
                ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
              {tab === 'actions' ? `Action Items (${actionItems.length})` : tab}
              {tab === 'analysis' && !analysis && <span className="ml-1.5 text-xs text-gray-600">(run AI)</span>}
            </button>
          ))}
        </div>

        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <div className="glass rounded-2xl p-6 glow fade-in">
            <div className="space-y-3">
              {transcript.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transcript available.</p>
              ) : transcript.map((entry: any, i: number) => (
                <div key={i} className="flex gap-4 group hover:bg-gray-800/30 rounded-xl p-3 transition-colors">
                  <div className="flex-shrink-0 text-xs font-mono text-indigo-400 w-14 pt-0.5">{entry.timestamp}</div>
                  <div>
                    <span className="text-xs font-semibold text-gray-300">{entry.speaker}</span>
                    <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 fade-in">
            {!analysis ? (
              <div className="glass rounded-2xl p-12 glow text-center">
                <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <p className="text-gray-400 mb-4">No analysis yet. Click &quot;Analyze with AI&quot; to generate insights.</p>
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  Analyze Now
                </button>
              </div>
            ) : (
              <>
                {/* Summary */}
                {analysis.summary && (
                  <div className="glass rounded-2xl p-6 glow">
                    <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
                      Summary
                    </h3>
                    {Array.isArray(analysis.summary) ? (
                      <div className="space-y-4">
                        {analysis.summary.map((s: any, i: number) => (
                          <div key={i}>
                            <p className="text-gray-300 text-sm leading-relaxed mb-2">{s.text || s.overview}</p>
                            {s.keyTopics?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {s.keyTopics.map((t: string, k: number) => (
                                  <span key={k} className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">{t}</span>
                                ))}
                              </div>
                            )}
                            {s.citations?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {s.citations.map((c: any, j: number) => <CitationPill key={j} c={c} />)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {analysis.summary.overview && <p className="text-gray-300 text-sm leading-relaxed mb-4">{analysis.summary.overview}</p>}
                        {analysis.summary.keyTopics?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {analysis.summary.keyTopics.map((t: string, i: number) => (
                              <span key={i} className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">{t}</span>
                            ))}
                          </div>
                        )}
                        {analysis.summary.citations?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {analysis.summary.citations.map((c: any, i: number) => <CitationPill key={i} c={c} />)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {/* Decisions */}
                {analysis.decisions?.length > 0 && (
                  <div className="glass rounded-2xl p-6 glow">
                    <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-4">✅ Decisions Made</h3>
                    <div className="space-y-3">
                      {analysis.decisions.map((d: any, i: number) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-violet-500/20 flex-shrink-0 flex items-center justify-center text-xs text-violet-400">{i+1}</div>
                          <div>
                            <p className="text-sm text-gray-300">{d.decision}</p>
                            {d.madeBy && <p className="text-xs text-gray-500 mt-0.5">by {d.madeBy}</p>}
                            <div className="flex flex-wrap gap-1 mt-1">{d.citations?.map((c: any, j: number) => <CitationPill key={j} c={c} />)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Follow-ups */}
                {analysis.followUps?.length > 0 && (
                  <div className="glass rounded-2xl p-6 glow">
                    <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">🔄 Follow-ups</h3>
                    <div className="space-y-3">
                      {analysis.followUps.map((f: any, i: number) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center text-xs text-amber-400">{i+1}</div>
                          <div>
                            <p className="text-sm text-gray-300">{f.task || f.text}</p>
                            {f.assignee && <p className="text-xs text-gray-500 mt-0.5">→ {f.assignee}</p>}
                            <div className="flex flex-wrap gap-1 mt-1">{f.citations?.map((c: any, j: number) => <CitationPill key={j} c={c} />)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Action Items Tab */}
        {activeTab === 'actions' && (
          <div className="glass rounded-2xl overflow-hidden glow fade-in">
            {actionItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No action items yet. Run AI analysis to generate them.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/40">
                {actionItems.map((item: any) => (
                  <div key={item.id} className="p-4 flex items-start justify-between gap-4 hover:bg-gray-800/20 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.task}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-500">👤 {item.assignee}</span>
                        {item.dueDate && <span className="text-xs text-gray-500">📅 {new Date(item.dueDate).toLocaleDateString()}</span>}
                        {item.citations?.length > 0 && (
                          <div className="flex flex-wrap gap-1">{item.citations.slice(0,2).map((c: any, i: number) => <CitationPill key={i} c={c} />)}</div>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
