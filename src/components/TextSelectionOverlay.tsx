import React from 'react';
import { cn } from '@/lib/utils';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextSelectionOverlayProps {
  isSelecting: boolean;
  selectionRects: SelectionRect[];
  hasSelection: boolean;
  className?: string;
  onMouseDown?: (event: React.MouseEvent) => void;
  onMouseMove?: (event: React.MouseEvent) => void;
  onMouseUp?: (event: React.MouseEvent) => void;
}

const TextSelectionOverlay: React.FC<TextSelectionOverlayProps> = ({
  isSelecting,
  selectionRects,
  hasSelection,
  className,
  onMouseDown,
  onMouseMove,
  onMouseUp
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-auto",
        isSelecting && "cursor-crosshair",
        !isSelecting && hasSelection && "cursor-pointer",
        className
      )}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{ userSelect: 'none' }}
    >
      {/* Selection rectangles */}
      {selectionRects.map((rect, index) => (
        <div
          key={index}
          className={cn(
            "absolute border-2 pointer-events-none transition-all duration-75",
            isSelecting 
              ? "bg-blue-200/30 border-blue-400 dark:bg-blue-400/20 dark:border-blue-300" 
              : "bg-blue-300/40 border-blue-500 dark:bg-blue-400/30 dark:border-blue-400"
          )}
          style={{
            left: rect.x,
            top: rect.y,
            width: Math.max(rect.width, 2),
            height: Math.max(rect.height, 2),
          }}
        />
      ))}
      
      {/* Selection feedback */}
      {hasSelection && !isSelecting && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md shadow-lg flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>Press CMD+K to chat</span>
          </div>
        </div>
      )}
      
      {/* Selection instructions */}
      {isSelecting && (
        <div className="absolute top-2 left-2 pointer-events-none">
          <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-md shadow-lg">
            Drag to select text
          </div>
        </div>
      )}
    </div>
  );
};

export default TextSelectionOverlay; 