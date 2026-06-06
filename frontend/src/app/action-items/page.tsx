'use client';
import { useEffect, useState, useCallback } from 'react';
import { AuthGuard } from '@/components/Layout';
import { actionItemsApi } from '@/lib/api';

const STATUS_OPTIONS = ['', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full border ${styles[status] || 'bg-gray-700 text-gray-400'}`}>{status.replace('_', ' ')}</span>;
}

function UpdateStatusModal({ item, onClose, onUpdated }: { item: any; onClose: () => void; onUpdated: () => void }) {
  const [status, setStatus] = useState(item.status);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await actionItemsApi.updateStatus(item.id, status);
      onUpdated();
      onClose();
    } catch (e) { /* handle */ }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="glass rounded-2xl w-full max-w-sm glow fade-in p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Update Status</h3>
        <p className="text-sm text-gray-400 mb-5 line-clamp-2">{item.task}</p>
        <div className="space-y-2 mb-6">
          {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${status === s ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300' : 'bg-gray-800/60 border border-gray-700 text-gray-400 hover:text-white'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition-all">Cancel</button>
          <button onClick={handleUpdate} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActionItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'overdue'>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const [allData, overdueData] = await Promise.all([
        actionItemsApi.list({ page, limit: 20, status: filter || undefined }),
        actionItemsApi.getOverdue(),
      ]);
      setItems(allData.actionItems || []);
      setPagination(allData.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      setOverdueItems(Array.isArray(overdueData) ? overdueData : []);
    } catch (e) { /* handle */ }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchItems(1); }, [fetchItems]);

  const displayItems = activeTab === 'overdue' ? overdueItems : items;

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white">Action Items</h1>
            <p className="text-gray-400 mt-1">
              {pagination.total} total · <span className="text-red-400">{overdueItems.length} overdue</span>
            </p>
          </div>
        </div>

        {/* Tabs + Filter Row */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex gap-1 bg-gray-900/60 rounded-xl p-1">
            <button onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              All Items ({pagination.total})
            </button>
            <button onClick={() => setActiveTab('overdue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'overdue' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              <span className="w-2 h-2 rounded-full bg-red-400 pulse-dot" />
              Overdue ({overdueItems.length})
            </button>
          </div>

          {activeTab === 'all' && (
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm bg-gray-900/60 border border-gray-800 text-gray-300 focus:outline-none focus:border-indigo-500 transition-all">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          )}
        </div>

        {/* Items Table */}
        <div className="glass rounded-2xl overflow-hidden glow fade-in">
          {loading ? (
            <div className="space-y-px">
              {[1,2,3,4,5].map(i => <div key={i} className="h-20 shimmer" />)}
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500">
                {activeTab === 'overdue' ? '🎉 No overdue items!' : 'No action items found.'}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800/60">
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Assignee</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Meeting</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Due Date</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {displayItems.map((item: any) => {
                    const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'COMPLETED';
                    return (
                      <tr key={item.id} className="hover:bg-gray-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-sm text-white font-medium max-w-sm">{item.task}</div>
                          {item.citations?.length > 0 && (
                            <span className="text-xs text-indigo-400 mt-0.5 inline-block">📎 {item.citations.length} citation{item.citations.length !== 1 ? 's' : ''}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                              {item.assignee?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-300">{item.assignee}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-xs text-gray-500">{item.meeting?.title || '—'}</span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {item.dueDate ? (
                            <span className={`text-xs ${isOverdue ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                              {isOverdue && '⚠️ '}{new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                        <td className="px-6 py-4 text-right">
                          {item.status !== 'COMPLETED' && (
                            <button onClick={() => setSelectedItem(item)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium opacity-0 group-hover:opacity-100 transition-all">
                              Update →
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {activeTab === 'all' && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800/60">
                  <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => fetchItems(pagination.page - 1)} disabled={pagination.page <= 1}
                      className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 transition-all">← Prev</button>
                    <button onClick={() => fetchItems(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 transition-all">Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedItem && (
        <UpdateStatusModal item={selectedItem} onClose={() => setSelectedItem(null)} onUpdated={() => fetchItems(pagination.page)} />
      )}
    </AuthGuard>
  );
}
