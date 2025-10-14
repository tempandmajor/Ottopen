import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

// Minimal dual-dialogue decorator
// Heuristic: if a CHARACTER line ends with (DUAL) and is followed by a dialogue block,
// and the next CHARACTER line also ends with (DUAL) and is followed by dialogue,
// render the two dialogue blocks side-by-side.
export const DualDialogueExtension = Extension.create({
  name: 'dualDialogue',

  addProseMirrorPlugins() {
    const key = new PluginKey('dualDialogue')

    const isCharacter = (text: string) => /^[A-Z ]{2,30}(\s*\(DUAL\))?$/.test(text.trim())
    const hasDual = (text: string) => /\(DUAL\)\s*$/.test(text.trim())
    const isDialogue = (text: string) => /^\s{4,}.+/.test(text)

    return [
      new Plugin<{ decos: DecorationSet }>({
        key,
        state: {
          init: (_, { doc }) => {
            return { decos: DecorationSet.create(doc, []) }
          },
          apply: (tr, prev, _oldState, newState) => {
            // Recompute on any doc change
            if (!tr.docChanged) return { decos: prev.decos.map(tr.mapping, tr.doc) }

            const decorations: Decoration[] = []
            const blocks: { pos: number; text: string }[] = []

            // Collect block-level text nodes
            newState.doc.descendants((node, pos) => {
              if (node.isBlock) {
                const text = node.textContent || ''
                blocks.push({ pos, text })
              }
              return true
            })

            // Scan for pairs: (CHAR DUAL) + dialogue, (CHAR DUAL) + dialogue
            for (let i = 0; i < blocks.length - 3; i++) {
              const a = blocks[i]
              const b = blocks[i + 1]
              const c = blocks[i + 2]
              const d = blocks[i + 3]

              if (
                isCharacter(a.text) &&
                hasDual(a.text) &&
                isDialogue(b.text) &&
                isCharacter(c.text) &&
                hasDual(c.text) &&
                isDialogue(d.text)
              ) {
                // Apply side-by-side styles to b (left) and d (right)
                const leftDeco = Decoration.node(
                  b.pos,
                  b.pos + newState.doc.nodeAt(b.pos)!.nodeSize,
                  {
                    class: 'dual-dialogue-left',
                  }
                )
                const rightDeco = Decoration.node(
                  d.pos,
                  d.pos + newState.doc.nodeAt(d.pos)!.nodeSize,
                  {
                    class: 'dual-dialogue-right',
                  }
                )
                decorations.push(leftDeco, rightDeco)

                // Optionally style the two character lines too (narrow labels)
                const charLeft = Decoration.node(
                  a.pos,
                  a.pos + newState.doc.nodeAt(a.pos)!.nodeSize,
                  {
                    class: 'dual-dialogue-char-left',
                  }
                )
                const charRight = Decoration.node(
                  c.pos,
                  c.pos + newState.doc.nodeAt(c.pos)!.nodeSize,
                  {
                    class: 'dual-dialogue-char-right',
                  }
                )
                decorations.push(charLeft, charRight)

                // Skip over the second pair to avoid overlapping
                i += 3
              }
            }

            return { decos: DecorationSet.create(newState.doc, decorations) }
          },
        },
        props: {
          decorations(state) {
            return (this as any).getState(state)?.decos
          },
        },
      }),
    ]
  },
})
