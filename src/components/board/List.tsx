'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Trash2 } from 'lucide-react';
import type { List as ListType } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card as CardItem } from './Card';
import { AddCard } from './AddCard';
import { EditableTitle } from './EditableTitle';

interface ListProps {
  list: ListType;
  onCardClick?: (cardId: string) => void;
  onAddCard?: (listId: string, title: string) => Promise<void>;
  onUpdateListTitle?: (listId: string, title: string) => Promise<void> | void;
  onDeleteList?: (listId: string) => void;
}

export function List({
  list,
  onCardClick,
  onAddCard,
  onUpdateListTitle,
  onDeleteList,
}: ListProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { type: 'list', listId: list.id },
  });

  return (
    <div className="w-72 shrink-0 rounded-lg bg-secondary/70 flex flex-col max-h-full">
      <div className="px-3 pt-3 pb-2 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <EditableTitle
            value={list.title}
            onSave={async (t) => {
              if (onUpdateListTitle) await onUpdateListTitle(list.id, t);
            }}
            className="font-semibold text-sm"
          />
        </div>
        {onDeleteList ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (confirm(`Xoá list "${list.title}"?`)) {
                onDeleteList(list.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
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
            <CardItem
              key={card.id}
              card={card}
              index={index}
              onCardClick={onCardClick}
            />
          ))}
        </SortableContext>
      </div>
      <div className="px-2 pb-2">
        {onAddCard ? (
          <AddCard onAdd={(title) => onAddCard(list.id, title)} />
        ) : null}
      </div>
    </div>
  );
}
