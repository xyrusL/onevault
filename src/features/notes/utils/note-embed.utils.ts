import { NoteChartConfig, NoteEmbedConfig, NoteEmbedType } from '../types/notes.types';

export function detectEmbedType(rawUrl: string): NoteEmbedType {
  const url = rawUrl.trim().toLowerCase();
  if (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('youtube-nocookie.com')
  ) {
    return 'youtube';
  }
  if (
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.ogg') ||
    url.endsWith('.mov')
  ) {
    return 'video';
  }
  if (
    url.endsWith('.mp3') ||
    url.endsWith('.wav') ||
    url.endsWith('.aac') ||
    url.endsWith('.m4a') ||
    url.endsWith('.ogg')
  ) {
    return 'audio';
  }
  return 'link';
}

export function getYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim());
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
      if (url.pathname.startsWith('/embed/')) return rawUrl;
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2];
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
      }
    }
  } catch {
    // If invalid URL, fallback to null
  }
  return null;
}

export function chartToHtml(config: NoteChartConfig): string {
  const json = encodeURIComponent(JSON.stringify(config));
  return `<div data-note-chart="true" data-chart-config="${json}" class="ov-note-chart-placeholder"></div>`;
}

export function embedToHtml(config: NoteEmbedConfig): string {
  const json = encodeURIComponent(JSON.stringify(config));
  return `<div data-note-embed="true" data-embed-config="${json}" class="ov-note-embed-placeholder"></div>`;
}

export function parseChartsAndEmbedsFromHtml(html: string): {
  charts: NoteChartConfig[];
  embeds: NoteEmbedConfig[];
  cleanHtml: string;
} {
  const charts: NoteChartConfig[] = [];
  const embeds: NoteEmbedConfig[] = [];

  // Match data-note-chart blocks
  const chartRegex = /<div[^>]*data-note-chart="true"[^>]*data-chart-config="([^"]+)"[^>]*>.*?<\/div>/gi;
  let cleanHtml = html.replace(chartRegex, (_match, encoded) => {
    try {
      const decoded = decodeURIComponent(encoded);
      const parsed = JSON.parse(decoded) as NoteChartConfig;
      if (parsed && parsed.id) {
        charts.push(parsed);
      }
    } catch {
      // Ignore invalid JSON
    }
    return '';
  });

  // Match data-note-embed blocks
  const embedRegex = /<div[^>]*data-note-embed="true"[^>]*data-embed-config="([^"]+)"[^>]*>.*?<\/div>/gi;
  cleanHtml = cleanHtml.replace(embedRegex, (_match, encoded) => {
    try {
      const decoded = decodeURIComponent(encoded);
      const parsed = JSON.parse(decoded) as NoteEmbedConfig;
      if (parsed && parsed.id) {
        embeds.push(parsed);
      }
    } catch {
      // Ignore invalid JSON
    }
    return '';
  });

  return { charts, embeds, cleanHtml };
}
