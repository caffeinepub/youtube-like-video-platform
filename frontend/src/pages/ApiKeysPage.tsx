import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGetApiKeys } from '../hooks/useGetApiKeys';
import { useCreateApiKey } from '../hooks/useCreateApiKey';
import { useRevokeApiKey } from '../hooks/useRevokeApiKey';
import { Key, Plus, Eye, EyeOff, Copy, Check, Trash2, LogIn, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from '@tanstack/react-router';
import type { ApiKey } from '../backend';

function maskKey(key: string): string {
  if (key.length <= 12) return '••••••••••••';
  return key.substring(0, 6) + '••••••••••••' + key.substring(key.length - 4);
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface ApiKeyRowProps {
  apiKey: ApiKey;
  onRevoke: (key: string) => void;
  isRevoking: boolean;
}

function ApiKeyRow({ apiKey, onRevoke, isRevoking }: ApiKeyRowProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm truncate">{apiKey.apiLabel}</span>
          <Badge variant={apiKey.active ? 'default' : 'secondary'} className="text-xs shrink-0">
            {apiKey.active ? 'Active' : 'Revoked'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-xs">
            {visible ? apiKey.key : maskKey(apiKey.key)}
          </code>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Created {formatDate(apiKey.createdAt)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVisible(!visible)}
          title={visible ? 'Hide key' : 'Show key'}
          className="h-8 w-8"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          title="Copy key"
          className="h-8 w-8"
          disabled={!apiKey.active}
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
        {apiKey.active && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Revoke key"
                disabled={isRevoking}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to revoke the key <strong>"{apiKey.apiLabel}"</strong>?
                  This action cannot be undone. Any applications using this key will lose access immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onRevoke(apiKey.key)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Revoke Key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

const CODE_EXAMPLES = {
  curl: (key: string) => `curl -X GET "https://api.mediatube.app/v1/videos" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json"`,
  javascript: (key: string) => `const response = await fetch('https://api.mediatube.app/v1/videos', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ${key}',
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
console.log(data);`,
  python: (key: string) => `import requests

headers = {
    'Authorization': 'Bearer ${key}',
    'Content-Type': 'application/json',
}

response = requests.get('https://api.mediatube.app/v1/videos', headers=headers)
data = response.json()
print(data)`,
};

export default function ApiKeysPage() {
  const { identity } = useInternetIdentity();
  const { googleUser } = useGoogleAuth();
  const navigate = useNavigate();

  const isAuthenticated = !!identity || !!googleUser;

  const [newLabel, setNewLabel] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedExample, setCopiedExample] = useState(false);

  const { data: apiKeys, isLoading } = useGetApiKeys();
  const { mutate: createApiKey, isPending: creating } = useCreateApiKey();
  const { mutate: revokeApiKey, isPending: revoking } = useRevokeApiKey();

  const handleCreate = () => {
    if (!newLabel.trim()) return;
    createApiKey(newLabel.trim(), {
      onSuccess: (key: string) => {
        setNewKeyValue(key);
        setNewLabel('');
      },
    });
  };

  const handleRevoke = (key: string) => {
    revokeApiKey(key);
  };

  const handleCopyExample = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedExample(true);
      setTimeout(() => setCopiedExample(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Key className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Sign in to manage API keys</h2>
          <p className="text-muted-foreground mb-6">
            Create and manage API keys to integrate Mediatube into your applications.
          </p>
          <Button onClick={() => navigate({ to: '/login' })} className="gap-2">
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const exampleKey = newKeyValue ?? (apiKeys?.find(k => k.active)?.key ?? 'YOUR_API_KEY');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">API Keys</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your API keys to integrate Mediatube into your applications and services.
        </p>
      </div>

      {/* Create New Key */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create New API Key</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="key-label" className="sr-only">Key Label</Label>
            <Input
              id="key-label"
              placeholder="e.g. My App, Production, Development..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              disabled={creating}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!newLabel.trim() || creating}
            className="gap-2 shrink-0"
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create Key
          </Button>
        </div>

        {/* Newly created key banner */}
        {newKeyValue && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  API key created successfully!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Copy this key now — it won't be shown again in full.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded break-all">
                {newKeyValue}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(newKeyValue);
                  setCopiedExample(true);
                  setTimeout(() => setCopiedExample(false), 2000);
                }}
                className="shrink-0 gap-1"
              >
                {copiedExample ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Keys List */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Your API Keys</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : !apiKeys || apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
            <Key className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No API keys yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first API key above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <ApiKeyRow
                key={key.key}
                apiKey={key}
                onRevoke={handleRevoke}
                isRevoking={revoking}
              />
            ))}
          </div>
        )}
      </div>

      {/* How to use section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2">How to use your API key</h2>
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Keep your API keys secure. Never expose them in client-side code or public repositories.
            Treat them like passwords.
          </p>
        </div>

        <Tabs defaultValue="curl">
          <TabsList className="mb-4">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>

          {(['curl', 'javascript', 'python'] as const).map((lang) => (
            <TabsContent key={lang} value={lang}>
              <div className="relative">
                <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {CODE_EXAMPLES[lang](exampleKey)}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => handleCopyExample(CODE_EXAMPLES[lang](exampleKey))}
                  title="Copy code"
                >
                  {copiedExample ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Quick Start */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3">Quick Start Guide</h3>
          <ol className="space-y-2">
            {[
              { step: '1', text: 'Create an API key with a descriptive label above.' },
              { step: '2', text: 'Include the key in the Authorization header of your requests.' },
              { step: '3', text: 'Use the Mediatube API to upload videos, manage playlists, and more.' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </span>
                <p className="text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
