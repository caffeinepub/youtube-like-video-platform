import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import UploadVideoPage from './pages/UploadVideoPage';
import ProfilePage from './pages/ProfilePage';
import ReelsPage from './pages/ReelsPage';
import ShortsPage from './pages/ShortsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import CommunityPage from './pages/CommunityPage';
import ApiKeysPage from './pages/ApiKeysPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CopyrightPolicyPage from './pages/CopyrightPolicyPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import ChannelPage from './pages/ChannelPage';
import MonetizationPage from './pages/MonetizationPage';
import { GoogleAuthProvider } from './hooks/useGoogleAuth';
import { LanguageProvider } from './contexts/LanguageContext';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const videoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/video/$videoId',
  component: VideoPlayerPage,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/upload',
  component: UploadVideoPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const reelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reels',
  component: ReelsPage,
});

const shortsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shorts',
  component: ShortsPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: SearchResultsPage,
});

const playlistsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playlists',
  component: PlaylistsPage,
});

const playlistDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playlist/$playlistId',
  component: PlaylistDetailPage,
});

const communityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/community',
  component: CommunityPage,
});

const apiKeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api-keys',
  component: ApiKeysPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboardPage,
});

const copyrightRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/copyright-policy',
  component: CopyrightPolicyPage,
});

const subscriptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subscriptions',
  component: SubscriptionsPage,
});

const channelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/channel/$principalId',
  component: ChannelPage,
});

const monetizationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/monetization',
  component: MonetizationPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  videoRoute,
  uploadRoute,
  profileRoute,
  reelsRoute,
  shortsRoute,
  searchRoute,
  playlistsRoute,
  playlistDetailRoute,
  communityRoute,
  apiKeysRoute,
  adminRoute,
  copyrightRoute,
  subscriptionsRoute,
  channelRoute,
  monetizationRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-yt-bg flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-yt-text-secondary mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-yt-red text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <GoogleAuthProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
              <RouterProvider router={router} />
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </QueryClientProvider>
        </GoogleAuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
