'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Board, Workspace } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function WorkspacePage({ params }: { params: { wsId: string } }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', params.wsId],
    queryFn: async () => {
      const { data } = await api.get<Workspace>(`/workspaces/${params.wsId}`);
      return data;
    },
  });

  const { data: boards, isLoading } = useQuery<Board[]>({
    queryKey: ['boards', params.wsId],
    queryFn: async () => {
      const { data } = await api.get<Board[]>('/boards', {
        params: { workspaceId: params.wsId },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string }) => {
      const { data } = await api.post<Board>('/boards', {
        workspaceId: params.wsId,
        title: payload.title,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', params.wsId] });
      toast.success('Đã tạo board');
      setOpen(false);
      setTitle('');
    },
    onError: () => {
      toast.error('Tạo board thất bại');
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {workspace?.name ?? 'Workspace'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Tất cả board trong workspace này
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo board mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="board-title">Tên board</Label>
              <Input
                id="board-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Vd: Sprint Q1"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => createMutation.mutate({ title })}
                disabled={!title.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Đang tải...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards?.map((b) => (
          <Link key={b.id} href={`/w/${params.wsId}/b/${b.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle>{b.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Mở để xem board
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {!isLoading && !boards?.length && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Workspace này chưa có board nào. Tạo board đầu tiên để bắt đầu.
          </p>
        </div>
      )}
    </div>
  );
}
