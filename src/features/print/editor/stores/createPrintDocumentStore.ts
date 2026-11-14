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
        setDocument(filterDocumentByExcludedKeys(applyItemTransforms(next, previous), previous.excludedImageKeys));
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
    setDocument(filterDocumentByExcludedKeys(applyItemTransforms(source(), document()), document().excludedImageKeys));
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
