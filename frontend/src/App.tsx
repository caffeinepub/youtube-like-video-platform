import React from 'react';
import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { GoogleAuthProvider } from './hooks/useGoogleAuth';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import UploadVideoPage from './pages/UploadVideoPage';
import ProfilePage from './pages/ProfilePage';
import ApiKeysPage from './pages/ApiKeysPage';
import ReelsPage from './pages/ReelsPage';
import ShortsPage from './pages/ShortsPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import SearchResultsPage from './pages/SearchResultsPage';
import CopyrightPolicyPage from './pages/CopyrightPolicyPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

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

const apiKeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api-keys',
  component: ApiKeysPage,
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

const playlistsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playlists',
  component: PlaylistsPage,
});

const playlistDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playlists/$playlistId',
  component: PlaylistDetailPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: SearchResultsPage,
});

const copyrightRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/copyright',
  component: CopyrightPolicyPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboardPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  videoRoute,
  uploadRoute,
  profileRoute,
  apiKeysRoute,
  reelsRoute,
  shortsRoute,
  playlistsRoute,
  playlistDetailRoute,
  searchRoute,
  copyrightRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <GoogleAuthProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </GoogleAuthProvider>
    </ThemeProvider>
  );
}
