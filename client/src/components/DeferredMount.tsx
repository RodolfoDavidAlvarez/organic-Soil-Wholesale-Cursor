import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
  className?: string;
};

/** Mounts expensive below-the-fold UI shortly before it reaches the viewport. */
export default function DeferredMount({
  children,
  minHeight = 320,
  rootMargin = "500px 0px",
  className,
}: Props) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const marker = markerRef.current;
    if (!marker || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return (
    <div ref={markerRef} className={className} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}
