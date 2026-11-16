import { createEffect, createSignal, on } from 'solid-js';
import { applyItemTransforms, filterDocumentByExcludedKeys, type PrintDocument } from '@/domain/print';

export function createPrintDocumentStore(source: () => PrintDocument) {
  const [document, setDocument] = createSignal<PrintDocument>(source());
  const [version, setVersion] = createSignal(0);
  const undoStack: PrintDocument[] = [];
  const redoStack: PrintDocument[] = [];
  let transactionStart: PrintDocument | undefined;

  createEffect(
    on(
      source,
      (next) => {
        const previous = document();
        // 先排除再打包：被排除图片若参与打包会在过滤后留下空洞并把新图挤到幻影页。
        setDocument(applyItemTransforms(filterDocumentByExcludedKeys(next, previous.excludedImageKeys), previous));
        undoStack.length = 0;
        redoStack.length = 0;
        transactionStart = undefined;
        setVersion((value) => value + 1);
      },
      { defer: true },
    ),
  );

  function update(next: PrintDocument) {
    setDocument(next);
  }

  function beginTransaction() {
    if (!transactionStart) {
      transactionStart = document();
    }
  }

  function commitTransaction() {
    if (transactionStart && transactionStart !== document()) {
      undoStack.push(transactionStart);
      redoStack.length = 0;
      setVersion((value) => value + 1);
    }
    transactionStart = undefined;
  }

  function cancelTransaction() {
    if (transactionStart) {
      setDocument(transactionStart);
      transactionStart = undefined;
    }
  }

  function undo() {
    const previous = undoStack.pop();
    if (!previous) return;
    redoStack.push(document());
    setDocument(previous);
    setVersion((value) => value + 1);
  }

  function redo() {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(document());
    setDocument(next);
    setVersion((value) => value + 1);
  }

  function reflow() {
    setDocument(applyItemTransforms(filterDocumentByExcludedKeys(source(), document().excludedImageKeys), document()));
    undoStack.length = 0;
    redoStack.length = 0;
    transactionStart = undefined;
    setVersion((value) => value + 1);
  }

  return {
    document,
    update,
    beginTransaction,
    commitTransaction,
    cancelTransaction,
    undo,
    redo,
    reflow,
    canUndo: () => {
      version();
      return undoStack.length > 0;
    },
    canRedo: () => {
      version();
      return redoStack.length > 0;
    },
  };
}
