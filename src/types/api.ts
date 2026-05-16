export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  boardsCount?: number;
  createdAt?: string;
}

export interface Board {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  createdAt?: string;
}

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string | null;
  position: number;
}

export interface BoardWithLists extends Board {
  lists: List[];
}
