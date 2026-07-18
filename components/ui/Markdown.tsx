// components/ui/Markdown.tsx — a minimal markdown-lite renderer (no new deps).
// Supports the small subset artifacts actually use: #/##/### headers, **bold**,
// *italic*, "- " bullet lists, and blank-line-separated paragraphs.
'use client';

import type { ReactNode } from 'react';
import { Fragment } from 'react';

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter((p) => p !== '');
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-stone-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Markdown({ content, className = '' }: { content: string; className?: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 ml-4 list-disc space-y-1">
          {listBuffer.map((item, i) => (
            <li key={i} className="leading-relaxed">{renderInline(item)}</li>
          ))}
        </ul>,
      );
      listBuffer = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (line === '') {
      flushList();
      return;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(<h4 key={idx} className="mt-4 mb-1 text-sm font-semibold text-stone-900">{renderInline(line.slice(4))}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push(<h3 key={idx} className="mt-5 mb-1.5 text-base font-semibold text-stone-900">{renderInline(line.slice(3))}</h3>);
      return;
    }
    if (line.startsWith('# ')) {
      flushList();
      blocks.push(<h2 key={idx} className="mt-5 mb-2 text-lg font-semibold text-stone-900">{renderInline(line.slice(2))}</h2>);
      return;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(line.slice(2));
      return;
    }
    flushList();
    blocks.push(<p key={idx} className="my-1.5 leading-relaxed text-stone-600">{renderInline(line)}</p>);
  });
  flushList();

  return <div className={className}>{blocks}</div>;
}
