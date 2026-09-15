'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Lock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/i18n/navigation';
import { videosService } from '@/services/content.service';
import { ApiError } from '@/lib/api';
import type { Video } from '@/types';

export function VideoPlayButton({ video }: { video: Video }) {
  const t = useTranslations('common');
  const { accessToken, status } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const play = async () => {
    if (status !== 'authenticated' || !accessToken) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await videosService.streamUrl(accessToken, video.id);
      setUrl(res.videoUrl);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Enroll to watch this video');
    } finally {
      setLoading(false);
    }
  };

  if (url) {
    return (
      <video src={url} controls autoPlay className="w-full rounded-xl">
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <Button size="sm" variant={video.isFree ? 'default' : 'outline'} disabled={loading} onClick={play}>
      {video.isFree ? <Play className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      {t('watch')}
    </Button>
  );
}
