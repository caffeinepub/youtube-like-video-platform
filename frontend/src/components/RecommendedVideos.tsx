import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useGetAllVideos } from '../hooks/useGetAllVideos';
import { formatViewCount, formatTimeAgo, formatDuration } from '../utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';

interface RecommendedVideosProps {
  currentVideoId?: string;
}

export default function RecommendedVideos({ currentVideoId }: RecommendedVideosProps) {
  const { data: videos, isLoading } = useGetAllVideos();

  const recommended = videos
    ?.filter(v => v.id !== currentVideoId && !v.isShort)
    .slice(0, 12) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="w-40 aspect-video rounded-lg bg-mt-charcoal-800 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-3 w-full bg-mt-charcoal-800" />
              <Skeleton className="h-3 w-2/3 bg-mt-charcoal-800" />
              <Skeleton className="h-3 w-1/2 bg-mt-charcoal-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommended.map(video => (
        <Link
          key={video.id}
          to="/video/$videoId"
          params={{ videoId: video.id }}
          className="flex gap-2 group"
        >
          <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-mt-charcoal-800 shrink-0">
            <video
              src={video.videoFile.getDirectURL()}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              muted
              preload="metadata"
            />
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(Number(video.duration))}
            </div>
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-mt-red-400 transition-colors">
              {video.title}
            </h4>
            <p className="text-xs text-mt-charcoal-400 mt-1 truncate">
              {video.uploader.toString().slice(0, 8)}...
            </p>
            <p className="text-xs text-mt-charcoal-500 mt-0.5">
              {formatViewCount(Number(video.viewCount))} views
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
