'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
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

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await api.get<Workspace[]>('/workspaces');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await api.post<Workspace>('/workspaces', payload);
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Workspaces</h1>
          <p className="text-sm text-muted-foreground">
            Tất cả không gian làm việc của bạn
          </p>
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
          <Link key={ws.id} href={`/w/${ws.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle>{ws.name}</CardTitle>
                <CardDescription>
                  {ws.description ?? 'Không có mô tả'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {ws.boardsCount ?? 0} board
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {!isLoading && !workspaces?.length && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Bạn chưa có workspace nào. Tạo workspace đầu tiên để bắt đầu.
          </p>
        </div>
      )}
    </div>
  );
}
