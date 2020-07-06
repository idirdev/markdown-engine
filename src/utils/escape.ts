const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const htmlUnescapeMap: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => htmlEscapeMap[ch] || ch);
}

export function unescapeHtml(str: string): string {
  return str.replace(/&(amp|lt|gt|quot|#39);/g, (match) => htmlUnescapeMap[match] || match);
}

export function encodeUrl(url: string): string {
  return encodeURI(url)
    .replace(/%25/g, '%')
    .replace(/%5B/g, '[')
    .replace(/%5D/g, ']');
}

export function decodeUrl(url: string): string {
  return decodeURIComponent(url);
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
