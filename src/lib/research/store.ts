import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { planById } from "./catalog";
import type { Order, PlanId, Project } from "./types";
import { blankProject, normalizeProject } from "./types";

type Ledger = {
  orders: Order[];
  project: Project;
  charged: string[];
  ready: boolean;
  setReady: (ready: boolean) => void;
  patchProject: (patch: Partial<Project>) => void;
  replaceProject: (project: Project) => void;
  newProject: () => void;
  ensurePending: (planId: PlanId, channel: Order["channel"], projectId?: string) => string;
  setChannel: (id: string, channel: Order["channel"]) => void;
  markPaid: (id: string) => void;
  chargeIfYear: (projectId: string) => void;
};

export const useLedger = create<Ledger>()(
  persist(
    (set, get) => ({
      orders: [],
      project: blankProject(),
      charged: [],
      ready: false,
      setReady: (ready) => set({ ready }),
      patchProject: (patch) =>
        set({ project: { ...get().project, ...patch, updatedAt: new Date().toISOString() } }),
      replaceProject: (project) => set({ project }),
      newProject: () => set({ project: blankProject() }),
      ensurePending: (planId, channel, projectId) => {
        const existing = get().orders.find(
          (order) => order.status === "pending" && order.planId === planId && (order.projectId ?? "") === (projectId ?? ""),
        );
        if (existing) {
          set({
            orders: get().orders.map((order) => (order.id === existing.id ? { ...order, channel } : order)),
          });
          return existing.id;
        }
        const plan = planById(planId);
        const order: Order = {
          id: "TW" + Date.now().toString(36).toUpperCase(),
          planId,
          amount: plan.price,
          title: plan.name,
          status: "pending",
          createdAt: new Date().toISOString(),
          channel,
          ...(projectId ? { projectId } : {}),
        };
        set({ orders: [order, ...get().orders] });
        return order.id;
      },
      setChannel: (id, channel) =>
        set({ orders: get().orders.map((order) => (order.id === id ? { ...order, channel } : order)) }),
      markPaid: (id) =>
        set({
          orders: get().orders.map((order) => (order.id === id ? { ...order, status: "paid" } : order)),
        }),
      chargeIfYear: (projectId) => {
        if (get().charged.includes(projectId)) return;
        const paid = get().orders.filter((order) => order.status === "paid");
        const hasYear = paid.some((order) => order.planId === "year");
        const hasSingle = paid.some((order) => order.planId === "buyout" || order.planId === "revise3");
        if (hasYear && !hasSingle) set({ charged: [...get().charged, projectId] });
      },
    }),
    {
      name: "hengye-ledger",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ orders: state.orders, project: state.project, charged: state.charged }),
      migrate: (persisted) => persisted as Ledger,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Ledger>;
        return {
          ...current,
          orders: Array.isArray(saved.orders) ? saved.orders : current.orders,
          charged: Array.isArray(saved.charged) ? saved.charged : current.charged,
          project: normalizeProject(saved.project ?? current.project),
        };
      },
    },
  ),
);

/**
 * 这个项目解锁到了哪一步。工作室里下的单带项目编号，只对本项目有效；
 * 在价格页直接买的整档不带编号，对所有项目有效。
 */
export function projectAccess(orders: Order[], projectId: string) {
  const mine = orders.filter((order) => order.status === "paid" && (!order.projectId || order.projectId === projectId));
  const ids = new Set(mine.map((order) => order.planId));
  const three = ids.has("revise3") || ids.has("year") || ids.has("upgrade-revise") || ids.has("balance-revise");
  const one = ids.has("buyout") || ids.has("upgrade-buyout") || ids.has("balance-buyout");
  const analysis = ids.has("survey") || ids.has("deposit-revise") || ids.has("deposit-buyout");
  const upgraded = three || one;
  const addons = mine.filter((order) => order.planId === "addon-buyout" || order.planId === "addon-revise").length;
  return {
    topic: ids.has("topic") || upgraded || analysis,
    upgraded,
    instrument: upgraded || analysis,
    draft: upgraded,
    tier: three ? ("revise3" as const) : one ? ("buyout" as const) : null,
    allowance: (three ? 3 : one ? 1 : analysis ? 1 : 0) + addons,
  };
}
