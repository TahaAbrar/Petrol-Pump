import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

/** Cycles through event images every 2s while the card is hovered. */
export function EventCardSlideshow({
  images,
  alt,
  className = "",
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const slides = images.filter(Boolean);
  const display = slides.length ? slides : [""];
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!hovering || display.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % display.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [hovering, display.length]);

  return (
    <div
      className={`relative overflow-hidden bg-muted ${className}`}
      onMouseEnter={() => {
        setHovering(true);
        setIndex(0);
      }}
      onMouseLeave={() => {
        setHovering(false);
        setIndex(0);
      }}
    >
      {display[0] ? display.map((src, i) => (
        <img
          key={src || i}
          src={src}
          alt={alt}
          loading="lazy"
          width={1400}
          height={900}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
            i === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
          } ${hovering ? "group-hover:scale-[1.04]" : ""}`}
        />
      )) : (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground">
          <CalendarDays className="h-8 w-8 opacity-40" />
        </div>
      )}
      {display.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
