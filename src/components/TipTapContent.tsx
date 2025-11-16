import { useMemo } from "react";
import type { ReactNode } from "react";
import { ZoomableImage } from "./ZoomableImage";

interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  attrs?: Record<string, unknown>;
}

interface TipTapMark {
  type?: string;
  attrs?: Record<string, unknown>;
}

interface TipTapContentProps {
  content?: string | null;
  className?: string;
}

function classNames(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

function applyMarks(base: ReactNode, marks: TipTapMark[] | undefined, keyBase: string): ReactNode {
  if (!marks || marks.length === 0) {
    return base;
  }

  return marks.reduce((acc, mark, index) => {
    const markKey = `${keyBase}-mark-${index}`;

    switch (mark.type) {
      case "bold":
      case "strong":
        return <strong key={markKey}>{acc}</strong>;
      case "italic":
      case "em":
        return <em key={markKey}>{acc}</em>;
      case "strike":
      case "strikeThrough":
        return <s key={markKey}>{acc}</s>;
      case "underline":
        return <u key={markKey}>{acc}</u>;
      case "code":
        return (
          <code key={markKey} className="bg-gray-100 rounded px-1 py-0.5 text-xs">
            {acc}
          </code>
        );
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : undefined;
        const rel = typeof mark.attrs?.rel === "string" ? mark.attrs.rel : "noopener noreferrer";
        const target = typeof mark.attrs?.target === "string" ? mark.attrs.target : "_blank";
        return (
          <a key={markKey} href={href} target={target} rel={rel} className="text-primary hover:underline">
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, base);
}

function renderNodes(nodes: TipTapNode[] | undefined, keyPrefix: string, parentType?: string): ReactNode {
  if (!nodes || nodes.length === 0) {
    return null;
  }

  return nodes.map((node, index) => renderNode(node, `${keyPrefix}-${index}`, parentType));
}

function renderNode(node: TipTapNode, key: string, parentType?: string): ReactNode {
  if (!node) {
    return null;
  }

  switch (node.type) {
    case "doc":
      return (
        <div key={key} className="space-y-4">
          {renderNodes(node.content, `${key}-child`, node.type)}
        </div>
      );
    case "paragraph": {
      const children = renderNodes(node.content, `${key}-paragraph`, node.type);
      if (!children) {
        if (parentType === "listItem") {
          return <span key={key} className="text-sm text-black dark:text-white leading-relaxed" />;
        }

        return <p key={key} className="text-sm text-black dark:text-white leading-relaxed" />;
      }

      if (parentType === "listItem") {
        return (
          <span key={key} className="text-sm text-black dark:text-white leading-relaxed">
            {children}
          </span>
        );
      }

      return (
        <p key={key} className="text-sm text-black dark:text-white leading-relaxed">
          {children}
        </p>
      );
    }
    case "heading": {
      const levelRaw = node.attrs?.level;
      const level = typeof levelRaw === "number" ? Math.min(Math.max(levelRaw, 1), 6) : 2;
      const HeadingTag = `h${level}` as const;
      const sizeClasses: Record<string, string> = {
        h1: "text-2xl font-semibold",
        h2: "text-xl font-semibold",
        h3: "text-lg font-semibold",
        h4: "text-base font-semibold",
        h5: "text-sm font-semibold",
        h6: "text-sm font-semibold uppercase tracking-wide",
      };
      const headingClass = sizeClasses[HeadingTag] ?? "text-lg font-semibold";
      return (
        <HeadingTag key={key} className={classNames(headingClass, "text-black dark:text-white")}>
          {renderNodes(node.content, `${key}-heading`, node.type)}
        </HeadingTag>
      );
    }
    case "bulletList":
      return (
        <ul
          key={key}
          className="list-disc list-inside space-y-2 text-sm text-black dark:text-white [&>li]:marker:text-black [&>li]:dark:marker:text-white"
        >
          {renderNodes(node.content, `${key}-bullet`, node.type)}
        </ul>
      );
    case "orderedList": {
      const start = typeof node.attrs?.start === "number" ? node.attrs.start : undefined;
      return (
        <ol
          key={key}
          start={start}
          className="list-decimal list-inside space-y-2 text-sm text-black dark:text-white [&>li]:marker:text-black [&>li]:dark:marker:text-white"
        >
          {renderNodes(node.content, `${key}-ordered`, node.type)}
        </ol>
      );
    }
    case "listItem": {
      const children = renderNodes(node.content, `${key}-item`, node.type);
      return (
        <li key={key} className="text-sm text-black dark:text-white leading-relaxed pl-1">
          {children}
        </li>
      );
    }
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-blue-600 bg-gray-50 text-sm text-black dark:text-white leading-relaxed italic rounded-r-lg px-4 py-3 dark:bg-gray-900/40"
        >
          {renderNodes(node.content, `${key}-blockquote`, node.type)}
        </blockquote>
      );
    case "codeBlock": {
      const codeText = collectPlainText(node.content);
      return (
        <pre key={key} className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-auto">
          <code>{codeText}</code>
        </pre>
      );
    }
    case "horizontalRule":
      return <hr key={key} className="border-gray-200" />;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : undefined;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      if (!src) {
        return null;
      }

      return (
        <ZoomableImage
          key={key}
          src={src}
          alt={alt}
          className="overflow-hidden rounded-xl"
          fullImageClassName="rounded-xl"
        />
      );
    }
    case "hardBreak":
      return <br key={key} />;
    case "text": {
      const textContent = node.text ?? "";
      const base = (
        <span key={key}>
          {textContent}
        </span>
      );
      return applyMarks(base, node.marks, key);
    }
    default:
      if (node.content) {
        return (
          <div key={key} className="space-y-4">
            {renderNodes(node.content, `${key}-unknown`, node.type)}
          </div>
        );
      }
      return null;
  }
}

function collectPlainText(nodes: TipTapNode[] | undefined): string {
  if (!nodes) {
    return "";
  }

  return nodes
    .map((node) => {
      if (node.type === "text" && typeof node.text === "string") {
        return node.text;
      }

      if (node.content) {
        return collectPlainText(node.content);
      }

      return "";
    })
    .join("");
}

export function TipTapContent({ content, className }: TipTapContentProps) {
  const parsed = useMemo(() => {
    if (!content) {
      return null;
    }

    try {
      const json = JSON.parse(content) as TipTapNode;
      return json;
    } catch {
      return content.trim();
    }
  }, [content]);

  if (!parsed) {
    return null;
  }

  if (typeof parsed === "string") {
    if (!parsed) {
      return null;
    }

    return (
      <div className={classNames("space-y-4", className)}>
        <p className="text-sm text-foreground leading-relaxed">{parsed}</p>
      </div>
    );
  }

  return (
    <div className={classNames("space-y-4", className)}>
      {renderNode(parsed, "tiptap-root")}
    </div>
  );
}
