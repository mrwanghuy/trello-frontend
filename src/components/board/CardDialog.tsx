'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckSquare, Square } from 'lucide-react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type CardComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
};

type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
  position: number;
};

type Checklist = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

type CardLabelJoin = {
  cardId: string;
  labelId: string;
  label: { id: string; name: string; color: string };
};

type CardAssigneeJoin = {
  cardId: string;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
};

type CardDetail = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  comments: CardComment[];
  checklists: Checklist[];
  labels: CardLabelJoin[];
  assignees: CardAssigneeJoin[];
};

type UpdateCardPayload = {
  title?: string;
  description?: string;
};

export type CardDialogProps = { cardId: string | null; onClose: () => void };

function initials(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?';
}

export function CardDialog({ cardId, onClose }: CardDialogProps): JSX.Element | null {
  const queryClient = useQueryClient();

  const cardQuery = useQuery({
    queryKey: ['card', cardId],
    queryFn: () => api.get<CardDetail>(`/cards/${cardId}`).then((r) => r.data),
    enabled: !!cardId,
  });

  const [title, setTitle] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [newComment, setNewComment] = React.useState<string>('');
  const titleRef = React.useRef<HTMLInputElement>(null);
  const focusedCardRef = React.useRef<string | null>(null);

  const card = cardQuery.data;

  React.useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? '');
    }
  }, [card?.id, card?.title, card?.description]);

  React.useEffect(() => {
    if (!cardId) {
      focusedCardRef.current = null;
      return;
    }
    if (card && titleRef.current && focusedCardRef.current !== card.id) {
      titleRef.current.focus();
      focusedCardRef.current = card.id;
    }
  }, [cardId, card]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCardPayload) =>
      api.patch<CardDetail>(`/cards/${cardId}`, payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Đã lưu');
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
    onError: () => {
      toast.error('Lưu thất bại');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (payload: { body: string }) =>
      api.post<CardComment>(`/cards/${cardId}/comments`, payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Đã thêm bình luận');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
    onError: () => {
      toast.error('Thêm bình luận thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/cards/${cardId}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Đã xoá card');
      onClose();
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === 'board' || q.queryKey[0] === 'card'),
      });
    },
    onError: () => {
      toast.error('Xoá thất bại');
    },
  });

  if (cardId === null) {
    return null;
  }

  const handleTitleBlur = (): void => {
    if (card && title !== card.title && title.trim().length > 0) {
      updateMutation.mutate({ title });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleDescriptionBlur = (): void => {
    if (card && description !== (card.description ?? '')) {
      updateMutation.mutate({ description });
    }
  };

  const handleAddComment = (): void => {
    const body = newComment.trim();
    if (body.length === 0) return;
    commentMutation.mutate({ body });
  };

  const handleDelete = (): void => {
    if (typeof window !== 'undefined' && window.confirm('Xoá card này?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={!!cardId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Chi tiết card</DialogTitle>
        </DialogHeader>

        {cardQuery.isLoading || !card ? (
          <p>Đang tải...</p>
        ) : (
          <div className="space-y-6">
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="text-lg font-semibold"
            />

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Mô tả</h3>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Thêm mô tả..."
                className="min-h-[120px]"
              />
            </div>

            {(card.labels.length > 0 || card.assignees.length > 0) && (
              <div className="space-y-3">
                {card.labels.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Nhãn</h3>
                    <div className="flex flex-wrap gap-2">
                      {card.labels.map((l) => (
                        <span
                          key={l.labelId}
                          className="rounded-full px-3 py-1 text-xs font-medium text-white"
                          style={{ backgroundColor: l.label.color }}
                        >
                          {l.label.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {card.assignees.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Người phụ trách
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {card.assignees.map((a) => (
                        <span
                          key={a.userId}
                          title={a.user.name}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground"
                        >
                          {initials(a.user.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {card.checklists.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Checklist
                </h3>
                {card.checklists.map((cl) => (
                  <div key={cl.id} className="space-y-1">
                    <p className="text-sm font-medium">{cl.title}</p>
                    <ul className="space-y-1">
                      {cl.items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          {it.done ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span
                            className={
                              it.done ? 'line-through text-muted-foreground' : ''
                            }
                          >
                            {it.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Bình luận
              </h3>
              <ul className="space-y-3">
                {card.comments.map((c) => (
                  <li key={c.id} className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{c.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={
                    commentMutation.isPending || newComment.trim().length === 0
                  }
                >
                  Thêm bình luận
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Xoá card
          </Button>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
