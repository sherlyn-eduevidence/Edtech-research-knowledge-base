// Turns [[slug]] and [[slug|Label]] into real links to /articles/slug or
// /concepts/slug, resolved against the actual .md files on disk at build
// time. Unresolvable links are rendered as plain text with a trailing
// "(unresolved)" marker rather than a broken href, so a bad wikilink is
// visible instead of silently 404ing.
import { readdirSync } from 'node:fs';
import { visit } from 'unist-util-visit';

function slugsIn(dir) {
  try {
    return new Set(
      readdirSync(dir)
        .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
        .map((f) => f.replace(/\.md$/, ''))
    );
  } catch {
    return new Set();
  }
}

export default function remarkWikilinks({ articlesDir, conceptsDir, basePath }) {
  const articleSlugs = slugsIn(articlesDir);
  const conceptSlugs = slugsIn(conceptsDir);
  const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value.includes('[[')) return;
      const parts = [];
      let last = 0;
      let match;
      WIKILINK.lastIndex = 0;
      while ((match = WIKILINK.exec(node.value))) {
        const [full, slug, label] = match;
        if (match.index > last) {
          parts.push({ type: 'text', value: node.value.slice(last, match.index) });
        }
        if (articleSlugs.has(slug)) {
          parts.push({
            type: 'link',
            url: `${basePath}/articles/${slug}`,
            children: [{ type: 'text', value: label ?? slug }],
          });
        } else if (conceptSlugs.has(slug)) {
          parts.push({
            type: 'link',
            url: `${basePath}/concepts/${slug}`,
            children: [{ type: 'text', value: label ?? slug }],
          });
        } else {
          parts.push({ type: 'text', value: `${label ?? slug} (unresolved)` });
        }
        last = match.index + full.length;
      }
      if (last < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(last) });
      }
      if (parts.length) parent.children.splice(index, 1, ...parts);
    });
  };
}
