'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}

export function EditableTitle({
  value,
  onSave,
  className,
  multiline = false,
  placeholder,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (!editing) return;
    const el = multiline ? textareaRef.current : inputRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }, [editing, multiline]);

  const commit = async () => {
    const next = draft.trim();
    setEditing(false);
    if (next.length === 0 || next === value) {
      setDraft(value);
      return;
    }
    await onSave(next);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div
        className={cn(
          'cursor-pointer rounded px-1 py-0.5 hover:bg-accent/40',
          className,
        )}
        onClick={() => setEditing(true)}
      >
        {value || (
          <span className="text-muted-foreground">{placeholder ?? ''}</span>
        )}
      </div>
    );
  }

  const sharedClass = cn(
    'w-full rounded border border-input bg-background px-1 py-0.5 outline-none focus:ring-2 focus:ring-ring',
    className,
  );

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        className={sharedClass}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void commit();
          }
        }}
        rows={2}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      className={sharedClass}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          void commit();
        }
      }}
    />
  );
}
