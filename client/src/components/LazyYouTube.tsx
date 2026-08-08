import { useState } from "react";
import { Play } from "lucide-react";

type Props = {
  id: string;
  title: string;
  className?: string;
};

export default function LazyYouTube({ id, title, className = "" }: Props) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        title={title}
        src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=1&modestbranding=1&rel=0&playsinline=1`}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className={`h-full w-full border-0 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${title}`}
      className={`group relative h-full w-full overflow-hidden bg-stone-900 text-white ${className}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        width="480"
        height="360"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover opacity-80 transition group-hover:opacity-95"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#264027] shadow-xl">
          <Play className="ml-1 h-6 w-6 fill-current" aria-hidden />
        </span>
      </span>
    </button>
  );
}
