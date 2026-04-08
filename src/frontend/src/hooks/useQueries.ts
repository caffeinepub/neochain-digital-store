import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminSettings,
  EarningRecord,
  FraudLog,
  LeaderboardEntry,
  Notification,
  PaymentMethod,
  ProductPlan,
  SpinHistory,
  Transaction,
  UserProfile,
  VIPPurchase,
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
      // No isCallerAdmin method; admin auth is handled via password in AdminLoginPage
      return false;
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

// ─── Earning System Queries ────────────────────────────────────────────────

export function useEarningRecord(user?: Principal) {
  const { actor, isFetching } = useActor();
  return useQuery<EarningRecord | null>({
    queryKey: ["earningRecord", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getEarningRecord(user);
    },
    enabled: !!actor && !isFetching && !!user,
    staleTime: 15000,
  });
}

export function useSpinHistory(user?: Principal) {
  const { actor, isFetching } = useActor();
  return useQuery<SpinHistory | null>({
    queryKey: ["spinHistory", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getSpinHistory(user);
    },
    enabled: !!actor && !isFetching && !!user,
    staleTime: 15000,
  });
}

export function useVIPPurchases() {
  const { actor, isFetching } = useActor();
  return useQuery<VIPPurchase[]>({
    queryKey: ["vipPurchases"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVIPPurchases();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useMyVIPPurchases() {
  const { actor, isFetching } = useActor();
  return useQuery<VIPPurchase[]>({
    queryKey: ["myVIPPurchases"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyVIPPurchases();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAdminSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminSettings>({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      if (!actor) {
        return {
          earningEnabled: true,
          dailyCapINR: 2000n,
          dailyCapNPR: 3000n,
          taskRewardMin: 10n,
          taskRewardMax: 50n,
          rewardMultiplier: 100n,
          withdrawalEnabled: true,
        };
      }
      return actor.getAdminSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
  });
}

export function usePlatformRevenue() {
  const { actor, isFetching } = useActor();
  return useQuery<{ revenue: bigint; payouts: bigint; canWithdraw: boolean }>({
    queryKey: ["platformRevenue"],
    queryFn: async () => {
      if (!actor) return { revenue: 0n, payouts: 0n, canWithdraw: false };
      return actor.getPlatformRevenue();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useIsWithdrawalAllowed() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isWithdrawalAllowed"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isWithdrawalAllowed();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
  });
}

export function useFraudLogs() {
  const { actor, isFetching } = useActor();
  return useQuery<FraudLog[]>({
    queryKey: ["fraudLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFraudLogs();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
  });
}

// ─── Earning System Mutations ──────────────────────────────────────────────

export function useUpdateDailyEarning() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      amount,
    }: { user: Principal; amount: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateDailyEarning(user, amount);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["earningRecord", vars.user.toString()],
      });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useRecordSpinResult() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      result,
      amountWon,
    }: { result: string; amountWon: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.recordSpinResult(result, amountWon);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["spinHistory"] });
    },
  });
}

export function useSubmitVIPPurchase() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      tier: string;
      amount: bigint;
      currency: string;
      paymentMethod: string;
      screenshot: string;
      userName: string;
      userEmail: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitVIPPurchase(
        params.tier,
        params.amount,
        params.currency,
        params.paymentMethod,
        params.screenshot,
        params.userName,
        params.userEmail,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myVIPPurchases"] }),
  });
}

export function useApproveVIPPurchase() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.approveVIPPurchase(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vipPurchases"] });
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useRejectVIPPurchase() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectVIPPurchase(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vipPurchases"] }),
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.markNotificationRead(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useSendAdminNotification() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      user,
      message,
    }: { user: Principal; message: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendAdminNotification(user, message);
    },
  });
}

export function useUpdateAdminSettings() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: AdminSettings) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateAdminSettings(settings);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminSettings"] }),
  });
}

export function useUpdatePlatformRevenue() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.updatePlatformRevenue(amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platformRevenue"] });
      qc.invalidateQueries({ queryKey: ["isWithdrawalAllowed"] });
    },
  });
}

export function useRecordFraudLog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      reason,
    }: { user: Principal; reason: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.recordFraudLog(user, reason);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fraudLogs"] }),
  });
}

export function useFreezeUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.freezeUser(user);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allUsers"] }),
  });
}

export function useUnfreezeUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.unfreezeUser(user);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allUsers"] }),
  });
}
