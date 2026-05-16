'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Plus, Settings } from 'lucide-react';
import { isAuthed, clearTokens } from '@/lib/auth';
import { api } from '@/lib/api';
import type { Workspace } from '@/types/api';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthed()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await api.get<Workspace[]>('/workspaces');
      return data;
    },
    enabled: ready,
  });

  const handleLogout = () => {
    clearTokens();
    router.replace('/login');
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="px-4 py-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span>TrelloLite</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Workspaces
          </div>
          {workspaces?.map((ws) => (
            <Link
              key={ws.id}
              href={`/w/${ws.id}`}
              className="block rounded-md px-2 py-1.5 text-sm hover:bg-accent"
            >
              {ws.name}
            </Link>
          ))}
          {!workspaces?.length && (
            <p className="text-sm text-muted-foreground px-2">Chưa có workspace</p>
          )}
        </nav>
        <div className="border-t p-3 space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
