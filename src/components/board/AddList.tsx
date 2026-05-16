'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  onAdd: (title: string) => Promise<void>;
}

export function AddList({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setTitle('');
  };

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed);
      setTitle('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <div className="w-[280px] shrink-0">
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-start bg-secondary/50 hover:bg-secondary"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add list
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[280px] shrink-0 rounded-lg bg-secondary/70 p-2 space-y-2">
      <Input
        ref={inputRef}
        placeholder="Nhập tiêu đề list..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            close();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'Đang lưu...' : 'Save'}
        </Button>
        <Button size="sm" variant="ghost" onClick={close} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
