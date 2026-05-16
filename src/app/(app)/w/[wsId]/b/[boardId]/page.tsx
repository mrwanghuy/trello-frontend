'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { BoardWithLists } from '@/types/api';
import { Board } from '@/components/board/Board';
import { midpoint, nextAppendPosition } from '@/lib/positions';

export default function BoardPage() {
  const params = useParams<{ wsId: string; boardId: string }>();
  const boardId = params.boardId;
  const queryClient = useQueryClient();

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
        <Board board={orderedBoard} onCardMove={handleCardMove} />
      </div>
    </div>
  );
}
