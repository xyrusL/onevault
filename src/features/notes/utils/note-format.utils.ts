/**
 * Utilities for Notion / Google Keep style formatting:
 * Converts markdown and legacy markup to clean semantic rich HTML matching Tiptap's schema,
 * ensuring formatted text and interactive checklists display correctly in both the editor and note cards.
 */

export function formatInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[11px]">$1</code>');
}

/**
 * Normalizes legacy checkbox markup `<div class="..."><input type="checkbox"...><span>...</span></div>`
 * into standard Tiptap task list items `<ul data-type="taskList"><li data-type="taskItem" ...>...</li></ul>`.
 */
function normalizeLegacyCheckboxes(html: string): string {
  let transformed = html.replace(
    /<div[^>]*class="[^"]*flex[^"]*"[^>]*>\s*<input[^>]*type="checkbox"([^>]*)>\s*(?:<span[^>]*class="[^"]*line-through[^"]*"[^>]*>|<span[^>]*>)?([\s\S]*?)(?:<\/span>)?\s*<\/div>/gi,
    (_match, inputAttrs, text) => {
      const isChecked = /checked/i.test(inputAttrs);
      return `<li data-type="taskItem" data-checked="${isChecked ? 'true' : 'false'}"><label><input type="checkbox"${
        isChecked ? ' checked="checked"' : ''
      }><span></span></label><div><p>${text.trim()}</p></div></li>`;
    }
  );

  if (transformed.includes('data-type="taskItem"') && !transformed.includes('data-type="taskList"')) {
    transformed = `<ul data-type="taskList">${transformed}</ul>`;
  }

  return transformed;
}

export function contentToHtml(raw: string): string {
  if (!raw || !raw.trim()) {
    return '<p><br></p>';
  }

  // 1. Normalize any legacy div+input checkboxes if present
  let normalized = normalizeLegacyCheckboxes(raw);

  // 2. Check if there are markdown elements that need parsing
  const hasMarkdownChecklist = /^[-*]\s*\[[xX\s]\]/m.test(normalized);
  const hasMarkdownBullet = /^[-*]\s+/m.test(normalized);
  const hasMarkdownHeading = /^#{1,3}\s+/m.test(normalized);

  // If already rich HTML with no raw markdown lines, return as-is
  if (
    /<(p|h[1-6]|ul|ol|blockquote|pre)/i.test(normalized) &&
    !hasMarkdownChecklist &&
    !hasMarkdownBullet &&
    !hasMarkdownHeading
  ) {
    return normalized;
  }

  const lines = normalized.split(/\r?\n/);
  const htmlParts: string[] = [];
  let inTaskList = false;
  let inBulletList = false;

  const closeOpenLists = () => {
    if (inTaskList) {
      htmlParts.push('</ul>');
      inTaskList = false;
    }
    if (inBulletList) {
      htmlParts.push('</ul>');
      inBulletList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      closeOpenLists();
      htmlParts.push('<p><br></p>');
      continue;
    }

    // Task / Checklist item: - [ ] or - [x] or * [ ] or * [x]
    const taskMatch = trimmed.match(/^[-*]\s*\[([xX\s])\]\s*(.*)$/);
    if (taskMatch) {
      if (inBulletList) {
        htmlParts.push('</ul>');
        inBulletList = false;
      }
      if (!inTaskList) {
        htmlParts.push('<ul data-type="taskList">');
        inTaskList = true;
      }
      const isChecked = taskMatch[1].toLowerCase() === 'x';
      const text = taskMatch[2];
      htmlParts.push(
        `<li data-type="taskItem" data-checked="${isChecked ? 'true' : 'false'}"><label><input type="checkbox"${
          isChecked ? ' checked="checked"' : ''
        }><span></span></label><div><p>${formatInline(text) || '<br>'}</p></div></li>`
      );
      continue;
    }

    // Standard bullet list item: - item or * item
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (inTaskList) {
        htmlParts.push('</ul>');
        inTaskList = false;
      }
      if (!inBulletList) {
        htmlParts.push('<ul>');
        inBulletList = true;
      }
      const text = bulletMatch[1];
      htmlParts.push(`<li>${formatInline(text) || '<br>'}</li>`);
      continue;
    }

    // Not a list item - close any open lists
    closeOpenLists();

    // Heading 1: #
    if (trimmed.startsWith('# ')) {
      htmlParts.push(`<h1>${formatInline(trimmed.slice(2))}</h1>`);
      continue;
    }

    // Heading 2: ##
    if (trimmed.startsWith('## ')) {
      htmlParts.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`);
      continue;
    }

    // Heading 3: ###
    if (trimmed.startsWith('### ')) {
      htmlParts.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`);
      continue;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      htmlParts.push(`<blockquote><p>${formatInline(trimmed.slice(2))}</p></blockquote>`);
      continue;
    }

    // Code block: ```
    if (trimmed.startsWith('```')) {
      const codeLang = trimmed.slice(3);
      htmlParts.push(`<pre><code>${codeLang || ''}</code></pre>`);
      continue;
    }

    // Line already wrapped in HTML tags like <p>, <h1>, etc.
    if (/^<[a-z]+[^>]*>[\s\S]*<\/[a-z]+>$/i.test(trimmed)) {
      htmlParts.push(trimmed);
      continue;
    }

    // Standard paragraph
    htmlParts.push(`<p>${formatInline(trimmed)}</p>`);
  }

  closeOpenLists();

  return htmlParts.join('');
}

import type { Editor } from '@tiptap/react';

export type NoteFormatTool =
  | 'bold'
  | 'italic'
  | 'h1'
  | 'h2'
  | 'bulletList'
  | 'taskList'
  | 'blockquote'
  | 'codeBlock';

/**
 * Checks whether a given toolbar tool is currently active in the editor.
 * Requires editor to be focused so tools don't falsely highlight on initial note open.
 * Accurately reports all formats applied on the text (e.g. Bold + Heading 1).
 */
export function isEditorToolActive(editor: Editor | null, tool: NoteFormatTool): boolean {
  if (!editor || !editor.isFocused) return false;

  switch (tool) {
    case 'bold':
      return editor.isActive('bold');
    case 'italic':
      return editor.isActive('italic');
    case 'h1':
      return editor.isActive('heading', { level: 1 });
    case 'h2':
      return editor.isActive('heading', { level: 2 });
    case 'bulletList':
      return editor.isActive('bulletList');
    case 'taskList':
      return editor.isActive('taskList');
    case 'blockquote':
      return editor.isActive('blockquote');
    case 'codeBlock':
      return editor.isActive('codeBlock');
    default:
      return false;
  }
}

/**
 * Executes a formatting tool action on the editor.
 * Rules:
 * 1. If NO selection/highlight is made on an existing text block, DO NOT reformat existing text!
 * 2. If text IS highlighted, format only that selected text.
 * 3. Supports real-world combined formatting: Bold can be combined with headings, lists, etc.
 * 4. Active tools accurately display all formats currently applied on the text.
 */
export function executeEditorToolbarAction(editor: Editor | null, tool: NoteFormatTool): void {
  if (!editor) return;

  const isSelectionEmpty = editor.state.selection.empty;
  const { $from } = editor.state.selection;
  const currentBlockText = $from.parent?.textContent ?? '';
  const hasExistingBlockText = currentBlockText.trim().length > 0;

  // Rule 1: If there is NO text highlighted and the current line already has existing text,
  // do NOT reformat the existing text! (User did not select which part to format).
  if (isSelectionEmpty && hasExistingBlockText) {
    // For block tools: only allow toggling OFF if already active; otherwise do not modify existing text
    if (
      tool === 'h1' ||
      tool === 'h2' ||
      tool === 'bulletList' ||
      tool === 'taskList' ||
      tool === 'blockquote' ||
      tool === 'codeBlock'
    ) {
      if (
        (tool === 'h1' && editor.isActive('heading', { level: 1 })) ||
        (tool === 'h2' && editor.isActive('heading', { level: 2 })) ||
        (tool === 'bulletList' && editor.isActive('bulletList')) ||
        (tool === 'taskList' && editor.isActive('taskList')) ||
        (tool === 'blockquote' && editor.isActive('blockquote')) ||
        (tool === 'codeBlock' && editor.isActive('codeBlock'))
      ) {
        editor.chain().focus().setParagraph().run();
      }
      return;
    }

    // For inline marks: do not bold/italicize existing words without an explicit selection.
    if (tool === 'bold') {
      editor.chain().focus().toggleMark('bold', {}, { extendEmptyMarkRange: false }).run();
      return;
    }
    if (tool === 'italic') {
      editor.chain().focus().toggleMark('italic', {}, { extendEmptyMarkRange: false }).run();
      return;
    }
  }

  // Rule 2: Active tool toggle OFF (deselect)
  const isActive = isEditorToolActive(editor, tool);
  if (isActive) {
    switch (tool) {
      case 'bold':
        editor.chain().focus().unsetBold().run();
        break;
      case 'italic':
        editor.chain().focus().unsetItalic().run();
        break;
      case 'h1':
      case 'h2':
        editor.chain().focus().setParagraph().run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'taskList':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
    }
    return;
  }

  // Rule 3: Activating inline marks (bold, italic)
  // Inline marks can cleanly combine with headings, lists, quotes, and other styles!
  if (tool === 'bold') {
    editor.chain().focus().toggleMark('bold', {}, { extendEmptyMarkRange: false }).run();
    return;
  }

  if (tool === 'italic') {
    editor.chain().focus().toggleMark('italic', {}, { extendEmptyMarkRange: false }).run();
    return;
  }

  // Rule 4: Activating block tools (h1, h2, bulletList, taskList, blockquote, codeBlock)
  // Block tools change the block structure without stripping existing bold/italic text!
  let chain = editor.chain().focus();

  // Clear mutually exclusive block formatting before applying new block format
  if (editor.isActive('heading')) {
    chain = chain.setParagraph();
  }
  if (editor.isActive('codeBlock')) {
    chain = chain.toggleCodeBlock();
  }
  if (editor.isActive('blockquote')) {
    chain = chain.toggleBlockquote();
  }
  if (editor.isActive('bulletList')) {
    chain = chain.toggleBulletList();
  }
  if (editor.isActive('taskList')) {
    chain = chain.toggleTaskList();
  }

  switch (tool) {
    case 'h1':
      chain.setHeading({ level: 1 }).run();
      break;
    case 'h2':
      chain.setHeading({ level: 2 }).run();
      break;
    case 'bulletList':
      chain.toggleBulletList().run();
      break;
    case 'taskList':
      chain.toggleTaskList().run();
      break;
    case 'blockquote':
      chain.toggleBlockquote().run();
      break;
    case 'codeBlock':
      chain.toggleCodeBlock().run();
      break;
  }
}
