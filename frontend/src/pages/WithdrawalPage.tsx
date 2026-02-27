import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCreatorBankAccountState } from '../hooks/useGetCreatorBankAccountState';
import { useRequestWithdrawal } from '../hooks/useRequestWithdrawal';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineErrorState from '../components/OfflineErrorState';
import { WithdrawalStatus } from '../backend';
import {
  Wallet,
  Lock,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatCents(cents: bigint): string {
  const dollars = Number(cents) / 100;
  return dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: WithdrawalStatus }) {
  if (status === WithdrawalStatus.pending) {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 gap-1">
        <Clock className="w-3 h-3" />
        Pending
      </Badge>
    );
  }
  if (status === WithdrawalStatus.approved) {
    return (
      <Badge className="bg-green-500/20 text-green-400 border border-green-500/40 gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Approved
      </Badge>
    );
  }
  return (
    <Badge className="bg-muted text-muted-foreground border border-border gap-1">
      <XCircle className="w-3 h-3" />
      Cancelled
    </Badge>
  );
}

export default function WithdrawalPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isOnline = useNetworkStatus();

  const { data: accountState, isLoading, error, refetch } = useGetCreatorBankAccountState();
  const { mutate: requestWithdrawal, isPending: isSubmitting } = useRequestWithdrawal();

  const [amountInput, setAmountInput] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-mt-magenta/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-mt-magenta" />
        </div>
        <h2 className="text-xl font-bold">Sign in to access Withdrawals</h2>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          You need to be signed in to view your dollar bank account and request withdrawals.
        </p>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <OfflineErrorState
        onRetry={() => refetch()}
        message="Unable to load your account. Please check your internet connection."
      />
    );
  }

  const balanceCents = accountState?.balanceCents ?? 0n;
  const withdrawals = accountState?.withdrawals ?? [];
  const hasPending = withdrawals.some((w) => w.status === WithdrawalStatus.pending);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const dollars = parseFloat(amountInput);
    if (isNaN(dollars) || dollars <= 0) {
      setValidationError('Please enter a valid amount greater than $0.00.');
      return;
    }

    const cents = BigInt(Math.round(dollars * 100));
    if (cents > balanceCents) {
      setValidationError(
        `Amount exceeds your available balance of ${formatCents(balanceCents)}.`
      );
      return;
    }

    requestWithdrawal(cents, {
      onSuccess: () => {
        setAmountInput('');
        setValidationError('');
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-7 h-7 text-mt-magenta" />
          Dollar Bank Account
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your earnings and request USD withdrawals.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-destructive text-sm font-medium">Failed to load account data</p>
            <p className="text-destructive/70 text-xs mt-0.5">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-destructive hover:text-destructive shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Balance Card */}
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4 text-mt-magenta" />
              Available Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-36" />
            ) : (
              <p className="text-4xl font-bold tracking-tight">
                {formatCents(balanceCents)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">USD · Ready to withdraw</p>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-mt-magenta" />
              Request Withdrawal
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Enter the amount in USD you wish to withdraw. Minimum $0.01.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPending && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
                <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300">
                  You have a pending withdrawal request. You can submit a new one once it is processed.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="withdrawal-amount" className="text-sm">
                  Amount (USD)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                    $
                  </span>
                  <Input
                    id="withdrawal-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      setValidationError('');
                    }}
                    className="pl-7"
                    disabled={isSubmitting || hasPending || isLoading}
                  />
                </div>
                {validationError && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {validationError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || hasPending || isLoading || !amountInput}
                className="w-full gap-2 bg-mt-magenta hover:bg-mt-magenta/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Request Withdrawal
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-mt-pink" />
            Withdrawal History
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            All past and pending withdrawal requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Wallet className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No withdrawals yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Your withdrawal history will appear here once you submit your first request.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs font-medium">Amount</TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium">Date</TableHead>
                    <TableHead className="text-muted-foreground text-xs font-medium text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...withdrawals]
                    .sort((a, b) => Number(b.timestamp - a.timestamp))
                    .map((withdrawal, idx) => (
                      <TableRow key={idx} className="border-border hover:bg-muted/30">
                        <TableCell className="font-semibold text-sm">
                          {formatCents(withdrawal.amountCents)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(withdrawal.timestamp)}
                        </TableCell>
                        <TableCell className="text-right">
                          <StatusBadge status={withdrawal.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="mt-6 p-4 rounded-xl bg-mt-magenta/10 border border-mt-magenta/20">
        <p className="text-sm text-mt-pink font-medium mb-1">About Withdrawals</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Withdrawal requests are reviewed and processed by our team. Approved withdrawals are
          deducted from your available balance. Only one pending withdrawal is allowed at a time.
          Processing typically takes 1–3 business days.
        </p>
      </div>
    </div>
  );
}
