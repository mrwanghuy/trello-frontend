'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '@/types/api';

interface CardProps {
  card: CardType;
  index: number;
  onCardClick?: (cardId: string) => void;
}

export function Card({ card, index, onCardClick }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: 'card', listId: card.listId, index },
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (transform || isDragging) return;
        onCardClick?.(card.id);
      }}
      className="bg-card rounded-md shadow-sm border border-border px-3 py-2 text-sm cursor-pointer hover:border-primary/50"
    >
      {card.title}
    </div>
  );
}
