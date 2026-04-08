import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface ProductPlan {
    id: bigint;
    features: Array<string>;
    name: string;
    description: string;
    price: bigint;
}
export type Time = bigint;
export interface LeaderboardEntry {
    username: string;
    user: Principal;
    weeklyPoints: bigint;
    vipTier?: string;
}
export interface PaymentMethod {
    name: string;
    description: string;
}
export interface EarningRecord {
    dailyEarned: bigint;
    consecutiveLosses: bigint;
    streakDays: bigint;
    lastEarnDate: bigint;
    vipTier?: string;
    lastTaskTime: bigint;
}
export interface AdminSettings {
    withdrawalEnabled: boolean;
    dailyCapINR: bigint;
    dailyCapNPR: bigint;
    earningEnabled: boolean;
    taskRewardMax: bigint;
    taskRewardMin: bigint;
    rewardMultiplier: bigint;
}
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
export interface VIPPurchase {
    id: bigint;
    status: VIPStatus;
    userName: string;
    paymentMethod: string;
    userEmail: string;
    tier: string;
    user: Principal;
    submittedAt: bigint;
    currency: string;
    amount: bigint;
    screenshot: string;
}
export interface SpinHistory {
    totalWon: bigint;
    totalSpins: bigint;
    lastSpin: bigint;
}
export interface BackupData {
    snapshotTime: Time;
    users: Array<UserProfile>;
    totalUsers: bigint;
    transactions: Array<Transaction>;
    totalBalance: bigint;
}
export interface Notification {
    id: bigint;
    notifType: string;
    createdAt: bigint;
    isRead: boolean;
    message: string;
}
export interface FraudLog {
    action: string;
    user: Principal;
    timestamp: bigint;
    reason: string;
}
export interface UserProfile {
    lastLoginDate: bigint;
    isFrozen: boolean;
    referralCode: string;
    frozenReason?: string;
    username: string;
    balance: bigint;
    loginStreak: bigint;
    user: Principal;
    weeklyPoints: bigint;
    referralEarnings: bigint;
    referredBy?: Principal;
    deviceId?: string;
    totalPoints: bigint;
    vipTier?: string;
    vipExpiry?: bigint;
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
    task_reward = "task_reward",
    deposit = "deposit",
    vip_purchase = "vip_purchase",
    spin_reward = "spin_reward",
    withdrawal = "withdrawal",
    login_bonus = "login_bonus",
    referral_bonus = "referral_bonus",
    purchase = "purchase"
}
export enum UserRole {
    admin = "admin",
    user = "user"
}
export enum VIPStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    addPaymentMethod(pm: PaymentMethod): Promise<void>;
    approveTransaction(transactionId: bigint): Promise<void>;
    approveVIPPurchase(id: bigint): Promise<void>;
    assignAdmin(): Promise<boolean>;
    createDepositRequest(amount: bigint, paymentMethod: string, extraNotes: string): Promise<bigint>;
    createSupportTicket(guestName: string, guestEmail: string, problemSummary: string): Promise<bigint>;
    freezeUser(user: Principal, reason: string): Promise<void>;
    getAdminSettings(): Promise<AdminSettings>;
    getAllPaymentMethods(): Promise<Array<PaymentMethod>>;
    getAllProductPlans(): Promise<Array<ProductPlan>>;
    getAllSupportTickets(): Promise<Array<SupportTicket>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getEarningRecord(user: Principal): Promise<EarningRecord | null>;
    getFraudLogs(): Promise<Array<FraudLog>>;
    getFullBackupData(): Promise<BackupData>;
    getLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getMyTickets(): Promise<Array<SupportTicket>>;
    getMyVIPPurchases(): Promise<Array<VIPPurchase>>;
    getNotifications(): Promise<Array<Notification>>;
    getPlatformRevenue(): Promise<{
        revenue: bigint;
        canWithdraw: boolean;
        payouts: bigint;
    }>;
    getPlatformStats(): Promise<{
        totalUsers: bigint;
        totalTransactions: bigint;
    }>;
    getSpinHistory(user: Principal): Promise<SpinHistory | null>;
    getUserBalance(address: Principal): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVIPPurchases(): Promise<Array<VIPPurchase>>;
    isUserFrozen(user: Principal): Promise<boolean>;
    isWithdrawalAllowed(): Promise<boolean>;
    markNotificationRead(id: bigint): Promise<void>;
    processPurchase(productId: bigint, referralCode: string | null): Promise<bigint>;
    recordFraudLog(user: Principal, reason: string): Promise<void>;
    recordSpinResult(result: string, amountWon: bigint): Promise<void>;
    registerUser(username: string, referralCode: string | null): Promise<UserProfile>;
    rejectTransaction(transactionId: bigint): Promise<void>;
    rejectVIPPurchase(id: bigint): Promise<void>;
    removePaymentMethod(name: string): Promise<void>;
    replyToTicket(ticketId: bigint, reply: string): Promise<void>;
    requestWithdrawal(amount: bigint, paymentMethod: string, extraNotes: string): Promise<bigint>;
    resolveTicket(ticketId: bigint): Promise<void>;
    restoreUserBalances(updates: Array<[Principal, bigint]>): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendAdminNotification(user: Principal, message: string): Promise<void>;
    submitVIPPurchase(tier: string, amount: bigint, currency: string, paymentMethod: string, screenshot: string, userName: string, userEmail: string): Promise<bigint>;
    unfreezeUser(user: Principal): Promise<void>;
    updateAdminSettings(settings: AdminSettings): Promise<void>;
    updateDailyEarning(user: Principal, amount: bigint): Promise<void>;
    updatePlatformRevenue(amount: bigint): Promise<void>;
    updateUserBalance(user: Principal, newBalance: bigint): Promise<void>;
    updateUserRole(user: Principal, role: UserRole): Promise<void>;
}
