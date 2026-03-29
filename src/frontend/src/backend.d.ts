import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ProductPlan {
    id: bigint;
    features: Array<string>;
    name: string;
    description: string;
    price: bigint;
}
export type Time = bigint;
export interface PaymentMethod {
    name: string;
    description: string;
}
export interface UserProfile {
    referralCode: string;
    username: string;
    balance: bigint;
    user: Principal;
    referralEarnings: bigint;
    referredBy?: Principal;
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
    getAllPaymentMethods(): Promise<Array<PaymentMethod>>;
    getAllProductPlans(): Promise<Array<ProductPlan>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
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
    requestWithdrawal(amount: bigint, paymentMethod: string, extraNotes: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateUserBalance(user: Principal, newBalance: bigint): Promise<void>;
    updateUserRole(user: Principal, role: UserRole): Promise<void>;
}
