import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMonetizationStats } from '../hooks/useGetMonetizationStats';
import { useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingUp, CheckCircle, XCircle, RefreshCw, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function formatCurrency(value: bigint): string {
  const num = Number(value);
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

export default function MonetizationPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useGetMonetizationStats();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-mt-magenta/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-mt-magenta" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign in to view Monetization</h2>
        <p className="text-yt-text-secondary text-sm text-center max-w-xs">
          You need to be signed in to access your monetization dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-mt-magenta" />
            Monetization Dashboard
          </h1>
          <p className="text-yt-text-secondary text-sm mt-1">
            Track your earnings and revenue from your content.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['monetizationStats'] });
            refetch();
          }}
          className="border-yt-border text-yt-text-secondary hover:text-white hover:bg-yt-chip gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 mb-6 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-red-300 text-sm font-medium">Failed to load monetization stats</p>
            <p className="text-red-400/70 text-xs mt-0.5">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="ml-auto text-red-300 hover:text-red-200 hover:bg-red-900/30"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Total Earnings */}
        <Card className="bg-yt-surface border-yt-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-yt-text-secondary flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-mt-magenta" />
              Total Earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-32 bg-yt-chip" />
            ) : (
              <p className="text-3xl font-bold text-white">
                {data ? formatCurrency(data.totalEarnings) : '—'}
              </p>
            )}
            <p className="text-xs text-yt-text-secondary mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>

        {/* Estimated Monthly Revenue */}
        <Card className="bg-yt-surface border-yt-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-yt-text-secondary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-mt-pink" />
              Est. Monthly Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-24 bg-yt-chip" />
            ) : (
              <p className="text-3xl font-bold text-white">
                {data ? formatCurrency(data.estimatedRevenue) : '—'}
              </p>
            )}
            <p className="text-xs text-yt-text-secondary mt-1">Based on current performance</p>
          </CardContent>
        </Card>

        {/* Monetization Status */}
        <Card className="bg-yt-surface border-yt-border">
          <CardHeader className="pb-2">
            <CardDescription className="text-yt-text-secondary flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-mt-cyan" />
              Monetization Status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24 bg-yt-chip" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                {data?.monetizationStatus?.toLowerCase() === 'enabled' ? (
                  <Badge className="bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge className="bg-yt-chip text-yt-text-secondary border border-yt-border hover:bg-yt-chip">
                    <XCircle className="w-3 h-3 mr-1" />
                    {data?.monetizationStatus || 'Disabled'}
                  </Badge>
                )}
              </div>
            )}
            <p className="text-xs text-yt-text-secondary mt-2">Current account status</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Placeholder */}
      <Card className="bg-yt-surface border-yt-border">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-mt-pink" />
            Revenue Analytics
          </CardTitle>
          <CardDescription className="text-yt-text-secondary">
            Detailed revenue charts and analytics coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex flex-col items-center justify-center rounded-xl border border-dashed border-yt-border gap-3">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-48 bg-yt-chip" />
                <Skeleton className="h-4 w-32 bg-yt-chip" />
              </>
            ) : (
              <>
                <TrendingUp className="w-8 h-8 text-yt-text-secondary/40" />
                <p className="text-yt-text-secondary text-sm">Analytics charts will appear here</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <div className="mt-6 p-4 rounded-xl bg-mt-magenta/10 border border-mt-magenta/20">
        <p className="text-sm text-mt-pink font-medium mb-1">About Monetization</p>
        <p className="text-xs text-yt-text-secondary leading-relaxed">
          Monetization allows eligible creators to earn revenue from their content on Mediatube and Photo.
          Earnings are calculated based on views, engagement, and ad performance. Stats shown are estimates
          and may vary from final payouts.
        </p>
      </div>
    </div>
  );
}
