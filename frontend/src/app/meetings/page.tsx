'use client';
import { useEffect, useState, useCallback } from 'react';
import { AuthGuard } from '@/components/Layout';
import { meetingsApi } from '@/lib/api';
import Link from 'next/link';

function CreateMeetingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    participants: '',
    meetingDate: new Date().toISOString().slice(0, 16),
    transcriptRaw: '',
  });

  const parseTranscript = () => {
    return form.transcriptRaw.split('\n').filter(l => l.trim()).map((line, i) => {
      const match = line.match(/^\[?(\d{2}:\d{2}(?::\d{2})?)\]?\s*([^:]+):\s*(.+)$/);
      if (match) return { timestamp: match[1], speaker: match[2].trim(), text: match[3].trim() };
      return { timestamp: `00:${String(i).padStart(2, '0')}`, speaker: 'Unknown', text: line.trim() };
    });
  };

  const handleSubmit = async () => {
    setError('');
    const transcript = parseTranscript();
    if (transcript.length === 0) { setError('Please enter at least one transcript line.'); return; }
    setLoading(true);
    try {
      await meetingsApi.create({
        title: form.title,
        participants: form.participants.split(',').map(p => p.trim()).filter(Boolean),
        meetingDate: new Date(form.meetingDate).toISOString(),
        transcript,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error?.message || 'Failed to create meeting.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="glass rounded-2xl w-full max-w-2xl glow fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">New Meeting</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Meeting Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Q3 Planning Meeting" required
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Participants (comma-separated) *</label>
                <input value={form.participants} onChange={e => setForm({...form, participants: e.target.value})}
                  placeholder="Alice, Bob, Charlie"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Meeting Date & Time *</label>
                <input type="datetime-local" value={form.meetingDate} onChange={e => setForm({...form, meetingDate: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700 text-white focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Meeting Transcript *</label>
              <p className="text-xs text-gray-500 mb-3">Format: <code className="bg-gray-800 px-1 rounded">00:05 Alice: We should finalize the budget.</code></p>
              <textarea
                value={form.transcriptRaw}
                onChange={e => setForm({...form, transcriptRaw: e.target.value})}
                rows={12} placeholder={`00:01 Alice: We need to finalize the Q3 budget by Friday.\n00:03 Bob: I can take ownership of the budget report.\n00:05 Charlie: Let's schedule a review on Thursday.`}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all font-mono text-sm resize-none"
              />
              <p className="text-xs text-gray-600 mt-2">Lines parsed: {parseTranscript().length}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-800">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all">← Back</button>
          ) : <div />}
          {step === 1 ? (
            <button onClick={() => { if (!form.title.trim()) { setError('Title is required.'); return; } setError(''); setStep(2); }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Next: Add Transcript →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: loading ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {loading ? 'Creating...' : 'Create Meeting ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchMeetings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await meetingsApi.list({ page, limit: 10, search: search || undefined });
      setMeetings(data.meetings || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (e) { /* handle */ }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchMeetings(1); }, [fetchMeetings]);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white">Meetings</h1>
            <p className="text-gray-400 mt-1">{pagination.total} meetings total</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all glow"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Meeting
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-900/60 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden glow fade-in">
          {loading ? (
            <div className="space-y-px">
              {[1,2,3,4,5].map(i => <div key={i} className="h-20 shimmer" />)}
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                </svg>
              </div>
              <p className="text-gray-500">No meetings found. Create your first one!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800/60">
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Participants</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {meetings.map((m: any) => (
                      <tr key={m.id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white text-sm">{m.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{m._count?.actionItems || 0} action items</div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="text-sm text-gray-300">{new Date(m.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(m.participants || []).slice(0, 3).map((p: string) => (
                              <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">{p}</span>
                            ))}
                            {(m.participants || []).length > 3 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">+{m.participants.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {m.analysis ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Analyzed</span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-700/60 text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/meetings/${m.id}`}
                            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium opacity-0 group-hover:opacity-100 transition-all">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/60">
                  <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => fetchMeetings(pagination.page - 1)} disabled={pagination.page <= 1}
                      className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 transition-all">← Prev</button>
                    <button onClick={() => fetchMeetings(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 transition-all">Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && <CreateMeetingModal onClose={() => setShowModal(false)} onCreated={() => fetchMeetings(1)} />}
    </AuthGuard>
  );
}
