import { ZoomIn } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { cn } from "./ui/utils";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fullImageClassName?: string;
  fullImageWrapperClassName?: string;
  "data-testid"?: string;
}

export function ZoomableImage({
  src,
  alt,
  className,
  imageClassName,
  fullImageClassName: _fullImageClassName,
  fullImageWrapperClassName: _fullImageWrapperClassName,
  "data-testid": dataTestId,
}: ZoomableImageProps) {
  return (
    <div
      data-testid={dataTestId}
      className={cn(
        "group relative block w-full overflow-hidden rounded-xl cursor-zoom-in",
        className,
      )}
    >
      <ImageWithFallback
        src={src}
        alt={alt}
        className={cn(
          "block h-full w-full object-cover transition-transform duration-500 ease-out",
          "group-hover:scale-[1.12]",
          imageClassName,
        )}
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 ease-out group-hover:bg-black/20"
        aria-hidden="true"
      >
        <ZoomIn className="h-10 w-10 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 drop-shadow-lg" aria-hidden="true" />
      </div>
    </div>
  );
}
