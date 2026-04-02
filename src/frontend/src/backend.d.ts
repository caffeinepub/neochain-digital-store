import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transaction {
    id: bigint;
    status: TransactionStatus;
    paymentMethod: string;
    createdAt: Time;
    user: Principal;
    notes: string;
    txType: TransactionType;
    amount: bigint;
}
export interface SupportTicket {
    status: TicketStatus;
    problemSummary: string;
    adminReply: string;
    userId?: Principal;
    createdAt: Time;
    guestName: string;
    guestEmail: string;
    ticketId: bigint;
    adminRepliedAt?: Time;
}
export type Time = bigint;
export interface ProductPlan {
    id: bigint;
    features: Array<string>;
    name: string;
    description: string;
    price: bigint;
}
export interface PaymentMethod {
    name: string;
    description: string;
}
export interface BackupData {
    users: Array<UserProfile>;
    transactions: Array<Transaction>;
    snapshotTime: Time;
    totalUsers: bigint;
    totalBalance: bigint;
}

export interface UserProfile {
    referralCode: string;
    username: string;
    balance: bigint;
    user: Principal;
    referralEarnings: bigint;
    referredBy?: Principal;
}
export enum TicketStatus {
    resolved = "resolved",
    open = "open"
}
export enum TransactionStatus {
    pending = "pending",
    completed = "completed",
    approved = "approved",
    rejected = "rejected"
}
export enum TransactionType {
    deposit = "deposit",
    withdrawal = "withdrawal",
    referral_bonus = "referral_bonus",
    purchase = "purchase"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPaymentMethod(newPaymentMethod: PaymentMethod): Promise<void>;
    approveTransaction(transactionId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createDepositRequest(amount: bigint, paymentMethod: string, extraNotes: string): Promise<bigint>;
    createSupportTicket(guestName: string, guestEmail: string, problemSummary: string): Promise<bigint>;
    getAllPaymentMethods(): Promise<Array<PaymentMethod>>;
    getAllProductPlans(): Promise<Array<ProductPlan>>;
    getAllSupportTickets(): Promise<Array<SupportTicket>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyTickets(): Promise<Array<SupportTicket>>;
    getPlatformStats(): Promise<{
        totalUsers: bigint;
        totalTransactions: bigint;
    }>;
    getUserBalance(address: Principal): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    processPurchase(productId: bigint, referralCode: string | null): Promise<bigint>;
    registerUser(username: string, referralCode: string | null): Promise<UserProfile>;
    rejectTransaction(transactionId: bigint): Promise<void>;
    removePaymentMethod(name: string): Promise<void>;
    replyToTicket(ticketId: bigint, reply: string): Promise<void>;
    requestWithdrawal(amount: bigint, paymentMethod: string, extraNotes: string): Promise<bigint>;
    resolveTicket(ticketId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateUserBalance(user: Principal, newBalance: bigint): Promise<void>;
    updateUserRole(user: Principal, role: UserRole): Promise<void>;
    getFullBackupData(): Promise<BackupData>;
    restoreUserBalances(updates: Array<[Principal, bigint]>): Promise<bigint>;

}
