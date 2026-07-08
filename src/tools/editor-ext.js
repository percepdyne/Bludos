// TipTap plumbing shared by the editor: a decoration plugin that paints
// [[wiki-links]] as clickable spans, and the slash-command definitions.
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const WIKI = /\[\[([^\]]+)\]\]/g;

// Paint [[...]] inline. Actual resolve/navigate is handled in Editor.jsx via a
// delegated click listener (async IPC), so here we only style the ranges.
export const WikiLink = Extension.create({
  name: 'wikiLink',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('wikiLinkDeco'),
        props: {
          decorations(state) {
            const decos = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText) return;
              let m;
              WIKI.lastIndex = 0;
              while ((m = WIKI.exec(node.text)) !== null) {
                decos.push(Decoration.inline(pos + m.index, pos + m.index + m[0].length, {
                  class: 'wikilink',
                  'data-target': m[1].trim(),
                }));
              }
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});

// Slash commands: label, keyword, and a markdown/action producer.
export const SLASH_COMMANDS = [
  { key: 'h2', title: 'Heading', desc: 'section', md: '## ' },
  { key: 'todo', title: 'Checklist item', desc: 'task', md: '- [ ] ' },
  { key: 'table', title: 'Table 3×3', desc: 'grid', action: 'table' },
  { key: 'divider', title: 'Divider', desc: 'hr', md: '\n---\n' },
  { key: 'date', title: 'Date stamp', desc: 'today', md: () => new Date().toISOString().slice(0, 10) + ' ' },
  { key: 'status', title: 'Status table', desc: 'R/A/G', md: '| Item | Status | Owner |\n| --- | --- | --- |\n|  | 🟡 |  |\n' },
  { key: 'decision', title: 'Decision record', desc: 'DDR', md: '## Decision\n\n**Status:** proposed\n\n### Context\n\n### Decision\n\n### Consequences\n' },
  { key: 'link', title: 'Wiki link', desc: '[[…]]', md: '[[]]' },
  { key: 'calc', title: 'Calculator…', desc: 'toolbox', action: 'toolbox' },
];
