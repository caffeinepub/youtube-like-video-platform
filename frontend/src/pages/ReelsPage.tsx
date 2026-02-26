import { useRef, useState, useCallback } from 'react';
import { useGetAllVideos } from '../hooks/useGetAllVideos';
import ReelCard from '../components/ReelCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from '@tanstack/react-router';
import { Camera } from 'lucide-react';
import CameraRecordingModal from '../components/CameraRecordingModal';

export default function ReelsPage() {
  const { data: videos = [], isLoading } = useGetAllVideos();
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const shortVideos = videos.filter((v) => v.isShort);

  const handleRecordingComplete = useCallback(
    (blob: Blob) => {
      setShowCamera(false);
      sessionStorage.setItem('recordedVideoBlob', URL.createObjectURL(blob));
      navigate({ to: '/upload' });
    },
    [navigate]
  );

  if (isLoading) {
    return (
      <div className="bg-black h-screen flex items-center justify-center">
        <Skeleton className="w-full h-full bg-yt-chip" />
      </div>
    );
  }

  if (shortVideos.length === 0) {
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center gap-4 text-white p-8">
        <span className="text-5xl">🎬</span>
        <h2 className="text-xl font-semibold">No Shorts yet</h2>
        <p className="text-yt-text-secondary text-sm text-center">
          Be the first to upload a Short!
        </p>
        <button
          onClick={() => setShowCamera(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yt-red text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Record a Short
        </button>
        {showCamera && (
          <CameraRecordingModal
            onClose={() => setShowCamera(false)}
            onRecordingComplete={handleRecordingComplete}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-black relative">
      {/* Camera FAB */}
      <button
        onClick={() => setShowCamera(true)}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-yt-red rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors lg:bottom-6"
      >
        <Camera className="w-5 h-5 text-white" />
      </button>

      {/* Reels Feed */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={() => {
          // Update active index based on scroll position
          if (!containerRef.current) return;
          const scrollTop = containerRef.current.scrollTop;
          const height = containerRef.current.clientHeight;
          const idx = Math.round(scrollTop / height);
          setActiveIndex(idx);
        }}
      >
        {shortVideos.map((video, idx) => (
          <div
            key={video.id}
            ref={(el) => { itemRefs.current[idx] = el; }}
            className="snap-start snap-always"
          >
            <ReelCard video={video} isActive={activeIndex === idx} />
          </div>
        ))}
      </div>

      {showCamera && (
        <CameraRecordingModal
          onClose={() => setShowCamera(false)}
          onRecordingComplete={handleRecordingComplete}
        />
      )}
    </div>
  );
}
