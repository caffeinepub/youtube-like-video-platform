export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  duration: string;
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: 'track1',
    name: 'Upbeat Vibes',
    artist: 'Studio Beats',
    url: '/assets/music/track1.mp3',
    duration: '0:30',
  },
  {
    id: 'track2',
    name: 'Chill Wave',
    artist: 'Lo-Fi Lab',
    url: '/assets/music/track2.mp3',
    duration: '0:30',
  },
  {
    id: 'track3',
    name: 'Electric Pulse',
    artist: 'Neon Sounds',
    url: '/assets/music/track3.mp3',
    duration: '0:30',
  },
  {
    id: 'track4',
    name: 'Sunset Drive',
    artist: 'Ambient Co.',
    url: '/assets/music/track4.mp3',
    duration: '0:30',
  },
  {
    id: 'track5',
    name: 'Morning Rush',
    artist: 'Fresh Tracks',
    url: '/assets/music/track5.mp3',
    duration: '0:30',
  },
];
