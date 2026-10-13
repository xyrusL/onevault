import React from 'react';
import { ChartPieSlice, PlayCircle } from '@phosphor-icons/react';
import { contentToHtml } from '../utils/note-format.utils';
import { parseChartsAndEmbedsFromHtml } from '../utils/note-embed.utils';
import { NoteChartWidget } from './full-view/NoteChartWidget';
import { NoteEmbedMediaWidget } from './full-view/NoteEmbedMediaWidget';

interface NoteContentRendererProps {
  content: string;
  maxLines?: number;
  className?: string;
}

export const NoteContentRenderer: React.FC<NoteContentRendererProps> = ({
  content,
  maxLines = 6,
  className = '',
}) => {
  if (!content || !content.trim()) {
    return <p className="text-xs italic opacity-60">Empty note...</p>;
  }

  const { charts, embeds, cleanHtml } = parseChartsAndEmbedsFromHtml(content);
  const html = contentToHtml(cleanHtml);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Rich Text Markdown / Tiptap Output */}
      {html && html !== '<p><br></p>' && (
        <div
          className={`prose-note text-xs leading-relaxed space-y-1 ${
            maxLines ? 'line-clamp-6 overflow-hidden' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      {/* When in Card Preview mode (maxLines present), display compact badges */}
      {maxLines ? (
        (charts.length > 0 || embeds.length > 0) && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {charts.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-medium"
              >
                <ChartPieSlice size={11} weight="duotone" />
                <span>{c.type} chart</span>
              </span>
            ))}
            {embeds.map((e) => (
              <span
                key={e.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-medium"
              >
                <PlayCircle size={11} weight="fill" />
                <span>{e.type} embed</span>
              </span>
            ))}
          </div>
        )
      ) : (
        /* Full Rendering Mode: Render Interactive Widgets */
        <div className="space-y-3 pt-2">
          {charts.map((c) => (
            <NoteChartWidget key={c.id} chart={c} readOnly />
          ))}
          {embeds.map((e) => (
            <NoteEmbedMediaWidget key={e.id} embed={e} readOnly />
          ))}
        </div>
      )}
    </div>
  );
};
