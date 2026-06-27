import React from 'react';

interface TextHighlightOverlayProps {
  content: string;
  selectedText: string;
  selectionRange: { start: number; end: number } | null;
  overlayRef: React.RefObject<HTMLDivElement | null>;
}

export const TextHighlightOverlay: React.FC<TextHighlightOverlayProps> = ({
  content,
  selectedText,
  selectionRange,
  overlayRef
}) => {
  const getRenderedElements = () => {
    if (!selectedText || !content) {
      return content;
    }

    let start = -1;
    let end = -1;

    if (
      selectionRange &&
      selectionRange.start < selectionRange.end &&
      content.substring(selectionRange.start, selectionRange.end) === selectedText
    ) {
      start = selectionRange.start;
      end = selectionRange.end;
    } else {
      start = content.indexOf(selectedText);
      if (start !== -1) {
        end = start + selectedText.length;
      }
    }

    if (start === -1 || end === -1) {
      return content;
    }

    const before = content.substring(0, start);
    const highlighted = content.substring(start, end);
    const after = content.substring(end);

    return (
      <>
        {before}
        <mark className="editor-persistent-highlight">{highlighted}</mark>
        {after}
      </>
    );
  };

  return (
    <div ref={overlayRef} className="editor-highlight-overlay" aria-hidden="true">
      {getRenderedElements()}
    </div>
  );
};
