import { EditorContent, useEditor  } from "@tiptap/react";
import type {Editor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useRef } from "react";

type Props = { content: any; onChange: (doc: any) => void; onUpload: (f: File) => Promise<string> };

export function RichEditor({ content, onChange, onUpload }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false } } as any),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: { attributes: { class: "prose-editorial" } },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  return (
    <div className="tiptap-editor border border-rule bg-card">
      {editor && <Toolbar editor={editor} onUpload={onUpload} />}
      <div className="mx-auto max-w-[720px] px-6 py-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor, onUpload }: { editor: Editor; onUpload: Props["onUpload"] }) {
  const file = useRef<HTMLInputElement>(null);
  const btn = (label: string, run: () => void, active = false, title?: string) => (
    <button
      type="button"
      title={title ?? label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      className={`px-2 py-1 text-[13px] ${active ? "bg-ink text-paper" : "text-ink-soft hover:bg-muted hover:text-ink"}`}
    >
      {label}
    </button>
  );
  const c = () => editor.chain().focus();
  const sep = <span className="mx-1 h-5 w-px bg-rule" />;
  const inTable = editor.isActive("table");

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-rule bg-card px-2 py-1.5">
      {btn("P", () => c().setParagraph().run(), editor.isActive("paragraph"), "Paragraph")}
      {btn("H2", () => c().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
      {btn("H3", () => c().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
      {sep}
      {btn("B", () => c().toggleBold().run(), editor.isActive("bold"), "Bold")}
      {btn("I", () => c().toggleItalic().run(), editor.isActive("italic"), "Italic")}
      {btn("U", () => c().toggleUnderline().run(), editor.isActive("underline"), "Underline")}
      {btn("Link", () => {
        const prev = editor.getAttributes("link")["href"] as string | undefined;
        const url = window.prompt("Link address", prev ?? "https://");
        if (url === null) return;
        if (!url) c().unsetLink().run();
        else c().extendMarkRange("link").setLink({ href: url }).run();
      }, editor.isActive("link"))}
      {sep}
      {btn("• List", () => c().toggleBulletList().run(), editor.isActive("bulletList"))}
      {btn("1. List", () => c().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {btn("Quote", () => c().toggleBlockquote().run(), editor.isActive("blockquote"))}
      {btn("Rule", () => c().setHorizontalRule().run())}
      {sep}
      {btn("Image", () => file.current?.click())}
      {btn("Table", () => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
      {inTable && (
        <>
          {btn("+Row", () => c().addRowAfter().run())}
          {btn("+Col", () => c().addColumnAfter().run())}
          {btn("−Row", () => c().deleteRow().run())}
          {btn("−Col", () => c().deleteColumn().run())}
          {btn("×Table", () => c().deleteTable().run())}
        </>
      )}
      {sep}
      {btn("Undo", () => c().undo().run())}
      {btn("Redo", () => c().redo().run())}
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const src = await onUpload(f);
          const alt = window.prompt("Describe the image (alt text)", "") ?? "";
          const caption = window.prompt("Caption / credit (optional)", "") ?? "";
          c().setImage({ src, alt, ...(caption ? { title: caption } : {}) }).run();
        }}
      />
    </div>
  );
}
