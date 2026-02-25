import { Link } from '@tanstack/react-router';
import { Eye, Clock, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatViewCount, formatTimeAgo, formatDuration } from '../utils/formatters';
import type { VideoMetadata } from '../backend';

interface VideoCardProps {
  video: VideoMetadata;
  linkToReels?: boolean;
}

export default function VideoCard({ video, linkToReels = false }: VideoCardProps) {
  const videoUrl = video.videoFile.getDirectURL();

  const href = linkToReels
    ? `/reels?videoId=${video.id}`
    : `/video/${video.id}`;

  const cardContent = (
    <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-video bg-muted overflow-hidden">
        <video
          src={videoUrl}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          preload="metadata"
        />
        {/* Short badge */}
        {video.isShort && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="default"
              className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-primary text-primary-foreground font-semibold shadow"
            >
              <Zap className="w-3 h-3 fill-current" />
              Short
            </Badge>
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          <Clock className="w-3 h-3 inline mr-1" />
          {formatDuration(Number(video.duration))}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
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
  );

  if (linkToReels) {
    return (
      <a href={href} className="group">
        {cardContent}
      </a>
    );
  }

  return (
    <Link to="/video/$videoId" params={{ videoId: video.id }} className="group">
      {cardContent}
    </Link>
  );
}
