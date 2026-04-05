import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PaymentMethod,
  ProductPlan,
  Transaction,
  UserProfile,
} from "../backend.d";
import type { UserRole } from "../backend.d";
import { useActor } from "./useActor";

// localStorage cache helpers — survive fresh deployments
const USERS_CACHE_KEY = "neochain_users_cache";
const TRANSACTIONS_CACHE_KEY = "neochain_tx_cache";
const PAYMENT_METHODS_CACHE_KEY = "neochain_pm_cache";

function loadCache<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCache<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["allTransactions"],
    queryFn: async () => {
      if (!actor) return loadCache<Transaction>(TRANSACTIONS_CACHE_KEY);
      try {
        const result = await actor.getAllTransactions();
        // Only cache if we got real data; don't return stale cache when backend says empty
        if (result && result.length > 0) {
          saveCache(TRANSACTIONS_CACHE_KEY, result);
          return result;
        }
        // Backend returned empty array — trust it, don't use stale cache
        return result ?? [];
      } catch {
        // Only fall back to cache on error (network issue, canister down etc.)
        return loadCache<Transaction>(TRANSACTIONS_CACHE_KEY);
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return loadCache<UserProfile>(USERS_CACHE_KEY);
      try {
        const result = await actor.getAllUsers();
        // Only cache if we got real data; don't return stale cache when backend says empty
        if (result && result.length > 0) {
          saveCache(USERS_CACHE_KEY, result);
          return result;
        }
        // Backend returned empty — trust it
        return result ?? [];
      } catch {
        // Only fall back to cache on error
        return loadCache<UserProfile>(USERS_CACHE_KEY);
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function usePlatformStats() {
  const { actor, isFetching } = useActor();
  return useQuery<{ totalUsers: bigint; totalTransactions: bigint }>({
    queryKey: ["platformStats"],
    queryFn: async () => {
      if (!actor) return { totalUsers: 0n, totalTransactions: 0n };
      return actor.getPlatformStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProductPlans() {
  const { actor, isFetching } = useActor();
  return useQuery<ProductPlan[]>({
    queryKey: ["productPlans"],
    queryFn: async () => {
      if (!actor) return [];
      const plans = await actor.getAllProductPlans();
      return plans;
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePaymentMethods() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentMethod[]>({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      if (!actor) return loadCache<PaymentMethod>(PAYMENT_METHODS_CACHE_KEY);
      try {
        const result = await actor.getAllPaymentMethods();
        // Only cache if we got real data; don't return stale cache when backend says empty
        if (result && result.length > 0) {
          saveCache(PAYMENT_METHODS_CACHE_KEY, result);
          return result;
        }
        // Backend returned empty — trust it
        return result ?? [];
      } catch {
        // Only fall back to cache on error
        return loadCache<PaymentMethod>(PAYMENT_METHODS_CACHE_KEY);
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useDeposit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      paymentMethod,
      extraNotes,
    }: { amount: bigint; paymentMethod: string; extraNotes?: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createDepositRequest(
        amount,
        paymentMethod,
        extraNotes ?? "",
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["allTransactions"] });
    },
  });
}

export function useWithdraw() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      paymentMethod,
      extraNotes,
    }: { amount: bigint; paymentMethod: string; extraNotes?: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.requestWithdrawal(amount, paymentMethod, extraNotes ?? "");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["allTransactions"] });
    },
  });
}

export function usePurchase() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      referralCode,
    }: { productId: bigint; referralCode: string | null }) => {
      if (!actor) throw new Error("Not connected");
      return actor.processPurchase(productId, referralCode);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["allTransactions"] });
    },
  });
}

export function useApproveTransaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.approveTransaction(transactionId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allTransactions"] }),
  });
}

export function useRejectTransaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectTransaction(transactionId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allTransactions"] }),
  });
}

export function useUpdateUserBalance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      newBalance,
    }: { user: Principal; newBalance: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateUserBalance(user, newBalance);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allUsers"] }),
  });
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateUserRole(user, role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allUsers"] }),
  });
}

export function useAddPaymentMethod() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (method: PaymentMethod) => {
      if (!actor) throw new Error("Not connected");
      return actor.addPaymentMethod(method);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paymentMethods"] }),
  });
}

export function useRemovePaymentMethod() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.removePaymentMethod(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paymentMethods"] }),
  });
}

export function useAllSupportTickets() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allSupportTickets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSupportTickets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMyTickets() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myTickets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyTickets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSupportTicket() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      guestName,
      guestEmail,
      problemSummary,
    }: { guestName: string; guestEmail: string; problemSummary: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createSupportTicket(guestName, guestEmail, problemSummary);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myTickets"] }),
  });
}

export function useReplyToTicket() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      reply,
    }: { ticketId: bigint; reply: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.replyToTicket(ticketId, reply);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allSupportTickets"] }),
  });
}

export function useResolveTicket() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.resolveTicket(ticketId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allSupportTickets"] }),
  });
}

export function useFullBackupData() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["fullBackupData"],
    queryFn: async () => {
      if (!actor) return null;
      const [users, transactions] = await Promise.all([
        actor.getAllUsers(),
        actor.getAllTransactions(),
      ]);
      const totalBalance = users.reduce((s, u) => s + u.balance, BigInt(0));
      return {
        users,
        transactions,
        snapshotTime: BigInt(Date.now()) * BigInt(1_000_000),
        totalUsers: BigInt(users.length),
        totalBalance,
      };
    },
    enabled: !!actor && !isFetching,
    refetchInterval: false,
  });
}

export function useRestoreUserBalances() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      updates: Array<[import("@icp-sdk/core/principal").Principal, bigint]>,
    ) => {
      if (!actor) throw new Error("Not connected");
      await Promise.all(
        updates.map(([user, balance]) =>
          actor.updateUserBalance(user, balance),
        ),
      );
      return BigInt(updates.length);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsers"] });
      qc.invalidateQueries({ queryKey: ["fullBackupData"] });
      qc.invalidateQueries({ queryKey: ["platformStats"] });
    },
  });
}
