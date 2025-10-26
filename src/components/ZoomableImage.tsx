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
    </div>
  );
}
