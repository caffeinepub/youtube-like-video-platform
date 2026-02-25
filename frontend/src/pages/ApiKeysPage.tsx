import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetApiKeys } from '../hooks/useGetApiKeys';
import { useCreateApiKey } from '../hooks/useCreateApiKey';
import { useRevokeApiKey } from '../hooks/useRevokeApiKey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Key, Copy, Check, Plus, Trash2, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { ApiKey } from '../backend';

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••••••';
  return key.slice(0, 4) + '••••••••••••••••' + key.slice(-4);
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 shrink-0">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

function ApiKeyRow({
  apiKey,
  onRevoke,
  isRevoking,
  isVisible,
  onToggleVisibility,
}: {
  apiKey: ApiKey;
  onRevoke: (key: string) => void;
  isRevoking: boolean;
  isVisible: boolean;
  onToggleVisibility: (key: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-sm truncate">
            {apiKey.apiLabel || <span className="text-muted-foreground italic">Unlabeled key</span>}
          </span>
          <Badge variant={apiKey.active ? 'default' : 'secondary'} className="text-xs shrink-0">
            {apiKey.active ? 'Active' : 'Revoked'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 pl-6">
          <p className="text-xs text-muted-foreground font-mono break-all">
            {isVisible ? apiKey.key : maskKey(apiKey.key)}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onToggleVisibility(apiKey.key)}
            title={isVisible ? 'Hide key' : 'Show key'}
          >
            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
          <CopyButton text={apiKey.key} />
        </div>
        <p className="text-xs text-muted-foreground pl-6 mt-0.5">Created {formatDate(apiKey.createdAt)}</p>
      </div>

      {apiKey.active && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Revoke
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revoke the key{' '}
                <span className="font-semibold">{apiKey.apiLabel || 'Unlabeled key'}</span>?
                This action cannot be undone. Any applications using this key will lose access immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRevoke(apiKey.key)}
                disabled={isRevoking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isRevoking ? 'Revoking...' : 'Revoke Key'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function NewKeyDisplay({ generatedKey, onDismiss }: { generatedKey: string; onDismiss: () => void }) {
  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Save your API key now</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This key will only be shown once. Copy it and store it somewhere safe.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs font-mono bg-background border border-border rounded px-3 py-2 break-all select-all">
          {generatedKey}
        </code>
        <CopyButton text={generatedKey} />
      </div>
      <Button variant="ghost" size="sm" onClick={onDismiss} className="w-full text-muted-foreground">
        I've saved my key, dismiss
      </Button>
    </div>
  );
}

export default function ApiKeysPage() {
  const { identity, login } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: apiKeys, isLoading } = useGetApiKeys();
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();

  const [label, setLabel] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  // Set of key strings that are currently visible (unmasked)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const handleCreate = async () => {
    const key = await createApiKey.mutateAsync(label.trim());
    setGeneratedKey(key);
    setLabel('');
  };

  const handleToggleVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl py-16 flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.55_0.28_340)] flex items-center justify-center shadow-lg">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">API Key Management</h1>
          <p className="text-muted-foreground">You need to be logged in to manage your API keys.</p>
        </div>
        <Button onClick={login} className="bg-gradient-to-r from-primary to-[oklch(0.55_0.28_340)] hover:opacity-90">
          Login to Continue
        </Button>
      </div>
    );
  }

  const activeKeys = (apiKeys ?? []).filter((k) => k.active);
  const revokedKeys = (apiKeys ?? []).filter((k) => !k.active);

  return (
    <div className="container max-w-3xl py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[oklch(0.55_0.28_340)] flex items-center justify-center shadow-md">
            <Key className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">API Keys</h1>
        </div>
        <p className="text-muted-foreground text-sm pl-13">
          Manage your API keys for programmatic access to Mediatube.
        </p>
      </div>

      {/* Generate New Key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Generate New API Key
          </CardTitle>
          <CardDescription>
            Create a new API key with an optional label to identify its purpose.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedKey && (
            <NewKeyDisplay
              generatedKey={generatedKey}
              onDismiss={() => setGeneratedKey(null)}
            />
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="key-label">Label (optional)</Label>
              <Input
                id="key-label"
                placeholder="e.g. My App, CI/CD Pipeline..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !createApiKey.isPending && handleCreate()}
                disabled={createApiKey.isPending}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                disabled={createApiKey.isPending}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-[oklch(0.55_0.28_340)] hover:opacity-90 gap-2"
              >
                {createApiKey.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Generate Key
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Keys</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${activeKeys.length} active key${activeKeys.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </>
          ) : activeKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active API keys. Generate one above to get started.</p>
            </div>
          ) : (
            activeKeys.map((apiKey) => (
              <ApiKeyRow
                key={apiKey.key}
                apiKey={apiKey}
                onRevoke={(key) => revokeApiKey.mutate(key)}
                isRevoking={revokeApiKey.isPending}
                isVisible={visibleKeys.has(apiKey.key)}
                onToggleVisibility={handleToggleVisibility}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <Card className="opacity-70">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Revoked Keys</CardTitle>
            <CardDescription>{revokedKeys.length} revoked key{revokedKeys.length !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {revokedKeys.map((apiKey) => (
              <ApiKeyRow
                key={apiKey.key}
                apiKey={apiKey}
                onRevoke={(key) => revokeApiKey.mutate(key)}
                isRevoking={revokeApiKey.isPending}
                isVisible={visibleKeys.has(apiKey.key)}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
