'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function WorkspacePage({ params }: { params: { wsId: string } }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleteBoard, setDeleteBoard] = useState<Board | null>(null);
  const [deleteWsOpen, setDeleteWsOpen] = useState(false);

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

  useEffect(() => {
    if (editOpen && workspace) setEditName(workspace.name);
  }, [editOpen, workspace]);

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

  const renameWsMutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await api.patch<Workspace>(
        `/workspaces/${params.wsId}`,
        { name: payload.name },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', params.wsId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Đã cập nhật workspace');
      setEditOpen(false);
    },
    onError: () => {
      toast.error('Cập nhật workspace thất bại');
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/boards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', params.wsId] });
      toast.success('Đã xoá board');
      setDeleteBoard(null);
    },
    onError: () => {
      toast.error('Xoá board thất bại');
    },
  });

  const deleteWsMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/workspaces/${params.wsId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Đã xoá workspace');
      setDeleteWsOpen(false);
      router.replace('/dashboard');
    },
    onError: () => {
      toast.error('Xoá workspace thất bại');
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {workspace?.name ?? 'Workspace'}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditOpen(true)}
              disabled={!workspace}
              aria-label="Sửa tên workspace"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
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
              <DialogDescription>
                Board chứa các list và card cho dự án của bạn.
              </DialogDescription>
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
          <div key={b.id} className="relative">
            <Link
              href={`/w/${params.wsId}/b/${b.id}`}
              className="absolute inset-0 z-0"
            >
              <span className="sr-only">Mở {b.title}</span>
            </Link>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full pointer-events-none">
              <CardHeader>
                <CardTitle>{b.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Mở để xem board
                </p>
              </CardContent>
            </Card>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteBoard(b);
              }}
              aria-label={`Xoá ${b.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {!isLoading && !boards?.length && (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            Workspace này chưa có board nào. Tạo board đầu tiên để bắt đầu.
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New board
          </Button>
        </div>
      )}

      <div className="mt-12 pt-6 border-t">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          Danger zone
        </h2>
        <Button
          variant="destructive"
          onClick={() => setDeleteWsOpen(true)}
          disabled={!workspace}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Xoá workspace này
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa workspace</DialogTitle>
            <DialogDescription>
              Đổi tên hiển thị cho workspace này. Slug giữ nguyên.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ws-edit-name">Tên workspace</Label>
            <Input
              id="ws-edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Tên workspace"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => renameWsMutation.mutate({ name: editName })}
              disabled={!editName.trim() || renameWsMutation.isPending}
            >
              {renameWsMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteBoard}
        onOpenChange={(o) => !o && setDeleteBoard(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá board</DialogTitle>
            <DialogDescription>
              Xoá board «{deleteBoard?.title}»? Tất cả card sẽ bị xoá theo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBoard(null)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteBoard && deleteBoardMutation.mutate(deleteBoard.id)
              }
              disabled={deleteBoardMutation.isPending}
            >
              {deleteBoardMutation.isPending ? 'Đang xoá...' : 'Xoá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteWsOpen} onOpenChange={setDeleteWsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá workspace</DialogTitle>
            <DialogDescription>
              Xoá workspace? Tất cả board và card sẽ bị xoá theo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteWsOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteWsMutation.mutate()}
              disabled={deleteWsMutation.isPending}
            >
              {deleteWsMutation.isPending ? 'Đang xoá...' : 'Xoá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
