'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Workspace } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
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

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await api.get<Workspace[]>('/workspaces');
      return data;
    },
  });

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const slug = slugify(payload.name) || `ws-${Date.now()}`;
      const { data } = await api.post<Workspace>('/workspaces', {
        name: payload.name,
        slug,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Đã tạo workspace');
      setOpen(false);
      setName('');
    },
    onError: () => {
      toast.error('Tạo workspace thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workspaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Đã xoá workspace');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Xoá workspace thất bại');
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Workspaces</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {workspaces?.length ?? 0} workspace
            </p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo workspace mới</DialogTitle>
              <DialogDescription>
                Workspace là nơi chứa các board của nhóm bạn.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="ws-name">Tên workspace</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vd: Marketing"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => createMutation.mutate({ name })}
                disabled={!name.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Đang tải...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces?.map((ws) => (
          <div key={ws.id} className="relative">
            <Link href={`/w/${ws.id}`} className="absolute inset-0 z-0">
              <span className="sr-only">Mở {ws.name}</span>
            </Link>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full pointer-events-none">
              <CardHeader>
                <CardTitle>{ws.name}</CardTitle>
                <CardDescription>/{ws.slug}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Mở workspace</p>
              </CardContent>
            </Card>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteTarget(ws);
              }}
              aria-label={`Xoá ${ws.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {!isLoading && !workspaces?.length && (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            Bạn chưa có workspace nào. Tạo workspace đầu tiên để bắt đầu.
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New workspace
          </Button>
        </div>
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá workspace</DialogTitle>
            <DialogDescription>
              Xoá workspace «{deleteTarget?.name}»? Tất cả board và card sẽ bị
              xoá theo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xoá...' : 'Xoá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
