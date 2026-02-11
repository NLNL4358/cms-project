/**
 * @description
 * TipTap 기반 리치 텍스트 에디터.
 * DynamicField의 richtext 타입에서 사용됩니다.
 */
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Code,
    Quote,
    Undo,
    Redo,
    RemoveFormatting,
} from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} props.value - HTML 문자열
 * @param {Function} props.onChange - 변경 콜백 (HTML 문자열)
 * @param {string} [props.placeholder] - 플레이스홀더
 */
function RichTextEditor({ value, onChange, placeholder }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
            }),
            Image,
            Placeholder.configure({
                placeholder: placeholder || '내용을 입력하세요...',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
        ],
        content: value || '',
        onUpdate: ({ editor: ed }) => {
            const html = ed.getHTML();
            onChange(html === '<p></p>' ? '' : html);
        },
    });

    if (!editor) return null;

    return (
        <div className="richtext-editor border rounded-md overflow-hidden">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} className="richtext-content" />
        </div>
    );
}

function Toolbar({ editor }) {
    const addLink = () => {
        const url = window.prompt('URL을 입력하세요');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    return (
        <div className="richtext-toolbar flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
            {/* 텍스트 서식 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
                title="굵게"
            >
                <Bold className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
                title="기울임"
            >
                <Italic className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive('underline')}
                title="밑줄"
            >
                <UnderlineIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive('strike')}
                title="취소선"
            >
                <Strikethrough className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* 제목 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor.isActive('heading', { level: 1 })}
                title="제목 1"
            >
                <Heading1 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive('heading', { level: 2 })}
                title="제목 2"
            >
                <Heading2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive('heading', { level: 3 })}
                title="제목 3"
            >
                <Heading3 className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* 목록 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
                title="글머리 기호"
            >
                <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive('orderedList')}
                title="번호 매기기"
            >
                <ListOrdered className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* 정렬 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                active={editor.isActive({ textAlign: 'left' })}
                title="왼쪽 정렬"
            >
                <AlignLeft className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                active={editor.isActive({ textAlign: 'center' })}
                title="가운데 정렬"
            >
                <AlignCenter className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                active={editor.isActive({ textAlign: 'right' })}
                title="오른쪽 정렬"
            >
                <AlignRight className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* 기타 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive('blockquote')}
                title="인용"
            >
                <Quote className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={editor.isActive('codeBlock')}
                title="코드 블록"
            >
                <Code className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={addLink}
                active={editor.isActive('link')}
                title="링크"
            >
                <LinkIcon className="size-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* 실행취소/다시실행 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="실행취소"
            >
                <Undo className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="다시실행"
            >
                <Redo className="size-4" />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                title="서식 지우기"
            >
                <RemoveFormatting className="size-4" />
            </ToolbarButton>
        </div>
    );
}

function ToolbarButton({ onClick, active, disabled, title, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`richtext-toolbar-btn inline-flex items-center justify-center rounded p-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 ${
                active ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground'
            }`}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return <div className="mx-1 h-5 w-px bg-border" />;
}

export default RichTextEditor;
