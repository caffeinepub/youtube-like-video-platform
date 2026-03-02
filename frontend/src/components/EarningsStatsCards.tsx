import React from 'react';
import { useGetAdminEarningsStats } from '../hooks/useGetAdminEarningsStats';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Clock, Users, RefreshCw } from 'lucide-react';

interface EarningsStatsCardsProps {
  stats?: {
    totalBalanceCents: bigint;
    totalWithdrawalsCents: bigint;
    pendingWithdrawalsCents: bigint;
    numPendingWithdrawals: bigint;
    numCompletedWithdrawals: bigint;
    numCreators: bigint;
  };
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export default function EarningsStatsCards({ stats, isLoading, error, onRetry }: EarningsStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-mt-charcoal-800 rounded-xl p-4 border border-mt-charcoal-700">
            <Skeleton className="h-4 w-2/3 bg-mt-charcoal-700 mb-3" />
            <Skeleton className="h-8 w-1/2 bg-mt-charcoal-700" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-mt-charcoal-800 rounded-xl p-6 border border-mt-charcoal-700 text-center">
        <p className="text-mt-charcoal-400 text-sm mb-3">Failed to load earnings stats</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 mx-auto text-mt-red-400 hover:text-mt-red-300 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        )}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: 'Total Balance',
      value: `$${(Number(stats.totalBalanceCents) / 100).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-mt-red-400',
      bg: 'bg-mt-red-500/10',
    },
    {
      label: 'Total Withdrawn',
      value: `$${(Number(stats.totalWithdrawalsCents) / 100).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Pending Withdrawals',
      value: `$${(Number(stats.pendingWithdrawalsCents) / 100).toFixed(2)}`,
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Creators',
      value: stats.numCreators.toString(),
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-mt-charcoal-800 rounded-xl p-4 border border-mt-charcoal-700 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span className="text-xs text-mt-charcoal-400 font-medium">{label}</span>
          </div>
          <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
