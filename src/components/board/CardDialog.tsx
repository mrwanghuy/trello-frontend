'use client';

import type { Card as CardType } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CardDialogProps {
  card: CardType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDialog({ card, open, onOpenChange }: CardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card?.title ?? 'Card'}</DialogTitle>
          <DialogDescription>
            Chi tiết card. Tính năng chỉnh sửa sẽ bổ sung sau.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
