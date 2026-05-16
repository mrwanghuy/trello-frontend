'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { List as ListType } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card as CardItem } from './Card';

interface ListProps {
  list: ListType;
}

export function List({ list }: ListProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { type: 'list', listId: list.id },
  });

  return (
    <div className="w-72 shrink-0 rounded-lg bg-secondary/70 flex flex-col max-h-full">
      <div className="px-3 pt-3 pb-2">
        <h3 className="font-medium text-sm">{list.title}</h3>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[40px] rounded-md ${
          isOver ? 'bg-accent/40' : ''
        }`}
      >
        <SortableContext
          items={list.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card, index) => (
            <CardItem key={card.id} card={card} index={index} />
          ))}
        </SortableContext>
      </div>
      <div className="px-2 pb-2">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Plus className="h-4 w-4 mr-2" />
          Add card
        </Button>
      </div>
    </div>
  );
}
