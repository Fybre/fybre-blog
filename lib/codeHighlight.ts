import { common, createLowlight } from 'lowlight';

export const lowlight = createLowlight(common);

type HighlightNode = {
  type?: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HighlightNode[];
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const decodeHtml = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

const renderNode = (node: HighlightNode): string => {
  if (node.type === 'text') {
    return escapeHtml(node.value || '');
  }

  const children = (node.children || []).map(renderNode).join('');

  if (node.type !== 'element' || !node.tagName) {
    return children;
  }

  const className = node.properties?.className;
  const classValue = Array.isArray(className) ? className.join(' ') : typeof className === 'string' ? className : '';
  const classAttribute = classValue ? ` class="${escapeHtml(classValue)}"` : '';

  return `<${node.tagName}${classAttribute}>${children}</${node.tagName}>`;
};

export function highlightCodeHtml(language: string, codeHtml: string) {
  if (codeHtml.includes('hljs-')) {
    return codeHtml;
  }

  try {
    const tree = lowlight.highlight(language, decodeHtml(codeHtml)) as HighlightNode;
    return (tree.children || []).map(renderNode).join('');
  } catch {
    return codeHtml;
  }
}
