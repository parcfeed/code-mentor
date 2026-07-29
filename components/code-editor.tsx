"use client"

import Editor from "@monaco-editor/react"
import { Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

export function CodeEditor({
  value,
  onChange,
  language,
  height = 420,
  readOnly = false,
}: {
  value: string
  onChange?: (value: string) => void
  language: string
  height?: number
  readOnly?: boolean
}) {
  const { resolvedTheme } = useTheme()

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      loading={
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      }
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "var(--font-geist-mono), monospace",
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        smoothScrolling: true,
        renderLineHighlight: "line",
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        tabSize: 2,
        automaticLayout: true,
      }}
    />
  )
}
