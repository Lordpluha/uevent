import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type EditorState,
  type ElementNode,
  type TextFormatType,
} from 'lexical';

import { cn } from '@shared/lib/utils';

/* ── Types ────────────────────────────────────────────────────────────── */

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number' | 'quote';

/* ── Toolbar button ───────────────────────────────────────────────────── */

interface ToolbarBtnProps {
  active?: boolean;
  title: string;
  onPress: () => void;
  children: React.ReactNode;
}

function ToolbarBtn({ active, title, onPress, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={cn(
        'flex h-7 min-w-7 items-center justify-center rounded px-1 text-sm transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

/* ── Toolbar plugin ───────────────────────────────────────────────────── */

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>('paragraph');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsUnderline(selection.hasFormat('underline'));
    setIsStrike(selection.hasFormat('strikethrough'));
    setIsCode(selection.hasFormat('code'));

    const anchor = selection.anchor.getNode();
    const element =
      anchor.getKey() === 'root' ? anchor : anchor.getTopLevelElementOrThrow();
    const elementDOM = editor.getElementByKey(element.getKey());
    if (!elementDOM) return;

    const tag = elementDOM.tagName.toLowerCase();
    if (tag === 'h1') setBlockType('h1');
    else if (tag === 'h2') setBlockType('h2');
    else if (tag === 'h3') setBlockType('h3');
    else if (tag === 'blockquote') setBlockType('quote');
    else if (tag === 'ul') setBlockType('bullet');
    else if (tag === 'ol') setBlockType('number');
    else setBlockType('paragraph');
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(updateToolbar);
    });
  }, [editor, updateToolbar]);

  const dispatchFmt = (fmt: TextFormatType) =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, fmt);

  const formatBlock = (type: BlockType) => {
    if (type === 'bullet') {
      if (blockType === 'bullet') editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      else editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      return;
    }
    if (type === 'number') {
      if (blockType === 'number') editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      else editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      return;
    }
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchor = selection.anchor.getNode();
      const element: ElementNode =
        anchor.getKey() === 'root'
          ? (anchor as unknown as ElementNode)
          : anchor.getTopLevelElementOrThrow();

      let newElement: ElementNode;
      if (type === 'paragraph') {
        newElement = $createParagraphNode();
      } else if (type === 'quote') {
        newElement = $createQuoteNode();
      } else {
        newElement = $createHeadingNode(type);
      }

      const children = element.getChildren();
      for (const child of children) {
        newElement.append(child);
      }
      element.replace(newElement);
    });
  };

  return (
    <div className="flex flex-wrap gap-0.5 border-b border-border bg-muted/30 p-1.5">
      <ToolbarBtn active={blockType === 'h1'} title="Heading 1" onPress={() => formatBlock('h1')}>
        <span className="text-xs font-bold leading-none">H1</span>
      </ToolbarBtn>
      <ToolbarBtn active={blockType === 'h2'} title="Heading 2" onPress={() => formatBlock('h2')}>
        <span className="text-xs font-bold leading-none">H2</span>
      </ToolbarBtn>
      <ToolbarBtn active={blockType === 'h3'} title="Heading 3" onPress={() => formatBlock('h3')}>
        <span className="text-xs font-bold leading-none">H3</span>
      </ToolbarBtn>
      <ToolbarBtn active={blockType === 'quote'} title="Quote" onPress={() => formatBlock('quote')}>
        <span className="text-xs font-bold leading-none">❝</span>
      </ToolbarBtn>

      <div className="mx-1 w-px self-stretch bg-border" />

      <ToolbarBtn active={isBold} title="Bold" onPress={() => dispatchFmt('bold')}>
        <span className="text-xs font-bold leading-none">B</span>
      </ToolbarBtn>
      <ToolbarBtn active={isItalic} title="Italic" onPress={() => dispatchFmt('italic')}>
        <span className="text-xs italic font-bold leading-none">I</span>
      </ToolbarBtn>
      <ToolbarBtn active={isUnderline} title="Underline" onPress={() => dispatchFmt('underline')}>
        <span className="text-xs underline font-bold leading-none">U</span>
      </ToolbarBtn>
      <ToolbarBtn active={isStrike} title="Strikethrough" onPress={() => dispatchFmt('strikethrough')}>
        <span className="text-xs line-through font-bold leading-none">S</span>
      </ToolbarBtn>
      <ToolbarBtn active={isCode} title="Inline code" onPress={() => dispatchFmt('code')}>
        <span className="font-mono text-xs font-bold leading-none">`</span>
      </ToolbarBtn>

      <div className="mx-1 w-px self-stretch bg-border" />

      <ToolbarBtn active={blockType === 'bullet'} title="Bullet list" onPress={() => formatBlock('bullet')}>
        <span className="text-xs font-bold leading-none">•≡</span>
      </ToolbarBtn>
      <ToolbarBtn active={blockType === 'number'} title="Numbered list" onPress={() => formatBlock('number')}>
        <span className="text-xs font-bold leading-none">1≡</span>
      </ToolbarBtn>
    </div>
  );
}

/* ── Initial value plugin ─────────────────────────────────────────────── */

function InitialValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    editor.update(() => {
      $convertFromMarkdownString(value, TRANSFORMERS);
    });
    setInitialized(true);
  }, [editor, value, initialized]);

  return null;
}

/* ── Lexical theme ────────────────────────────────────────────────────── */

const EDITOR_THEME = {
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'rounded bg-muted px-1 py-0.5 font-mono text-xs',
  },
  quote: 'border-l-2 border-muted-foreground pl-3 italic text-muted-foreground my-1',
  heading: {
    h1: 'text-2xl font-bold mb-2',
    h2: 'text-xl font-semibold mb-2',
    h3: 'text-base font-semibold mb-1',
  },
  list: {
    ul: 'ml-4 list-disc',
    ol: 'ml-4 list-decimal',
    listitem: 'my-0.5',
  },
  link: 'text-primary underline underline-offset-2 cursor-pointer',
  paragraph: 'mb-1',
};

const EDITOR_NODES = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, CodeNode];

/* ── Main component ───────────────────────────────────────────────────── */

export interface RichTextEditorProps {
  /** Markdown string used as the initial content */
  defaultValue?: string;
  /** Called with a markdown string whenever the editor content changes */
  onChange?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  /** Disable the editor */
  disabled?: boolean;
  /** Render in read-only mode while preserving content styles */
  readOnly?: boolean;
  /** Show formatting toolbar */
  showToolbar?: boolean;
  autoFocus?: boolean;
  'aria-invalid'?: ComponentProps<'div'>['aria-invalid'];
}

export function RichTextEditor({
  defaultValue,
  onChange,
  placeholder = 'Start writing…',
  className,
  disabled = false,
  readOnly = false,
  showToolbar = true,
  autoFocus = false,
  'aria-invalid': ariaInvalid,
}: RichTextEditorProps) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (!onChange) return;
      editorState.read(() => {
        onChange($convertToMarkdownString(TRANSFORMERS));
      });
    },
    [onChange],
  );

  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'RichTextEditor',
        theme: EDITOR_THEME,
        nodes: EDITOR_NODES,
        onError: (error: Error) => console.error('[RichTextEditor]', error),
        editable: !(disabled || readOnly),
      }}
    >
      <div
        data-slot="input"
        aria-invalid={ariaInvalid}
        className={cn(
          'relative w-full rounded-md border border-input bg-input/20 transition-colors',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
          'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
          className,
        )}
      >
        {showToolbar && !readOnly && <ToolbarPlugin />}
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-[160px] px-3 py-2 text-sm leading-relaxed outline-none"
              aria-placeholder={placeholder}
              placeholder={
                <div className="pointer-events-none absolute top-[calc(2.25rem+0.5rem)] left-0 px-3 text-sm text-muted-foreground select-none">
                  {placeholder}
                </div>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        {!readOnly && <OnChangePlugin onChange={handleChange} />}
        {!readOnly && <HistoryPlugin />}
        <ListPlugin />
        <LinkPlugin />
        {!readOnly && <MarkdownShortcutPlugin transformers={TRANSFORMERS} />}
        {autoFocus && !readOnly && <AutoFocusPlugin />}
        {defaultValue && <InitialValuePlugin value={defaultValue} />}
      </div>
    </LexicalComposer>
  );
}
