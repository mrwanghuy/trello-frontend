'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { BoardWithLists } from '@/types/api';
import { Board } from '@/components/board/Board';
import { CardDialog } from '@/components/board/CardDialog';
import { midpoint, nextAppendPosition } from '@/lib/positions';

export default function BoardPage() {
  const params = useParams<{ wsId: string; boardId: string }>();
  const boardId = params.boardId;
  const queryClient = useQueryClient();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const { data: board, isLoading } = useQuery<BoardWithLists>({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const { data } = await api.get<BoardWithLists>(`/boards/${boardId}`);
      return data;
    },
    enabled: !!boardId,
  });

  const moveMutation = useMutation({
    mutationFn: async (payload: {
      cardId: string;
      listId: string;
      position: number;
    }) => {
      await api.patch(`/cards/${payload.cardId}/move`, {
        listId: payload.listId,
        position: payload.position,
      });
    },
    onError: () => {
      toast.error('Di chuyển thất bại');
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });

  const invalidateBoard = () => {
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const createCardMutation = useMutation({
    mutationFn: async (payload: { listId: string; title: string }) => {
      await api.post('/cards', payload);
    },
    onSuccess: () => toast.success('Đã thêm card'),
    onError: () => toast.error('Thêm card thất bại'),
    onSettled: invalidateBoard,
  });

  const createListMutation = useMutation({
    mutationFn: async (payload: { title: string }) => {
      await api.post('/lists', { boardId, title: payload.title });
    },
    onSuccess: () => toast.success('Đã thêm list'),
    onError: () => toast.error('Thêm list thất bại'),
    onSettled: invalidateBoard,
  });

  const updateListTitleMutation = useMutation({
    mutationFn: async (payload: { listId: string; title: string }) => {
      await api.patch(`/lists/${payload.listId}`, { title: payload.title });
    },
    onSuccess: () => toast.success('Đã cập nhật list'),
    onError: () => toast.error('Cập nhật list thất bại'),
    onSettled: invalidateBoard,
  });

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      await api.delete(`/lists/${listId}`);
    },
    onSuccess: () => toast.success('Đã xoá list'),
    onError: () => toast.error('Xoá list thất bại'),
    onSettled: invalidateBoard,
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await api.delete(`/cards/${cardId}`);
    },
    onSuccess: () => toast.success('Đã xoá card'),
    onError: () => toast.error('Xoá card thất bại'),
    onSettled: invalidateBoard,
  });

  // Reference so the var isn't flagged as unused; this mutation is exposed for future inline delete.
  void deleteCardMutation;

  const handleCardMove = (cardId: string, newListId: string, newIndex: number) => {
    if (!board) return;

    const cloned: BoardWithLists = JSON.parse(JSON.stringify(board));

    let movingCard: BoardWithLists['lists'][number]['cards'][number] | null = null;
    for (const list of cloned.lists) {
      const idx = list.cards.findIndex((c) => c.id === cardId);
      if (idx >= 0) {
        movingCard = list.cards.splice(idx, 1)[0] ?? null;
        break;
      }
    }
    if (!movingCard) return;

    const targetList = cloned.lists.find((l) => l.id === newListId);
    if (!targetList) return;

    const clampedIndex = Math.max(0, Math.min(newIndex, targetList.cards.length));

    let newPosition: number;
    if (targetList.cards.length === 0) {
      newPosition = nextAppendPosition(null);
    } else if (clampedIndex === 0) {
      newPosition = (targetList.cards[0]?.position ?? 1000) / 2;
    } else if (clampedIndex >= targetList.cards.length) {
      const last = targetList.cards[targetList.cards.length - 1];
      newPosition = nextAppendPosition(last?.position ?? null);
    } else {
      const prev = targetList.cards[clampedIndex - 1];
      const next = targetList.cards[clampedIndex];
      newPosition = midpoint(prev?.position ?? 0, next?.position ?? 0);
    }

    movingCard.listId = newListId;
    movingCard.position = newPosition;
    targetList.cards.splice(clampedIndex, 0, movingCard);

    queryClient.setQueryData<BoardWithLists>(['board', boardId], cloned);
    moveMutation.mutate({ cardId, listId: newListId, position: newPosition });
  };

  const handleAddCard = async (listId: string, title: string) => {
    await createCardMutation.mutateAsync({ listId, title });
  };

  const handleAddList = async (title: string) => {
    await createListMutation.mutateAsync({ title });
  };

  const handleUpdateListTitle = async (listId: string, title: string) => {
    await updateListTitleMutation.mutateAsync({ listId, title });
  };

  const handleDeleteList = (listId: string) => {
    deleteListMutation.mutate(listId);
  };

  const orderedBoard = useMemo<BoardWithLists | undefined>(() => {
    if (!board) return undefined;
    return {
      ...board,
      lists: [...board.lists]
        .sort((a, b) => a.position - b.position)
        .map((l) => ({
          ...l,
          cards: [...l.cards].sort((a, b) => a.position - b.position),
        })),
    };
  }, [board]);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Đang tải board...</div>;
  }
  if (!orderedBoard) {
    return <div className="p-8 text-muted-foreground">Không tìm thấy board</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b bg-card px-6 py-3">
        <h1 className="text-lg font-semibold">{orderedBoard.title}</h1>
      </header>
      <div className="flex-1 overflow-x-auto">
        <Board
          board={orderedBoard}
          onCardMove={handleCardMove}
          onCardClick={(id) => setSelectedCardId(id)}
          onAddCard={handleAddCard}
          onAddList={handleAddList}
          onUpdateListTitle={handleUpdateListTitle}
          onDeleteList={handleDeleteList}
        />
      </div>
      <CardDialog
        cardId={selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />
    </div>
  );
}
