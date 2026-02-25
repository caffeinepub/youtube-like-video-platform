import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useIsCallerAdmin';
import { useGetAdminDashboard } from '../hooks/useGetAdminDashboard';
import { useAdminRemoveVideo } from '../hooks/useAdminRemoveVideo';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Users,
  Video,
  BarChart3,
  Trash2,
  Loader2,
  Eye,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { getInitials, convertBlobToDataURL } from '../utils/avatarHelpers';
import type { VideoMetadata, UserProfile } from '../backend';

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatViews(count: bigint): string {
  const n = Number(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function RemoveVideoButton({ video }: { video: VideoMetadata }) {
  const { mutate: removeVideo, isPending } = useAdminRemoveVideo();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1.5" disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Video</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>"{video.title}"</strong>? This action cannot be
            undone and will also delete all associated comments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => removeVideo(video.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove Video
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminDashboardPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
  const { data: dashboard, isLoading: dashboardLoading } = useGetAdminDashboard();

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Authentication Required</h1>
        <p className="text-muted-foreground">Please log in to access the Admin Dashboard.</p>
      </div>
    );
  }

  // Checking admin status
  if (adminCheckLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to access the Admin Dashboard. This area is restricted to
          administrators only.
        </p>
      </div>
    );
  }

  const analytics = dashboard?.analytics;
  const users = dashboard?.users ?? [];
  const videos = dashboard?.videos ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage Mediatube platform</p>
        </div>
      </div>

      {/* Analytics Cards */}
      {dashboardLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6 text-blue-600" />}
            label="Total Users"
            value={Number(analytics.totalUsers).toLocaleString()}
            color="bg-blue-500/10"
          />
          <StatCard
            icon={<Video className="w-6 h-6 text-primary" />}
            label="Total Videos"
            value={Number(analytics.totalVideos).toLocaleString()}
            color="bg-primary/10"
          />
          <StatCard
            icon={<MessageSquare className="w-6 h-6 text-green-600" />}
            label="Total Comments"
            value={Number(analytics.totalComments).toLocaleString()}
            color="bg-green-500/10"
          />
          <StatCard
            icon={<Eye className="w-6 h-6 text-amber-600" />}
            label="Total Views"
            value={formatViews(analytics.totalViews)}
            color="bg-amber-500/10"
          />
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="w-4 h-4" />
            Video Moderation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold text-foreground">
                All Users{' '}
                <Badge variant="secondary" className="ml-2">
                  {users.length}
                </Badge>
              </h2>
            </div>
            {dashboardLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Channel Description</TableHead>
                    <TableHead>Avatar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: UserProfile, idx: number) => {
                    const avatarSrc =
                      user.avatar && user.avatar.length > 0
                        ? convertBlobToDataURL(user.avatar)
                        : undefined;
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              {avatarSrc && (
                                <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover rounded-full" />
                              )}
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{user.name || 'Unnamed User'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {user.channelDescription || '—'}
                        </TableCell>
                        <TableCell>
                          {avatarSrc ? (
                            <Badge variant="secondary">Has Avatar</Badge>
                          ) : (
                            <Badge variant="outline">No Avatar</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Video Moderation Tab */}
        <TabsContent value="videos">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold text-foreground">
                All Videos{' '}
                <Badge variant="secondary" className="ml-2">
                  {videos.length}
                </Badge>
              </h2>
            </div>
            {dashboardLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No videos found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Uploader</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.map((video: VideoMetadata) => (
                      <TableRow key={video.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {video.title}
                        </TableCell>
                        <TableCell>
                          {video.isShort ? (
                            <Badge variant="secondary">Short</Badge>
                          ) : (
                            <Badge variant="outline">Video</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {formatViews(video.viewCount)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(video.uploadDate)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono max-w-[120px] truncate">
                          {video.uploader.toString().slice(0, 12)}…
                        </TableCell>
                        <TableCell className="text-right">
                          <RemoveVideoButton video={video} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold text-foreground">Platform Analytics</h2>
            </div>
            {dashboardLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : analytics ? (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="font-medium text-foreground">Registered Users</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {Number(analytics.totalUsers).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total user profiles created</p>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">Total Videos</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {Number(analytics.totalVideos).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Videos uploaded to the platform</p>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-foreground">Total Comments</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {Number(analytics.totalComments).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Comments across all videos</p>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="font-medium text-foreground">Total Views</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {Number(analytics.totalViews).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Cumulative video views</p>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No analytics data available</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
