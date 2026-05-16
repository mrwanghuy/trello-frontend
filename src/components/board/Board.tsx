'use client';

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BoardWithLists } from '@/types/api';
import { List } from './List';

interface BoardProps {
  board: BoardWithLists;
  onCardMove: (cardId: string, newListId: string, newIndex: number) => void;
}

interface CardSortableData {
  type: 'card';
  listId: string;
  index: number;
}

interface ListSortableData {
  type: 'list';
  listId: string;
}

type SortableData = CardSortableData | ListSortableData;

export function Board({ board, onCardMove }: BoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as SortableData | undefined;
    const overData = over.data.current as SortableData | undefined;

    if (!activeData || activeData.type !== 'card') return;

    let targetListId: string;
    let targetIndex: number;

    if (overData?.type === 'card') {
      targetListId = overData.listId;
      targetIndex = overData.index;
    } else if (overData?.type === 'list') {
      targetListId = overData.listId;
      const list = board.lists.find((l) => l.id === targetListId);
      targetIndex = list ? list.cards.length : 0;
    } else {
      return;
    }

    if (
      activeData.listId === targetListId &&
      activeData.index === targetIndex
    ) {
      return;
    }

    onCardMove(String(active.id), targetListId, targetIndex);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 p-4 items-start min-h-full">
        <SortableContext
          items={board.lists.map((l) => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          {board.lists.map((list) => (
            <List key={list.id} list={list} />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
