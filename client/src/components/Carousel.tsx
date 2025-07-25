import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

export interface CarouselItem {
  id: string | number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  link?: string; // internal or external
}

interface CarouselProps {
  items: CarouselItem[];
  height?: number;
}

/**
 * Simple horizontal scrolling carousel with snap points.
 * For now uses native scroll; later can be enhanced with Swiper or KeenSlider.
 */
export default function Carousel({ items, height = 160 }: CarouselProps) {
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent, link?: string) => {
    if (!link) return;
    e.preventDefault();
    if (link.startsWith("http")) {
      window.open(link, "_blank");
    } else {
      navigate(link);
    }
  };

  return (
    <div
      style={{
        overflowX: "auto",
        display: "flex",
        gap: 12,
        paddingBottom: 8,
        scrollSnapType: "x mandatory",
      }}
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={item.link ?? "#"}
          onClick={(e) => handleClick(e as any, item.link)}
          style={{
            flex: "0 0 80%",
            height,
            borderRadius: 12,
            position: "relative",
            backgroundColor: "#f2f2f2",
            color: "inherit",
            textDecoration: "none",
            overflow: "hidden",
            scrollSnapAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            transition: "transform 0.3s",
          }}
        >
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 0,
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 16,
              bottom: 16,
              color: "white",
              zIndex: 2,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18 }}>{item.title}</h3>
            {item.subtitle && <p style={{ margin: 0, fontSize: 14 }}>{item.subtitle}</p>}
          </div>
        </a>
      ))}
    </div>
  );
}
