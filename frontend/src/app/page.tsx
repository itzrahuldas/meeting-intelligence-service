'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/Layout';
import { meetingsApi, actionItemsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
  totalMeetings: number;
  totalActionItems: number;
  overdueItems: number;
  pendingItems: number;
}

function StatCard({ label, value, icon, color, href }: {
  label: string; value: number | string; icon: React.ReactNode; color: string; href?: string;
}) {
  const Card = (
    <div className={`glass rounded-2xl p-6 glow fade-in hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {href && (
          <svg className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{Card}</Link> : Card;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalMeetings: 0, totalActionItems: 0, overdueItems: 0, pendingItems: 0 });
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [meetingsData, actionItemsData, overdueData] = await Promise.all([
          meetingsApi.list({ page: 1, limit: 5 }),
          actionItemsApi.list({ limit: 1 }),
          actionItemsApi.getOverdue(),
        ]);
        setRecentMeetings(meetingsData.meetings || []);
        setStats({
          totalMeetings: meetingsData.pagination?.total || 0,
          totalActionItems: actionItemsData.pagination?.total || 0,
          overdueItems: Array.isArray(overdueData) ? overdueData.length : 0,
          pendingItems: 0,
        });
      } catch (e) { /* silently handle */ }
      finally { setLoadingStats(false); }
    })();
  }, []);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 fade-in">
          <h1 className="text-3xl font-bold text-white">
            Good morning, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-400 mt-1">Here&apos;s your meeting intelligence overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Meetings" value={loadingStats ? '—' : stats.totalMeetings}
            href="/meetings" color="bg-indigo-500/20"
            icon={<svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>}
          />
          <StatCard label="Action Items" value={loadingStats ? '—' : stats.totalActionItems}
            href="/action-items" color="bg-violet-500/20"
            icon={<svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Overdue Items" value={loadingStats ? '—' : stats.overdueItems}
            href="/action-items" color="bg-red-500/20"
            icon={<svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="AI Analyses" value={loadingStats ? '—' : recentMeetings.filter((m: any) => m.analysis).length + '+'}
            color="bg-emerald-500/20"
            icon={<svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
        </div>

        {/* Recent Meetings */}
        <div className="glass rounded-2xl p-6 glow fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Meetings</h2>
            <Link href="/meetings"
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors">
              View all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loadingStats ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-xl shimmer" />
              ))}
            </div>
          ) : recentMeetings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No meetings yet.</p>
              <Link href="/meetings"
                className="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all">
                Create your first meeting →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMeetings.map((meeting: any) => (
                <Link key={meeting.id} href={`/meetings/${meeting.id}`}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/60 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{meeting.title}</div>
                      <div className="text-xs text-gray-500">{new Date(meeting.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {meeting.participants?.length || 0} participants</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {meeting.analysis ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Analyzed
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400">
                        Pending
                      </span>
                    )}
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
