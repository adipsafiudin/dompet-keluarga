"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { FamilyMember } from "@/types";

interface FamilyMembersContextType {
  members: FamilyMember[];
  memberNickname: (userId: string) => string | null;
  refreshMembers: () => Promise<void>;
}

const FamilyMembersContext = createContext<FamilyMembersContextType>({
  members: [],
  memberNickname: () => null,
  refreshMembers: async () => {},
});

export function FamilyMembersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [members, setMembers] = useState<FamilyMember[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/family/members");
    if (!res.ok) return;
    const json = await res.json();
    if (json.members) setMembers(json.members as FamilyMember[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const memberNickname = useCallback(
    (userId: string): string | null => {
      const m = members.find((m) => m.user_id === userId);
      return m?.nickname ?? null;
    },
    [members],
  );

  return (
    <FamilyMembersContext.Provider
      value={{ members, memberNickname, refreshMembers: load }}
    >
      {children}
    </FamilyMembersContext.Provider>
  );
}

export function useFamilyMembers() {
  return useContext(FamilyMembersContext);
}
