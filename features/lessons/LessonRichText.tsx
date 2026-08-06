import type { ReactNode } from "react";
import type { LessonContentBlock } from "@/core/content/domain/lesson-markdown";

export function LessonInlineText({ value }: { value: string }) {
  return <>{inlineMarkdown(value)}</>;
}

function inlineMarkdown(value: string): ReactNode[] {
  return value
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={`${index}-${part}`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={`${index}-${part}`}
            className="rounded-md bg-foreground/8 px-1.5 py-0.5 font-mono text-[.9em] font-bold text-primary-dark"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={`${index}-${part}`}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
}

export function LessonRichText({ blocks }: { blocks: LessonContentBlock[] }) {
  return (
    <div className="space-y-5 text-base font-semibold leading-8 text-foreground/75 sm:text-lg">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p key={`${block.type}-${index}`}>{inlineMarkdown(block.text)}</p>;
        }
        if (block.type === "heading") {
          return (
            <h3 key={`${block.type}-${index}`} className="pt-2 text-2xl font-semibold text-foreground">
              {inlineMarkdown(block.text)}
            </h3>
          );
        }
        if (block.type === "unordered-list" || block.type === "ordered-list") {
          const List = block.type === "ordered-list" ? "ol" : "ul";
          return (
            <List
              key={`${block.type}-${index}`}
              className={block.type === "ordered-list" ? "space-y-3 pl-7 [list-style:decimal]" : "space-y-3 pl-7 [list-style:disc]"}
            >
              {block.items.map((item) => (
                <li key={item} className="pl-1 marker:font-black marker:text-coral">
                  {inlineMarkdown(item)}
                </li>
              ))}
            </List>
          );
        }
        return (
          <div key={`${block.type}-${index}`} className="overflow-x-auto rounded-2xl border-2 border-foreground/20">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead className="bg-primary-dark text-white">
                <tr>{block.headers.map((header) => <th key={header} className="px-4 py-3 font-black">{inlineMarkdown(header)}</th>)}</tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={`${rowIndex}-${row.join("-")}`} className="border-t border-foreground/15 odd:bg-surface-muted/45">
                    {row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`} className="px-4 py-3">{inlineMarkdown(cell)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
