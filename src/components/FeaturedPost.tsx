import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface FeaturedPostProps {
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string;
  };
  image: string;
  category: string;
  date: string;
  likes: number;
  comments: number;
}

export function FeaturedPost({
  title,
  excerpt,
  author,
  image,
  category,
  date,
  likes,
  comments,
}: FeaturedPostProps) {
  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image */}
        <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden">
          <ImageWithFallback
            src={image}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <Badge className="absolute top-4 left-4">{category}</Badge>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p>{author.name}</p>
                <p className="text-sm text-muted-foreground">{date}</p>
              </div>
            </div>

            <h2 className="mb-4 hover:text-primary transition-colors cursor-pointer">
              {title}
            </h2>
            <p className="text-muted-foreground mb-6 line-clamp-4">
              {excerpt}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <Heart className="w-5 h-5" />
                <span>{likes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="w-5 h-5" />
                <span>{comments}</span>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{readTime}</span>
              <Button variant="ghost" size="icon">
                <Bookmark className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
