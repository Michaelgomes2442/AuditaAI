'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple but robust markdown renderer for AI responses
 * Handles: bold, italic, code, lists, paragraphs, headers
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Split content into lines for processing
  const lines = content.split('\n');
  const elements: React.ReactElement[] = [];
  
  let i = 0;
  let listItems: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
        codeLines = [];
      } else {
        // End code block
        inCodeBlock = false;
        elements.push(
          <div key={`code-${i}`} className="my-4 bg-slate-800 rounded-lg overflow-hidden">
            {codeLanguage && (
              <div className="text-xs text-slate-400 bg-slate-900 px-3 py-2 border-b border-slate-700">
                {codeLanguage}
              </div>
            )}
            <pre className="p-3 overflow-x-auto">
              <code className="text-sm font-mono text-slate-200">
                {codeLines.join('\n')}
              </code>
            </pre>
          </div>
        );
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      i++;
      continue;
    }

    // Handle headers
    if (line.match(/^#{1,6}\s/)) {
      // Flush any pending list items
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${i}`} className="my-3 ml-6 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-slate-300 text-sm list-disc">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }

      const level = line.match(/^#+/)?.[0].length || 1;
      const text = line.slice(level + 1).trim();
      const headingClasses = [
        'text-3xl font-bold mt-8 mb-3',
        'text-2xl font-semibold mt-6 mb-2',
        'text-xl font-semibold mt-4 mb-2',
        'text-lg font-bold mt-3 mb-1',
        'text-base font-bold mt-2 mb-1',
        'text-sm font-bold mt-2 mb-1'
      ];
      const className = headingClasses[level - 1] || 'text-lg font-bold';
      
      elements.push(
        <div key={`h${level}-${i}`} className={`${className} text-white`}>
          {renderInlineMarkdown(text)}
        </div>
      );
      i++;
      continue;
    }

    // Handle lists (bullets, dashes, asterisks, numbered)
    if (line.match(/^\s*[-*]\s+/) || line.match(/^\s*\d+\.\s+/)) {
      // Flush if we were in a paragraph
      if (elements[elements.length - 1]?.type === 'p') {
        // Already in a list mode
      }

      // Extract list item text
      const itemMatch = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);
      if (itemMatch) {
        listItems.push(itemMatch[1]);
      }
      i++;
      continue;
    }

    // Flush list if we hit a non-list line
    if (listItems.length > 0 && line.trim() !== '') {
      elements.push(
        <ul key={`list-${i}`} className="my-3 ml-6 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-slate-300 text-sm list-disc">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }

    // Handle empty lines (paragraphs)
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-3 text-slate-300 text-sm leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  // Flush remaining list items
  if (listItems.length > 0) {
    elements.push(
      <ul key={`list-final`} className="my-3 ml-6 space-y-1">
        {listItems.map((item, idx) => (
          <li key={idx} className="text-slate-300 text-sm list-disc">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      {elements}
    </div>
  );
}

/**
 * Render inline markdown: bold, italic, code, links
 * Uses simple regex replacement with proper capture group handling
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  // Process bold first (highest priority, non-greedy)
  const boldRegex = /\*\*(.+?)\*\*/;
  let boldMatch;
  while ((boldMatch = remaining.match(boldRegex)) !== null) {
    const [fullMatch, content] = boldMatch;
    const beforeIndex = remaining.indexOf(fullMatch);
    
    if (beforeIndex > 0) {
      parts.push(remaining.substring(0, beforeIndex));
    }
    parts.push(
      <strong key={`bold-${keyCounter++}`} className="font-bold text-white">
        {content}
      </strong>
    );
    remaining = remaining.substring(beforeIndex + fullMatch.length);
  }
  
  if (remaining) parts.push(remaining);
  if (parts.length === 0) return text;

  // Process italic on accumulated text
  const italicParts: React.ReactNode[] = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      let italicRemaining = part;
      let italicMatch;
      while ((italicMatch = italicRemaining.match(/\*(.+?)\*/)) !== null) {
        const [fullMatch, content] = italicMatch;
        const beforeIndex = italicRemaining.indexOf(fullMatch);
        
        if (beforeIndex > 0) {
          italicParts.push(italicRemaining.substring(0, beforeIndex));
        }
        italicParts.push(
          <em key={`italic-${keyCounter++}`} className="italic text-slate-200">
            {content}
          </em>
        );
        italicRemaining = italicRemaining.substring(beforeIndex + fullMatch.length);
      }
      if (italicRemaining) italicParts.push(italicRemaining);
    } else {
      italicParts.push(part);
    }
  }

  // Process code on accumulated text
  const codeParts: React.ReactNode[] = [];
  for (const part of italicParts) {
    if (typeof part === 'string') {
      let codeRemaining = part;
      let codeMatch;
      while ((codeMatch = codeRemaining.match(/`(.+?)`/)) !== null) {
        const [fullMatch, content] = codeMatch;
        const beforeIndex = codeRemaining.indexOf(fullMatch);
        
        if (beforeIndex > 0) {
          codeParts.push(codeRemaining.substring(0, beforeIndex));
        }
        codeParts.push(
          <code key={`code-${keyCounter++}`} className="bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-cyan-300">
            {content}
          </code>
        );
        codeRemaining = codeRemaining.substring(beforeIndex + fullMatch.length);
      }
      if (codeRemaining) codeParts.push(codeRemaining);
    } else {
      codeParts.push(part);
    }
  }

  // Process links on accumulated text
  const linkParts: React.ReactNode[] = [];
  for (const part of codeParts) {
    if (typeof part === 'string') {
      let linkRemaining = part;
      let linkMatch;
      while ((linkMatch = linkRemaining.match(/\[(.+?)\]\((.+?)\)/)) !== null) {
        const [fullMatch, text, url] = linkMatch;
        const beforeIndex = linkRemaining.indexOf(fullMatch);
        
        if (beforeIndex > 0) {
          linkParts.push(linkRemaining.substring(0, beforeIndex));
        }
        linkParts.push(
          <a key={`link-${keyCounter++}`} href={url} className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        );
        linkRemaining = linkRemaining.substring(beforeIndex + fullMatch.length);
      }
      if (linkRemaining) linkParts.push(linkRemaining);
    } else {
      linkParts.push(part);
    }
  }

  return linkParts.length === 0 ? text : linkParts;
}
