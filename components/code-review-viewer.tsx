"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createRoot, type Root } from "react-dom/client"
import { Editor, type OnMount } from "@monaco-editor/react"
import type { editor as MonacoEditorNS } from "monaco-editor"
import { useTheme } from "next-themes"
import { MessageSquare, X, Send } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo } from "@/lib/utils"
import type { LineComment } from "@/lib/types"
import { monacoLanguageMap } from "@/lib/types"
import { useSession } from "next-auth/react"

export type DraftComment = { line: number; content: string }

type MonacoEditorInstance = Parameters<OnMount>[0]
type MonacoNS = Parameters<OnMount>[1]

export function CodeReviewViewer({
  code,
  language,
  existingComments = [],
  mode = "view",
  drafts = [],
  onAddDraft,
  onRemoveDraft,
}: {
  code: string
  language?: string
  existingComments?: LineComment[]
  mode?: "view" | "review"
  drafts?: DraftComment[]
  onAddDraft?: (draft: DraftComment) => void
  onRemoveDraft?: (line: number) => void
}) {
  const { resolvedTheme } = useTheme()
  const { data: session } = useSession()
  const userName = session?.user?.name ?? "Moi"

  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [text, setText] = useState("")

  const editorRef = useRef<MonacoEditorInstance | null>(null)
  const monacoRef = useRef<MonacoNS | null>(null)
  const decorationsRef = useRef<ReturnType<MonacoEditorInstance["createDecorationsCollection"]> | null>(null)
  const zonesRef = useRef<
    Map<number, { zoneId: string; node: HTMLDivElement; root: Root; zone: MonacoEditorNS.IViewZone }>
  >(new Map())

  const monacoLanguage = language ? (monacoLanguageMap[language] ?? language.toLowerCase()) : "plaintext"

  const commentsByLine = existingComments.reduce<Record<number, LineComment[]>>((acc, c) => {
    acc[c.line] = acc[c.line] ? [...acc[c.line], c] : [c]
    return acc
  }, {})
  const draftByLine = new Map(drafts.map((d) => [d.line, d]))

  function openComposer(line: number) {
    setActiveLine(line)
    setText(draftByLine.get(line)?.content ?? "")
  }
  function cancelComposer() {
    setActiveLine(null)
    setText("")
  }
  function submit(line: number) {
    if (!text.trim()) return
    onAddDraft?.({ line, content: text.trim() })
    setActiveLine(null)
    setText("")
  }
  function remove(line: number) {
    onRemoveDraft?.(line)
  }

  // ─── Marge de glyphes : indicateur "+" pour ajouter un commentaire (mode review uniquement) ──
  const applyGlyphDecorations = useCallback(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    if (!decorationsRef.current) {
      decorationsRef.current = editor.createDecorationsCollection([])
    }
    if (mode !== "review") {
      decorationsRef.current.set([])
      return
    }
    const lineCount = editor.getModel()?.getLineCount() ?? 0
    const decorations: MonacoEditorNS.IModelDeltaDecoration[] = []
    for (let line = 1; line <= lineCount; line++) {
      decorations.push({
        range: new monaco.Range(line, 1, line, 1),
        options: { glyphMarginClassName: "review-add-glyph", glyphMarginHoverMessage: { value: "Ajouter un commentaire" } },
      })
    }
    decorationsRef.current.set(decorations)
  }, [mode])

  // ─── View zones : threads existants + brouillon + composeur, insérés sous la ligne concernée ──
  const syncZones = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const linesNeeded = new Set<number>()
    Object.keys(commentsByLine).forEach((k) => linesNeeded.add(Number(k)))
    drafts.forEach((d) => linesNeeded.add(d.line))
    if (activeLine != null) linesNeeded.add(activeLine)

    const currentLines = new Set(zonesRef.current.keys())

    editor.changeViewZones((accessor) => {
      currentLines.forEach((line) => {
        if (!linesNeeded.has(line)) {
          const z = zonesRef.current.get(line)
          if (z) {
            accessor.removeZone(z.zoneId)
            zonesRef.current.delete(line)
            queueMicrotask(() => z.root.unmount())
          }
        }
      })

      linesNeeded.forEach((line) => {
        let z = zonesRef.current.get(line)
        if (!z) {
          const node = document.createElement("div")
          node.style.width = "100%"
          const root = createRoot(node)
          const zone: MonacoEditorNS.IViewZone = { afterLineNumber: line, heightInPx: 1, domNode: node }
          const zoneId = accessor.addZone(zone)
          z = { zoneId, node, root, zone }
          zonesRef.current.set(line, z)
        }
        z.root.render(
          <ZoneContent
            comments={commentsByLine[line] ?? []}
            draft={draftByLine.get(line)}
            isComposing={activeLine === line}
            userName={userName}
            text={activeLine === line ? text : ""}
            onTextChange={setText}
            onEdit={() => openComposer(line)}
            onRemove={() => remove(line)}
            onCancel={cancelComposer}
            onSubmit={() => submit(line)}
          />,
        )
      })
    })

    // Mesure la hauteur réelle du contenu monté puis relayout (le rendu React est asynchrone).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const ed = editorRef.current
        if (!ed) return
        let changed = false
        ed.changeViewZones((accessor) => {
          zonesRef.current.forEach((z) => {
            const measured = Math.max(z.node.scrollHeight, 1)
            if (z.zone.heightInPx !== measured) {
              z.zone.heightInPx = measured
              accessor.layoutZone(z.zoneId)
              changed = true
            }
          })
        })
        void changed
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingComments, drafts, activeLine, text, userName])

  useEffect(() => {
    syncZones()
  }, [syncZones])

  useEffect(() => {
    applyGlyphDecorations()
  }, [applyGlyphDecorations])

  const handleMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance
    monacoRef.current = monaco
    applyGlyphDecorations()
    syncZones()

    editorInstance.onMouseDown((e) => {
      if (mode !== "review") return
      const type = e.target.type
      if (
        type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
        type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
      ) {
        const line = e.target.position?.lineNumber
        if (line) openComposer(line)
      }
    })
  }

  useEffect(() => {
    return () => {
      zonesRef.current.forEach((z) => {
        queueMicrotask(() => z.root.unmount())
      })
      zonesRef.current.clear()
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <style>{`
        .review-add-glyph {
          opacity: 0.25;
          cursor: pointer;
          transition: opacity 0.1s ease;
        }
        .review-add-glyph:hover { opacity: 1; }
        .review-add-glyph::before {
          content: "+";
          display: block;
          text-align: center;
          font-weight: 700;
          color: var(--color-primary, #6366f1);
        }
      `}</style>
      <Editor
        height={Math.max(320, code.split("\n").length * 20 + 40)}
        language={monacoLanguage}
        value={code}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
        onMount={handleMount}
        options={{
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "var(--font-geist-mono), monospace",
          lineNumbers: "on",
          glyphMargin: mode === "review",
          scrollBeyondLastLine: false,
          renderLineHighlight: "none",
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, alwaysConsumeMouseWheel: false },
          tabSize: 2,
          automaticLayout: true,
          contextmenu: false,
        }}
      />
      {mode === "review" && (
        <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-2.5 font-sans text-xs text-muted-foreground">
          <MessageSquare className="size-3.5" />
          Survolez la marge d'une ligne et cliquez sur + pour ajouter un commentaire en ligne.
        </div>
      )}
    </div>
  )
}

function ZoneContent({
  comments,
  draft,
  isComposing,
  userName,
  text,
  onTextChange,
  onEdit,
  onRemove,
  onCancel,
  onSubmit,
}: {
  comments: LineComment[]
  draft?: DraftComment
  isComposing: boolean
  userName: string
  text: string
  onTextChange: (v: string) => void
  onEdit: () => void
  onRemove: () => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div className="font-sans text-[13px]">
      {comments.map((c) => (
        <CommentRow key={c.id} name={c.author.name} content={c.content} time={timeAgo(c.createdAt)} />
      ))}

      {draft && !isComposing && (
        <div className="border-y border-border bg-muted/40 py-3 pl-4 pr-4">
          <div className="flex items-start gap-2.5">
            <UserAvatar name={userName} className="size-6" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{userName}</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  En attente
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground/90">{draft.content}</p>
              <div className="mt-1.5 flex gap-3 text-xs">
                <button type="button" onClick={onEdit} className="text-muted-foreground hover:text-foreground">
                  Modifier
                </button>
                <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isComposing && (
        <div className="border-y border-border bg-muted/40 py-3 pl-4 pr-4">
          <div className="flex items-start gap-2.5">
            <UserAvatar name={userName} className="size-6" />
            <div className="min-w-0 flex-1">
              <Textarea
                autoFocus
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Commentaire sur cette ligne. Soyez précis et constructif..."
                rows={3}
                className="bg-background text-sm"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
                  <X className="size-3.5" /> Annuler
                </Button>
                <Button type="button" size="sm" onClick={onSubmit}>
                  <Send className="size-3.5" /> Ajouter
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CommentRow({ name, content, time }: { name: string; content: string; time: string }) {
  return (
    <div className="border-y border-border bg-muted/40 py-3 pl-4 pr-4">
      <div className="flex items-start gap-2.5">
        <UserAvatar name={name} className="size-6" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
          <p className="mt-1 text-sm text-foreground/90">{content}</p>
        </div>
      </div>
    </div>
  )
}
