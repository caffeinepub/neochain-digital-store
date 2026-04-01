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
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
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
      if (!actor) return [];
      return actor.getAllPaymentMethods();
    },
    enabled: !!actor && !isFetching,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).createDepositRequest(
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).requestWithdrawal(
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
