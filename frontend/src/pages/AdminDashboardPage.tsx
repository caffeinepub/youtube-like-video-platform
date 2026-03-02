import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  Video,
  DollarSign,
  Eye,
  MessageSquare,
  Trash2,
  Edit,
  LogOut,
  Menu,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useGetAdminDashboard } from '../hooks/useGetAdminDashboard';
import { useAdminRemoveVideo } from '../hooks/useAdminRemoveVideo';
import { useGetAdminEarningsStats } from '../hooks/useGetAdminEarningsStats';
import { useIsCallerAdmin } from '../hooks/useIsCallerAdmin';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EditUserModal from '../components/EditUserModal';
import EarningsStatsCards from '../components/EarningsStatsCards';
import type { UserProfile, VideoMetadata } from '../backend';
import { Principal } from '@dfinity/principal';
import { formatViewCount } from '../utils/formatters';
import { convertBlobToDataURL, getInitials } from '../utils/avatarHelpers';

type AdminSection = 'dashboard' | 'users' | 'videos' | 'earnings';

const navItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'users', label: 'Users', icon: <Users size={18} /> },
  { id: 'videos', label: 'Videos', icon: <Video size={18} /> },
  { id: 'earnings', label: 'Earnings', icon: <DollarSign size={18} /> },
];

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: 'teal' | 'violet' | 'blue' | 'amber';
}) {
  const accentClasses: Record<string, string> = {
    teal: 'bg-admin-teal/10 text-admin-teal',
    violet: 'bg-admin-violet/10 text-admin-violet',
    blue: 'bg-blue-500/10 text-blue-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <div className="admin-card rounded-xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${accentClasses[accent]}`}>{icon}</div>
      <div>
        <p className="text-admin-muted text-sm font-medium">{label}</p>
        <p className="text-admin-text text-2xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function UserRow({
  user,
  index,
  onEdit,
}: {
  user: UserProfile;
  index: number;
  onEdit: (user: UserProfile) => void;
}) {
  const avatarUrl =
    user.avatar && user.avatar.length > 0 ? convertBlobToDataURL(user.avatar) : null;

  return (
    <tr className="border-b border-admin-border hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 text-admin-muted text-sm">{index + 1}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <AvatarFallback className="bg-admin-teal/20 text-admin-teal text-xs font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-admin-text text-sm font-medium">{user.name || 'Unnamed'}</p>
            <p className="text-admin-muted text-xs">@{user.handle || 'no-handle'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-admin-muted text-sm max-w-xs truncate">
        {user.channelDescription || '—'}
      </td>
      <td className="px-4 py-3">
        <Button
          size="sm"
          variant="ghost"
          className="text-admin-teal hover:text-admin-teal hover:bg-admin-teal/10 h-7 px-2"
          onClick={() => onEdit(user)}
        >
          <Edit size={14} className="mr-1" />
          Edit
        </Button>
      </td>
    </tr>
  );
}

function VideoRow({
  video,
  onRemove,
  isRemoving,
}: {
  video: VideoMetadata;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  return (
    <tr className="border-b border-admin-border hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 text-admin-text text-sm font-medium max-w-xs">
        <div className="truncate max-w-[200px]">{video.title}</div>
      </td>
      <td className="px-4 py-3 text-admin-muted text-sm">
        <div className="truncate max-w-[120px]">{video.uploader.toString().slice(0, 12)}…</div>
      </td>
      <td className="px-4 py-3 text-admin-muted text-sm">
        {formatViewCount(Number(video.viewCount))}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant={video.isShort ? 'secondary' : 'outline'}
          className={
            video.isShort
              ? 'bg-admin-violet/20 text-admin-violet border-admin-violet/30 text-xs'
              : 'border-admin-border text-admin-muted text-xs'
          }
        >
          {video.isShort ? 'Short' : 'Video'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"
              disabled={isRemoving}
            >
              <Trash2 size={14} className="mr-1" />
              Remove
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-admin-card border-admin-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-admin-text">Remove Video</AlertDialogTitle>
              <AlertDialogDescription className="text-admin-muted">
                Are you sure you want to remove "{video.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-admin-border text-admin-muted hover:bg-white/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRemove(video.id)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clear } = useInternetIdentity();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserPrincipal, setEditUserPrincipal] = useState<Principal | null>(null);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: dashboard, isLoading: dashboardLoading } = useGetAdminDashboard();
  const { mutate: removeVideo, isPending: removingVideo } = useAdminRemoveVideo();
  const {
    data: earningsStats,
    isLoading: earningsLoading,
    error: earningsError,
    refetch: refetchEarnings,
  } = useGetAdminEarningsStats();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    // We don't have the principal from UserProfile alone; use a placeholder
    setEditUserPrincipal(Principal.anonymous());
    setEditUserModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditUserModalOpen(false);
    setEditingUser(null);
    setEditUserPrincipal(null);
  };

  const handleRemoveVideo = (videoId: string) => {
    removeVideo(videoId);
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen admin-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-admin-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-admin-muted text-sm">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen admin-bg flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-admin-text text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-admin-muted mb-6">You don't have permission to access this page.</p>
          <Button
            onClick={() => navigate({ to: '/' })}
            className="bg-admin-teal hover:bg-admin-teal/90 text-white"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const analytics = dashboard?.analytics;
  const users = dashboard?.users ?? [];
  const videos = dashboard?.videos ?? [];

  return (
    <div className="min-h-screen admin-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 admin-sidebar z-30 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <img
            src="/assets/generated/admin-logo-icon.dim_128x128.png"
            alt="Mediatube Admin"
            className="w-9 h-9 rounded-lg object-cover"
          />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Mediatube</p>
            <p className="text-admin-teal text-xs font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
            Main Menu
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeSection === item.id
                  ? 'bg-admin-teal text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.icon}
              {item.label}
              {activeSection === item.id && (
                <ChevronRight size={14} className="ml-auto opacity-70" />
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="admin-header sticky top-0 z-10 flex items-center justify-between px-5 h-16 border-b border-admin-border">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-admin-muted hover:text-admin-text"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-admin-text font-semibold text-base capitalize">
                {activeSection === 'dashboard' ? 'Overview' : activeSection}
              </h1>
              <p className="text-admin-muted text-xs hidden sm:block">
                {activeSection === 'dashboard' && 'Platform statistics at a glance'}
                {activeSection === 'users' && 'Manage registered users'}
                {activeSection === 'videos' && 'Moderate uploaded content'}
                {activeSection === 'earnings' && 'Platform earnings overview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-admin-teal/10 border border-admin-teal/20 rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-admin-teal animate-pulse" />
              <span className="text-admin-teal text-xs font-medium">Admin</span>
            </div>
            <Avatar className="h-8 w-8 cursor-pointer" onClick={handleLogout}>
              <AvatarFallback className="bg-admin-violet/20 text-admin-violet text-xs font-bold">
                AD
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-7">
          {/* DASHBOARD SECTION */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {dashboardLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard
                    icon={<Users size={22} />}
                    label="Total Users"
                    value={Number(analytics?.totalUsers ?? 0).toLocaleString()}
                    accent="teal"
                  />
                  <StatCard
                    icon={<Video size={22} />}
                    label="Total Videos"
                    value={Number(analytics?.totalVideos ?? 0).toLocaleString()}
                    accent="violet"
                  />
                  <StatCard
                    icon={<Eye size={22} />}
                    label="Total Views"
                    value={formatViewCount(Number(analytics?.totalViews ?? 0))}
                    accent="blue"
                  />
                  <StatCard
                    icon={<MessageSquare size={22} />}
                    label="Total Comments"
                    value={Number(analytics?.totalComments ?? 0).toLocaleString()}
                    accent="amber"
                  />
                </div>
              )}

              {/* Quick overview */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="admin-card rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
                    <h3 className="text-admin-text font-semibold text-sm flex items-center gap-2">
                      <Users size={16} className="text-admin-teal" />
                      Recent Users
                    </h3>
                    <button
                      onClick={() => setActiveSection('users')}
                      className="text-admin-teal text-xs hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="divide-y divide-admin-border">
                    {dashboardLoading
                      ? [...Array(3)].map((_, i) => (
                          <div key={i} className="px-5 py-3 flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-3 w-24 bg-white/5" />
                              <Skeleton className="h-2.5 w-16 bg-white/5" />
                            </div>
                          </div>
                        ))
                      : users.slice(0, 5).map((user, i) => (
                          <div key={i} className="px-5 py-3 flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-admin-teal/20 text-admin-teal text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-admin-text text-sm font-medium">
                                {user.name || 'Unnamed'}
                              </p>
                              <p className="text-admin-muted text-xs">@{user.handle || 'no-handle'}</p>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>

                <div className="admin-card rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
                    <h3 className="text-admin-text font-semibold text-sm flex items-center gap-2">
                      <Video size={16} className="text-admin-violet" />
                      Recent Videos
                    </h3>
                    <button
                      onClick={() => setActiveSection('videos')}
                      className="text-admin-violet text-xs hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="divide-y divide-admin-border">
                    {dashboardLoading
                      ? [...Array(3)].map((_, i) => (
                          <div key={i} className="px-5 py-3">
                            <Skeleton className="h-3 w-3/4 bg-white/5 mb-1.5" />
                            <Skeleton className="h-2.5 w-1/2 bg-white/5" />
                          </div>
                        ))
                      : videos.slice(0, 5).map((video, i) => (
                          <div key={i} className="px-5 py-3">
                            <p className="text-admin-text text-sm font-medium truncate">
                              {video.title}
                            </p>
                            <p className="text-admin-muted text-xs mt-0.5">
                              {formatViewCount(Number(video.viewCount))} views
                            </p>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS SECTION */}
          {activeSection === 'users' && (
            <div className="admin-card rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-admin-border">
                <h2 className="text-admin-text font-semibold flex items-center gap-2">
                  <Users size={18} className="text-admin-teal" />
                  All Users ({users.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-admin-border">
                      <th className="px-4 py-3 text-left text-admin-muted text-xs font-semibold uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-admin-muted text-xs font-semibold uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-admin-muted text-xs font-semibold uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-admin-muted text-xs font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <UserRow key={i} user={user} index={i} onEdit={handleEditUser} />
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="text-admin-muted text-sm text-center py-8">No users found.</p>
                )}
              </div>
            </div>
          )}

          {/* VIDEOS SECTION */}
          {activeSection === 'videos' && (
            <div className="admin-card rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-admin-border">
                <h2 className="text-admin-text font-semibold flex items-center gap-2">
                  <Video size={18} className="text-admin-violet" />
                  All Videos ({videos.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-admin-border">
                      <th className="px-4 py-3 text-left text-admin-muted text-xs font-semibold uppercase tracking-wider">Title</th>
                      <th className="px-4 py-3 text-left text-admin-muted text-xs font-semibold uppercase tracking-wider">Uploader</th>
                      <th className="px-4 py-3 text-left text-admin-muted text-xs font-semibold uppercase tracking-wider">Views</th>
                      <th className="px-4 py-3 text-left text-admin-muted text-xs font-semibold uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-admin-muted text-xs font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((video, i) => (
                      <VideoRow
                        key={i}
                        video={video}
                        onRemove={handleRemoveVideo}
                        isRemoving={removingVideo}
                      />
                    ))}
                  </tbody>
                </table>
                {videos.length === 0 && (
                  <p className="text-admin-muted text-sm text-center py-8">No videos found.</p>
                )}
              </div>
            </div>
          )}

          {/* EARNINGS SECTION */}
          {activeSection === 'earnings' && (
            <div className="space-y-6">
              <EarningsStatsCards
                stats={earningsStats}
                isLoading={earningsLoading}
                error={earningsError as Error | null}
                onRetry={() => refetchEarnings()}
              />
            </div>
          )}
        </main>
      </div>

      {/* Edit User Modal */}
      {editUserModalOpen && editingUser && editUserPrincipal && (
        <EditUserModal
          open={editUserModalOpen}
          onClose={handleCloseEditModal}
          userPrincipal={editUserPrincipal}
          initialProfile={editingUser}
        />
      )}
    </div>
  );
}
