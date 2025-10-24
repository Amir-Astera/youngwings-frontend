import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
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
  fullImageClassName,
  fullImageWrapperClassName,
  "data-testid": dataTestId,
}: ZoomableImageProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid={dataTestId}
          className={cn(
            "group relative block w-full overflow-hidden cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
          aria-label="Открыть изображение в полном размере"
        >
          <ImageWithFallback
            src={src}
            alt={alt}
            className={cn(
              "block h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105",
              imageClassName,
            )}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[min(96vw,1100px)] border-none bg-transparent p-0 shadow-none">
        <div
          className={cn(
            "flex max-h-[80vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-background p-2 shadow-xl sm:p-4",
            fullImageWrapperClassName,
          )}
        >
          <ImageWithFallback
            src={src}
            alt={alt}
            className={cn("block h-full w-full max-h-[70vh] object-contain", fullImageClassName)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
