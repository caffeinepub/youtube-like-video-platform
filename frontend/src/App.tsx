import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import ChannelPage from './pages/ChannelPage';
import UploadVideoPage from './pages/UploadVideoPage';
import ProfilePage from './pages/ProfilePage';
import SearchResultsPage from './pages/SearchResultsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import ShortsPage from './pages/ShortsPage';
import ReelsPage from './pages/ReelsPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import CommunityPage from './pages/CommunityPage';
import MonetizationPage from './pages/MonetizationPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CopyrightPolicyPage from './pages/CopyrightPolicyPage';
import DownloadAppPage from './pages/DownloadAppPage';
import ApiKeysPage from './pages/ApiKeysPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import WithdrawalPage from './pages/WithdrawalPage';

const queryClient = new QueryClient();

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

const channelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/channel/$principalId',
  component: ChannelPage,
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

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: SearchResultsPage,
});

const subscriptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subscriptions',
  component: SubscriptionsPage,
});

const shortsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shorts',
  component: ShortsPage,
});

const reelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reels',
  component: ReelsPage,
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

const monetizationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/monetization',
  component: MonetizationPage,
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

const downloadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/download',
  component: DownloadAppPage,
});

const apiKeysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api-keys',
  component: ApiKeysPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupPage,
});

const withdrawalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/withdrawal',
  component: WithdrawalPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  videoRoute,
  channelRoute,
  uploadRoute,
  profileRoute,
  searchRoute,
  subscriptionsRoute,
  shortsRoute,
  reelsRoute,
  playlistsRoute,
  playlistDetailRoute,
  communityRoute,
  monetizationRoute,
  adminRoute,
  copyrightRoute,
  downloadRoute,
  apiKeysRoute,
  loginRoute,
  signupRoute,
  withdrawalRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
