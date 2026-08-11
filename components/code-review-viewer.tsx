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
  const [isEditorReady, setIsEditorReady] = useState(false)

  const modeRef = useRef(mode)
  modeRef.current = mode

  const editorRef = useRef<MonacoEditorInstance | null>(null)
  const monacoRef = useRef<MonacoNS | null>(null)
  const decorationsRef = useRef<ReturnType<MonacoEditorInstance["createDecorationsCollection"]> | null>(null)
  const zonesRef = useRef<Map<number, { zoneId: string; node: HTMLDivElement; zone: MonacoEditorNS.IViewZone }>>(
    new Map(),
  )
  const widgetsRef = useRef<
    Map<number, { widget: MonacoEditorNS.IContentWidget; node: HTMLDivElement; root: Root }>
  >(new Map())

  const monacoLanguage = language ? (monacoLanguageMap[language] ?? language.toLowerCase()) : "plaintext"

  const commentsByLine = existingComments.reduce<Record<number, LineComment[]>>((acc, c) => {
    acc[c.line] = acc[c.line] ? [...acc[c.line], c] : [c]
    return acc
  }, {})
  const draftByLine = new Map(drafts.map((d) => [d.line, d]))

  const openComposer = useCallback((line: number) => {
    setActiveLine(line)
    setText(draftByLine.get(line)?.content ?? "")
  }, [draftByLine])

  const cancelComposer = useCallback(() => {
    setActiveLine(null)
    setText("")
  }, [])

  const submit = useCallback(
    (line: number) => {
      if (!text.trim()) return
      onAddDraft?.({ line, content: text.trim() })
      setActiveLine(null)
      setText("")
    },
    [text, onAddDraft],
  )

  const remove = useCallback(
    (line: number) => {
      onRemoveDraft?.(line)
    },
    [onRemoveDraft],
  )

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

  // ─── Effet 1 : Gestion STRUCTURALE (Ajout/Suppression des widgets et zones) ──
  // Ne dépend que des lignes actives, PAS du texte en cours de saisie.
  useEffect(() => {
    if (!isEditorReady) return
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    const linesNeeded = new Set<number>()
    Object.keys(commentsByLine).forEach((k) => linesNeeded.add(Number(k)))
    drafts.forEach((d) => linesNeeded.add(d.line))
    if (activeLine != null) linesNeeded.add(activeLine); // <-- LE VRAI POINT-VIRGULE EST ICI

    // 1. Retirer les widgets obsolètes
    [...widgetsRef.current.keys()].forEach((line) => {
      if (!linesNeeded.has(line)) {
        const w = widgetsRef.current.get(line)
        if (w) {
          editor.removeContentWidget(w.widget)
          widgetsRef.current.delete(line)
          queueMicrotask(() => w.root.unmount())
        }
      }
    }); // <-- ET ICI

    // 2. Ajouter les nouveaux widgets
    linesNeeded.forEach((line) => {
      if (!widgetsRef.current.has(line)) {
        const layoutWidth = editor.getLayoutInfo().contentWidth
        const node = document.createElement("div")
        node.style.width = `${layoutWidth}px`
        node.style.boxSizing = "border-box"
        node.style.userSelect = "text"
        
        // CORRECTION CRITIQUE : Empêche Monaco de voler le focus et de bloquer les boutons
        node.addEventListener("mousedown", (e) => e.stopPropagation())

        const root = createRoot(node)
        const widget: MonacoEditorNS.IContentWidget = {
          getId: () => `review-widget-${line}`,
          getDomNode: () => node,
          getPosition: () => ({
            position: { lineNumber: line, column: 1 },
            preference: [monaco.editor.ContentWidgetPositionPreference.BELOW],
          }),
          allowEditorOverflow: false,
        }
        editor.addContentWidget(widget)
        widgetsRef.current.set(line, { widget, node, root })
      }
    }); // <-- ET ICI

    // 3. Gérer les View Zones en une seule transaction
    editor.changeViewZones((accessor) => {
      // Retirer les zones obsolètes
      [...zonesRef.current.keys()].forEach((line) => {
        if (!linesNeeded.has(line)) {
          const z = zonesRef.current.get(line)
          if (z) {
            accessor.removeZone(z.zoneId)
            zonesRef.current.delete(line)
          }
        }
      }); // <-- ET ICI
      // Ajouter les nouvelles zones
      linesNeeded.forEach((line) => {
        if (!zonesRef.current.has(line)) {
          const node = document.createElement("div")
          node.style.width = "100%"
          const zone: MonacoEditorNS.IViewZone = { afterLineNumber: line, heightInPx: 1, domNode: node }
          const zoneId = accessor.addZone(zone)
          zonesRef.current.set(line, { zoneId, node, zone })
        }
      })
    })
  }, [isEditorReady, existingComments, drafts, activeLine]) // Dépendances structurelles uniquement

  // ─── Effet 2 : Gestion VISUELLE (Rendu React et Mesure de hauteur) ──
  // Se déclenche à chaque changement de texte, mais sans manipuler la structure Monaco.
  useEffect(() => {
    if (!isEditorReady) return
    const editor = editorRef.current
    if (!editor) return

    // Rendu ou mise à jour du contenu React dans les widgets existants
    widgetsRef.current.forEach((w, line) => {
      w.root.render(
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

    // Mesure asynchrone de la hauteur pour ajuster la ViewZone
    const animationFrame = requestAnimationFrame(() => {
      const ed = editorRef.current
      if (!ed) return
      
      ed.changeViewZones((accessor) => {
        widgetsRef.current.forEach((w, line) => {
          const zone = zonesRef.current.get(line)
          if (!zone) return
          const measured = Math.max(w.node.offsetHeight, 1)
          if (zone.zone.heightInPx !== measured) {
            zone.zone.heightInPx = measured
            accessor.layoutZone(zone.zoneId)
          }
        })
      })
      widgetsRef.current.forEach((w) => ed.layoutContentWidget(w.widget))
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [isEditorReady, existingComments, drafts, activeLine, text, userName, openComposer, remove, cancelComposer, submit])

  useEffect(() => {
    if (!isEditorReady) return
    applyGlyphDecorations()
  }, [isEditorReady, applyGlyphDecorations])

  const handleMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance
    monacoRef.current = monaco
    setIsEditorReady(true)

    editorInstance.onMouseDown((e) => {
      if (modeRef.current !== "review") return
      const type = e.target.type
      if (
        type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
        type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
      ) {
        const line = e.target.position?.lineNumber
        if (line) openComposer(line)
      }
    })

    editorInstance.onDidLayoutChange(() => {
      const width = editorInstance.getLayoutInfo().contentWidth
      widgetsRef.current.forEach((w) => {
        w.node.style.width = `${width}px`
        editorInstance.layoutContentWidget(w.widget)
      })
    })
  }

  useEffect(() => {
    return () => {
      const editor = editorRef.current
      if (editor) {
        widgetsRef.current.forEach((w) => {
          editor.removeContentWidget(w.widget)
          queueMicrotask(() => w.root.unmount())
        })
      }
      zonesRef.current.clear()
      widgetsRef.current.clear()
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
    // CORRECTION CRITIQUE : stoppe la propagation de la souris au niveau de la div principale
    <div className="font-sans text-[13px]" onMouseDown={(e) => e.stopPropagation()}>
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