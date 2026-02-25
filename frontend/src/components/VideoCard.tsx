import { Link } from '@tanstack/react-router';
import { Eye, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatViewCount, formatTimeAgo, formatDuration } from '../utils/formatters';
import type { VideoMetadata } from '../backend';

interface VideoCardProps {
  video: VideoMetadata;
}

export default function VideoCard({ video }: VideoCardProps) {
  const videoUrl = video.videoFile.getDirectURL();

  return (
    <Link to="/video/$id" params={{ id: video.id }} className="group">
      <Card className="overflow-hidden border-border/50 hover:border-[oklch(0.65_0.25_25)] transition-all duration-300 hover:shadow-lg">
        <div className="relative aspect-video bg-muted overflow-hidden">
          <video
            src={videoUrl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            preload="metadata"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            <Clock className="w-3 h-3 inline mr-1" />
            {formatDuration(Number(video.duration))}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-[oklch(0.65_0.25_25)] transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>{formatViewCount(Number(video.viewCount))} views</span>
            <span>•</span>
            <span>{formatTimeAgo(Number(video.uploadDate))}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
