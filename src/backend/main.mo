import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Migration "migration";

(with migration = Migration.run)
actor {

  // ──────────────────────────────────────────────
  // INLINE ADMIN / ROLE LOGIC (no external mixin)
  // ──────────────────────────────────────────────

  public type UserRole = {
    #admin;
    #user;
  };

  let userRoles = Map.empty<Principal, UserRole>();
  var adminPrincipal : ?Principal = null;
  var adminAssigned : Bool = false;

  func isAdmin(caller : Principal) : Bool {
    switch (adminPrincipal) {
      case (?ap) { ap == caller };
      case null {
        switch (userRoles.get(caller)) {
          case (?(#admin)) { true };
          case _ { false };
        };
      };
    };
  };

  func requireAdmin(caller : Principal) {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  func requireUser(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
  };

  // ──────────────────────────────────────────────
  // COMPARE MODULES
  // ──────────────────────────────────────────────

  module PaymentMethod {
    public func compare(a : PaymentMethod, b : PaymentMethod) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module ProductPlan {
    public func compare(p1 : ProductPlan, p2 : ProductPlan) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Nat.compare(t1.id, t2.id);
    };
  };

  module SupportTicket {
    public func compare(t1 : SupportTicket, t2 : SupportTicket) : Order.Order {
      Nat.compare(t1.ticketId, t2.ticketId);
    };
  };

  module VIPPurchase {
    public func compare(v1 : VIPPurchase, v2 : VIPPurchase) : Order.Order {
      Nat.compare(v1.id, v2.id);
    };
  };

  module UserProfile {
    public func compare(a : UserProfile, b : UserProfile) : Order.Order {
      Text.compare(a.username, b.username);
    };
  };

  module LeaderboardEntry {
    public func compare(a : LeaderboardEntry, b : LeaderboardEntry) : Order.Order {
      // Descending by weeklyPoints
      Nat.compare(b.weeklyPoints, a.weeklyPoints);
    };
  };

  // ──────────────────────────────────────────────
  // TYPES
  // ──────────────────────────────────────────────

  public type ProductPlan = {
    id : Nat;
    name : Text;
    price : Nat;
    features : [Text];
    description : Text;
  };

  public type TransactionType = {
    #deposit;
    #withdrawal;
    #purchase;
    #referral_bonus;
    #task_reward;
    #spin_reward;
    #login_bonus;
    #vip_purchase;
  };

  public type TransactionStatus = {
    #pending;
    #approved;
    #rejected;
    #completed;
  };

  public type Transaction = {
    id : Nat;
    user : Principal;
    txType : TransactionType;
    amount : Nat;
    status : TransactionStatus;
    paymentMethod : Text;
    createdAt : Time.Time;
    notes : Text;
  };

  public type PaymentMethod = {
    name : Text;
    description : Text;
  };

  public type UserProfile = {
    user : Principal;
    username : Text;
    balance : Nat;
    referralCode : Text;
    referredBy : ?Principal;
    referralEarnings : Nat;
    // Extended fields for earning system
    deviceId : ?Text;
    isFrozen : Bool;
    frozenReason : ?Text;
    vipTier : ?Text;
    vipExpiry : ?Int;
    totalPoints : Nat;
    weeklyPoints : Nat;
    loginStreak : Nat;
    lastLoginDate : Int;
  };

  public type TicketStatus = {
    #open;
    #resolved;
  };

  public type SupportTicket = {
    ticketId : Nat;
    userId : ?Principal;
    guestName : Text;
    guestEmail : Text;
    problemSummary : Text;
    status : TicketStatus;
    createdAt : Time.Time;
    adminReply : Text;
    adminRepliedAt : ?Time.Time;
  };

  // ── Earning System Types ──

  public type EarningRecord = {
    dailyEarned : Nat;
    lastEarnDate : Int;
    lastTaskTime : Int;
    streakDays : Nat;
    consecutiveLosses : Nat;
    vipTier : ?Text;
  };

  public type SpinHistory = {
    lastSpin : Int;
    totalSpins : Nat;
    totalWon : Nat;
  };

  public type VIPStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type VIPPurchase = {
    id : Nat;
    user : Principal;
    tier : Text;
    amount : Nat;
    currency : Text;
    paymentMethod : Text;
    screenshot : Text;
    status : VIPStatus;
    submittedAt : Int;
    userName : Text;
    userEmail : Text;
  };

  public type Notification = {
    id : Nat;
    message : Text;
    notifType : Text;
    isRead : Bool;
    createdAt : Int;
  };

  public type FraudLog = {
    user : Principal;
    reason : Text;
    timestamp : Int;
    action : Text;
  };

  public type AdminSettings = {
    earningEnabled : Bool;
    dailyCapINR : Nat;
    dailyCapNPR : Nat;
    taskRewardMin : Nat;
    taskRewardMax : Nat;
    rewardMultiplier : Nat;
    withdrawalEnabled : Bool;
  };

  public type LeaderboardEntry = {
    user : Principal;
    username : Text;
    weeklyPoints : Nat;
    vipTier : ?Text;
  };

  public type BackupData = {
    users : [UserProfile];
    transactions : [Transaction];
    snapshotTime : Time.Time;
    totalUsers : Nat;
    totalBalance : Nat;
  };

  // ──────────────────────────────────────────────
  // IN-MEMORY STATE
  // ──────────────────────────────────────────────

  let productPlans = Map.empty<Nat, ProductPlan>();
  let transactions = Map.empty<Nat, Transaction>();
  let referralCodes = Map.empty<Text, Principal>();
  let paymentMethods = Map.empty<Text, PaymentMethod>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userReferralEarnings = Map.empty<Principal, Nat>();
  let supportTickets = Map.empty<Nat, SupportTicket>();

  // Earning system in-memory state
  let earningRecords = Map.empty<Principal, EarningRecord>();
  let spinHistories = Map.empty<Principal, SpinHistory>();
  let taskCompletions = Map.empty<Principal, List.List<Int>>();  // timestamps
  let vipPurchases = Map.empty<Nat, VIPPurchase>();
  let notifications = Map.empty<Principal, List.List<Notification>>();
  let fraudLogs = Map.empty<Principal, FraudLog>();

  var nextTransactionId = 1;
  var nextTicketId = 1;
  var nextVIPId = 1;
  var nextNotifId = 1;
  var platformRevenue : Nat = 0;
  var platformPayouts : Nat = 0;

  var adminSettings : AdminSettings = {
    earningEnabled = true;
    dailyCapINR = 20;
    dailyCapNPR = 30;
    taskRewardMin = 1;   // in paise (0.01 INR units) — frontend divides by 100
    taskRewardMax = 50;  // 0.50 INR
    rewardMultiplier = 100; // 100 = 1x, 150 = 1.5x, 200 = 2x, 300 = 3x
    withdrawalEnabled = true;
  };

  // ──────────────────────────────────────────────
  // STABLE VARIABLES (for preupgrade/postupgrade)
  // ──────────────────────────────────────────────

  stable var stableUserProfiles : [(Principal, UserProfile)] = [];
  stable var stableTransactions : [(Nat, Transaction)] = [];
  stable var stableReferralCodes : [(Text, Principal)] = [];
  stable var stablePaymentMethods : [(Text, PaymentMethod)] = [];
  stable var stableNextTransactionId : Nat = 1;
  stable var stableAdminAssigned : Bool = false;
  stable var stableAdminPrincipal : ?Principal = null;
  stable var stableUserRoles : [(Principal, UserRole)] = [];
  stable var stableSupportTickets : [(Nat, SupportTicket)] = [];
  stable var stableNextTicketId : Nat = 1;

  // Earning system stable variables
  stable var stableEarningRecords : [(Principal, EarningRecord)] = [];
  stable var stableSpinHistories : [(Principal, SpinHistory)] = [];
  stable var stableVIPPurchases : [(Nat, VIPPurchase)] = [];
  stable var stableNextVIPId : Nat = 1;
  stable var stableNotifications : [(Principal, [Notification])] = [];
  stable var stableFraudLogs : [(Principal, FraudLog)] = [];
  stable var stableAdminSettings : ?AdminSettings = null;
  stable var stablePlatformRevenue : Nat = 0;
  stable var stablePlatformPayouts : Nat = 0;

  // ──────────────────────────────────────────────
  // UPGRADE HOOKS
  // ──────────────────────────────────────────────

  system func preupgrade() {
    stableUserProfiles := userProfiles.entries().toArray();
    stableTransactions := transactions.entries().toArray();
    stableReferralCodes := referralCodes.entries().toArray();
    stablePaymentMethods := paymentMethods.entries().toArray();
    stableNextTransactionId := nextTransactionId;
    stableAdminAssigned := adminAssigned;
    stableAdminPrincipal := adminPrincipal;
    stableUserRoles := userRoles.entries().toArray();
    stableSupportTickets := supportTickets.entries().toArray();
    stableNextTicketId := nextTicketId;

    stableEarningRecords := earningRecords.entries().toArray();
    stableSpinHistories := spinHistories.entries().toArray();
    stableVIPPurchases := vipPurchases.entries().toArray();
    stableNextVIPId := nextVIPId;
    stableFraudLogs := fraudLogs.entries().toArray();
    stableAdminSettings := ?adminSettings;
    stablePlatformRevenue := platformRevenue;
    stablePlatformPayouts := platformPayouts;

    // Serialize notifications (List → Array)
    let notifEntries = List.empty<(Principal, [Notification])>();
    for ((p, notifList) in notifications.entries()) {
      notifEntries.add((p, notifList.toArray()));
    };
    stableNotifications := notifEntries.toArray();
  };

  system func postupgrade() {
    for ((k, v) in stableUserProfiles.vals()) { userProfiles.add(k, v) };
    for ((k, v) in stableTransactions.vals()) { transactions.add(k, v) };
    for ((k, v) in stableReferralCodes.vals()) { referralCodes.add(k, v) };
    for ((k, v) in stablePaymentMethods.vals()) { paymentMethods.add(k, v) };
    nextTransactionId := stableNextTransactionId;
    adminAssigned := stableAdminAssigned;
    adminPrincipal := stableAdminPrincipal;
    for ((k, v) in stableUserRoles.vals()) { userRoles.add(k, v) };
    for ((k, v) in stableSupportTickets.vals()) { supportTickets.add(k, v) };
    nextTicketId := stableNextTicketId;

    for ((k, v) in stableEarningRecords.vals()) { earningRecords.add(k, v) };
    for ((k, v) in stableSpinHistories.vals()) { spinHistories.add(k, v) };
    for ((k, v) in stableVIPPurchases.vals()) { vipPurchases.add(k, v) };
    nextVIPId := stableNextVIPId;
    for ((k, v) in stableFraudLogs.vals()) { fraudLogs.add(k, v) };
    platformRevenue := stablePlatformRevenue;
    platformPayouts := stablePlatformPayouts;

    switch (stableAdminSettings) {
      case (?s) { adminSettings := s };
      case null {};
    };

    // Restore notifications (Array → List)
    for ((p, arr) in stableNotifications.vals()) {
      let lst = List.fromArray<Notification>(arr);
      notifications.add(p, lst);
    };

    seedProductPlans();
  };

  // ──────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────

  func getNextTransactionId() : Nat {
    let id = nextTransactionId;
    nextTransactionId += 1;
    id;
  };

  func getNextTicketId() : Nat {
    let id = nextTicketId;
    nextTicketId += 1;
    id;
  };

  func getNextVIPId() : Nat {
    let id = nextVIPId;
    nextVIPId += 1;
    id;
  };

  func getNextNotifId() : Nat {
    let id = nextNotifId;
    nextNotifId += 1;
    id;
  };

  func generateReferralCode(user : Principal) : Text {
    let userText = user.toText();
    let len = userText.size();
    if (len >= 8) {
      Text.fromIter(userText.toIter().take(8));
    } else {
      userText # Text.fromArray(Array.repeat<Char>('0', 8 - len));
    };
  };

  func addNotification(user : Principal, message : Text, notifType : Text) {
    let notif : Notification = {
      id = getNextNotifId();
      message;
      notifType;
      isRead = false;
      createdAt = Time.now();
    };
    switch (notifications.get(user)) {
      case (?lst) { lst.add(notif) };
      case null {
        let lst = List.empty<Notification>();
        lst.add(notif);
        notifications.add(user, lst);
      };
    };
  };

  func seedProductPlans() {
    if (productPlans.size() > 0) return;
    productPlans.add(1, {
      id = 1;
      name = "Starter Pack";
      price = 1500;
      features = ["20% Referral Commission", "Instant Activation", "One-time Purchase", "Fast Approval"];
      description = "Start your earning journey with a simple, beginner-friendly digital product.";
    });
    productPlans.add(2, {
      id = 2;
      name = "Growth Pack";
      price = 3000;
      features = ["20% Referral Commission", "Instant Activation", "One-time Purchase", "Fast Approval"];
      description = "Accelerate your income with higher referral returns.";
    });
    productPlans.add(3, {
      id = 3;
      name = "Pro Pack";
      price = 5000;
      features = ["17% Referral Commission", "Instant Activation", "One-time Purchase", "Priority Approval"];
      description = "Maximize your earning potential with premium referral benefits.";
    });
    productPlans.add(4, {
      id = 4;
      name = "Elite Pack";
      price = 8000;
      features = ["15% Referral Commission", "Instant Activation", "One-time Purchase", "VIP Support"];
      description = "Top-tier plan for serious earners.";
    });
  };

  // Seed plans on fresh install (postupgrade doesn't run on first deploy)
  ignore do { seedProductPlans() };

  // ──────────────────────────────────────────────
  // ADMIN SELF-ASSIGNMENT
  // ──────────────────────────────────────────────

  public shared ({ caller }) func assignAdmin() : async Bool {
    if (adminAssigned) {
      Runtime.trap("Admin already assigned");
    };
    adminPrincipal := ?caller;
    adminAssigned := true;
    userRoles.add(caller, #admin);
    true;
  };

  // ──────────────────────────────────────────────
  // USER REGISTRATION & PROFILE
  // ──────────────────────────────────────────────

  public shared ({ caller }) func registerUser(username : Text, referralCode : ?Text) : async UserProfile {
    requireUser(caller);
    if (username == "") { Runtime.trap("Username cannot be empty") };
    if (username.size() > 30) { Runtime.trap("Username cannot exceed 30 characters") };
    if (userProfiles.containsKey(caller)) { Runtime.trap("User already registered") };

    var referredBy : ?Principal = null;
    switch (referralCode) {
      case null {};
      case (?code) {
        if (code == "") { Runtime.trap("Referral code cannot be empty") };
        if (code.size() != 8) { Runtime.trap("Referral code must be exactly 8 characters") };
        switch (referralCodes.get(code)) {
          case null { Runtime.trap("Referral code does not exist") };
          case (?owner) {
            if (owner == caller) { Runtime.trap("Cannot use your own referral code") };
            referredBy := ?owner;
          };
        };
      };
    };

    let newReferralCode = generateReferralCode(caller);
    referralCodes.add(newReferralCode, caller);

    let profile : UserProfile = {
      user = caller;
      username;
      balance = 0;
      referralCode = newReferralCode;
      referredBy;
      referralEarnings = 0;
      deviceId = null;
      isFrozen = false;
      frozenReason = null;
      vipTier = null;
      vipExpiry = null;
      totalPoints = 0;
      weeklyPoints = 0;
      loginStreak = 0;
      lastLoginDate = 0;
    };
    userProfiles.add(caller, profile);
    userReferralEarnings.add(caller, 0);
    profile;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireUser(caller);
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireUser(caller);
    if (profile.user != caller) { Runtime.trap("Cannot save profile for another user") };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getUserBalance(address : Principal) : async Nat {
    if (caller != address and not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance");
    };
    switch (userProfiles.get(address)) {
      case null { 0 };
      case (?p) { p.balance };
    };
  };

  // ──────────────────────────────────────────────
  // TRANSACTIONS
  // ──────────────────────────────────────────────

  public shared ({ caller }) func createDepositRequest(amount : Nat, paymentMethod : Text, extraNotes : Text) : async Nat {
    requireUser(caller);
    if (amount == 0) { Runtime.trap("Deposit amount must be greater than zero") };
    if (paymentMethod == "") { Runtime.trap("Payment method cannot be empty") };

    if (not userProfiles.containsKey(caller)) {
      let autoCode = generateReferralCode(caller);
      if (not referralCodes.containsKey(autoCode)) {
        referralCodes.add(autoCode, caller);
      };
      userProfiles.add(caller, {
        user = caller;
        username = "User";
        balance = 0;
        referralCode = autoCode;
        referredBy = null;
        referralEarnings = 0;
        deviceId = null;
        isFrozen = false;
        frozenReason = null;
        vipTier = null;
        vipExpiry = null;
        totalPoints = 0;
        weeklyPoints = 0;
        loginStreak = 0;
        lastLoginDate = 0;
      });
      userReferralEarnings.add(caller, 0);
    };

    let txId = getNextTransactionId();
    let notes = if (extraNotes == "") { "Deposit request created" } else { extraNotes };
    transactions.add(txId, {
      id = txId;
      user = caller;
      txType = #deposit;
      amount;
      status = #pending;
      paymentMethod;
      createdAt = Time.now();
      notes;
    });
    txId;
  };

  public shared ({ caller }) func requestWithdrawal(amount : Nat, paymentMethod : Text, extraNotes : Text) : async Nat {
    requireUser(caller);
    if (amount == 0) { Runtime.trap("Withdrawal amount must be greater than zero") };
    if (paymentMethod == "") { Runtime.trap("Payment method cannot be empty") };
    if (not adminSettings.withdrawalEnabled) {
      Runtime.trap("Withdrawals are currently disabled");
    };
    if (platformRevenue > 0 and platformPayouts + amount > platformRevenue) {
      Runtime.trap("Withdrawals temporarily unavailable: platform revenue insufficient");
    };

    switch (userProfiles.get(caller)) {
      case null { Runtime.trap("User profile not found. Please register first.") };
      case (?profile) {
        if (profile.isFrozen) { Runtime.trap("Account is frozen. Contact support.") };
        if (profile.balance < amount) { Runtime.trap("Insufficient balance") };

        userProfiles.add(caller, { profile with balance = profile.balance - amount });

        let txId = getNextTransactionId();
        let notes = if (extraNotes == "") { "Withdrawal request created" } else { extraNotes };
        transactions.add(txId, {
          id = txId;
          user = caller;
          txType = #withdrawal;
          amount;
          status = #pending;
          paymentMethod;
          createdAt = Time.now();
          notes;
        });
        txId;
      };
    };
  };

  public shared ({ caller }) func processPurchase(productId : Nat, referralCode : ?Text) : async Nat {
    requireUser(caller);
    let product = switch (productPlans.get(productId)) {
      case null { Runtime.trap("Product not found") };
      case (?p) { p };
    };

    switch (userProfiles.get(caller)) {
      case null { Runtime.trap("User not found") };
      case (?profile) {
        if (profile.isFrozen) { Runtime.trap("Account is frozen.") };
        if (profile.balance < product.price) { Runtime.trap("Insufficient balance to purchase product") };

        userProfiles.add(caller, { profile with balance = profile.balance - product.price });

        let txId = getNextTransactionId();
        transactions.add(txId, {
          id = txId;
          user = caller;
          txType = #purchase;
          amount = product.price;
          status = #completed;
          paymentMethod = "balance";
          createdAt = Time.now();
          notes = "Product purchase: " # product.name;
        });

        // Referral bonus
        switch (profile.referredBy) {
          case null {};
          case (?referrer) {
            let bonusAmount = product.price / 10;
            switch (userProfiles.get(referrer)) {
              case null {};
              case (?rp) {
                userProfiles.add(referrer, {
                  rp with
                  balance = rp.balance + bonusAmount;
                  referralEarnings = rp.referralEarnings + bonusAmount;
                });
                let bonusTxId = getNextTransactionId();
                transactions.add(bonusTxId, {
                  id = bonusTxId;
                  user = referrer;
                  txType = #referral_bonus;
                  amount = bonusAmount;
                  status = #completed;
                  paymentMethod = "referral";
                  createdAt = Time.now();
                  notes = "Referral bonus from " # profile.username;
                });
                addNotification(referrer, "You earned a commission from " # profile.username # "'s plan purchase!", "referral_commission");
              };
            };
          };
        };

        txId;
      };
    };
  };

  public query func getAllProductPlans() : async [ProductPlan] {
    productPlans.values().toArray().sort();
  };

  public shared ({ caller }) func addPaymentMethod(pm : PaymentMethod) : async () {
    requireAdmin(caller);
    if (pm.name == "") { Runtime.trap("Payment method name cannot be empty") };
    if (pm.description == "") { Runtime.trap("Payment method description cannot be empty") };
    paymentMethods.add(pm.name, pm);
  };

  public shared ({ caller }) func removePaymentMethod(name : Text) : async () {
    requireAdmin(caller);
    if (not paymentMethods.containsKey(name)) { Runtime.trap("Payment method not found") };
    paymentMethods.remove(name);
  };

  public query func getAllPaymentMethods() : async [PaymentMethod] {
    paymentMethods.values().toArray().sort();
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    requireAdmin(caller);
    userProfiles.values().toArray().sort();
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    requireAdmin(caller);
    transactions.values().toArray().sort();
  };

  public shared ({ caller }) func approveTransaction(transactionId : Nat) : async () {
    requireAdmin(caller);
    switch (transactions.get(transactionId)) {
      case null { Runtime.trap("Transaction not found") };
      case (?tx) {
        if (tx.status != #pending) { Runtime.trap("Transaction is not pending") };
        transactions.add(transactionId, { tx with status = #approved; notes = tx.notes # " (approved)" });
        if (tx.txType == #deposit) {
          switch (userProfiles.get(tx.user)) {
            case null {};
            case (?profile) {
              userProfiles.add(tx.user, { profile with balance = profile.balance + tx.amount });
            };
          };
          // Deposit approval counts as platform revenue
          platformRevenue += tx.amount;
        } else if (tx.txType == #withdrawal) {
          // Withdrawal approval: track as payout
          platformPayouts += tx.amount;
          addNotification(tx.user, "Your withdrawal of ₹" # tx.amount.toText() # " has been approved. Processing in 3–7 days.", "withdrawal_approved");
        };
      };
    };
  };

  public shared ({ caller }) func rejectTransaction(transactionId : Nat) : async () {
    requireAdmin(caller);
    switch (transactions.get(transactionId)) {
      case null { Runtime.trap("Transaction not found") };
      case (?tx) {
        if (tx.status != #pending) { Runtime.trap("Transaction is not pending") };
        transactions.add(transactionId, { tx with status = #rejected; notes = tx.notes # " (rejected)" });
        if (tx.txType == #withdrawal) {
          // Refund the balance that was deducted on request
          switch (userProfiles.get(tx.user)) {
            case null {};
            case (?profile) {
              userProfiles.add(tx.user, { profile with balance = profile.balance + tx.amount });
            };
          };
          addNotification(tx.user, "Your withdrawal request of ₹" # tx.amount.toText() # " was rejected. Contact support.", "withdrawal_rejected");
        };
      };
    };
  };

  public shared ({ caller }) func updateUserBalance(user : Principal, newBalance : Nat) : async () {
    requireAdmin(caller);
    switch (userProfiles.get(user)) {
      case null { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(user, { profile with balance = newBalance });
      };
    };
  };

  public shared ({ caller }) func updateUserRole(user : Principal, role : UserRole) : async () {
    requireAdmin(caller);
    userRoles.add(user, role);
  };

  public query ({ caller }) func getPlatformStats() : async {
    totalUsers : Nat;
    totalTransactions : Nat;
  } {
    requireAdmin(caller);
    { totalUsers = userProfiles.size(); totalTransactions = transactions.size() };
  };

  // ──────────────────────────────────────────────
  // SUPPORT TICKETS
  // ──────────────────────────────────────────────

  public shared ({ caller }) func createSupportTicket(guestName : Text, guestEmail : Text, problemSummary : Text) : async Nat {
    if (problemSummary == "") { Runtime.trap("Problem summary cannot be empty") };
    let isAnon = caller.isAnonymous();
    let userId : ?Principal = if (isAnon) null else ?caller;
    let ticketId = getNextTicketId();
    supportTickets.add(ticketId, {
      ticketId;
      userId;
      guestName;
      guestEmail;
      problemSummary;
      status = #open;
      createdAt = Time.now();
      adminReply = "";
      adminRepliedAt = null;
    });
    ticketId;
  };

  public query ({ caller }) func getMyTickets() : async [SupportTicket] {
    requireUser(caller);
    let all = supportTickets.values().toArray();
    all.filter<SupportTicket>(func(t) {
      switch (t.userId) {
        case null { false };
        case (?uid) { uid == caller };
      }
    });
  };

  public query ({ caller }) func getAllSupportTickets() : async [SupportTicket] {
    requireAdmin(caller);
    supportTickets.values().toArray().sort();
  };

  public shared ({ caller }) func replyToTicket(ticketId : Nat, reply : Text) : async () {
    requireAdmin(caller);
    switch (supportTickets.get(ticketId)) {
      case null { Runtime.trap("Ticket not found") };
      case (?ticket) {
        supportTickets.add(ticketId, { ticket with adminReply = reply; adminRepliedAt = ?Time.now() });
      };
    };
  };

  public shared ({ caller }) func resolveTicket(ticketId : Nat) : async () {
    requireAdmin(caller);
    switch (supportTickets.get(ticketId)) {
      case null { Runtime.trap("Ticket not found") };
      case (?ticket) {
        supportTickets.add(ticketId, { ticket with status = #resolved });
      };
    };
  };

  // ──────────────────────────────────────────────
  // BACKUP & RECOVERY
  // ──────────────────────────────────────────────

  public query ({ caller }) func getFullBackupData() : async BackupData {
    requireAdmin(caller);
    let allUsers = userProfiles.values().toArray().sort();
    let allTxs = transactions.values().toArray().sort();
    var totalBal : Nat = 0;
    for (u in allUsers.vals()) { totalBal += u.balance };
    {
      users = allUsers;
      transactions = allTxs;
      snapshotTime = Time.now();
      totalUsers = allUsers.size();
      totalBalance = totalBal;
    };
  };

  public shared ({ caller }) func restoreUserBalances(updates : [(Principal, Nat)]) : async Nat {
    requireAdmin(caller);
    var count = 0;
    for ((principal, balance) in updates.vals()) {
      switch (userProfiles.get(principal)) {
        case (?profile) {
          userProfiles.add(principal, { profile with balance });
          count += 1;
        };
        case null {};
      };
    };
    count;
  };

  // ──────────────────────────────────────────────
  // EARNING SYSTEM
  // ──────────────────────────────────────────────

  public query ({ caller }) func getEarningRecord(user : Principal) : async ?EarningRecord {
    if (caller != user and not isAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    earningRecords.get(user);
  };

  public shared ({ caller }) func updateDailyEarning(user : Principal, amount : Nat) : async () {
    // Only admin or the user themselves can call this
    if (caller != user and not isAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    if (not adminSettings.earningEnabled) {
      Runtime.trap("Earning is currently disabled");
    };

    let todayNs = Time.now();
    let todayDay = todayNs / 86_400_000_000_000; // truncate to day

    let existing = switch (earningRecords.get(user)) {
      case (?r) { r };
      case null {
        {
          dailyEarned = 0;
          lastEarnDate = 0;
          lastTaskTime = 0;
          streakDays = 0;
          consecutiveLosses = 0;
          vipTier = null;
        };
      };
    };

    // Reset daily counter if it's a new day
    let currentDayEarned : Nat = if (existing.lastEarnDate / 86_400_000_000_000 < todayDay) {
      0;
    } else {
      existing.dailyEarned;
    };

    // Daily cap uses INR by default; frontend computes the correct amount in the right currency before calling
    let dailyCap : Nat = adminSettings.dailyCapINR;

    // Apply VIP multiplier to reward amount (multiplier increases reward, but cap stays fixed)
    let vipMultiplier : Nat = switch (switch (userProfiles.get(user)) {
      case null { null };
      case (?p) { p.vipTier };
    }) {
      case (?"Basic") { 150 };   // 1.5x
      case (?"Pro") { 200 };     // 2x
      case (?"Premium") { 300 }; // 3x
      case _ { 100 };            // 1x
    };
    // Scale by rewardMultiplier (global) and VIP multiplier
    let scaledAmount : Nat = (amount * vipMultiplier * adminSettings.rewardMultiplier) / 10000;
    let effectiveAmount : Nat = if (scaledAmount == 0) { amount } else { scaledAmount };

    // Revenue-first guard: only reward if platform revenue can cover it
    if (platformRevenue > 0 and platformPayouts + effectiveAmount > platformRevenue) {
      // Reduce proportionally to available headroom
      let headroom : Nat = if (platformRevenue > platformPayouts) {
        platformRevenue - platformPayouts;
      } else { 0 };
      if (headroom == 0) {
        Runtime.trap("Platform revenue insufficient to issue reward");
      };
      // Continue with headroom as effective amount (capped below)
    };

    let newDailyEarned = currentDayEarned + effectiveAmount;
    let cappedAmount : Nat = if (newDailyEarned > dailyCap) {
      if (currentDayEarned >= dailyCap) { 0 } else { dailyCap - currentDayEarned };
    } else {
      effectiveAmount;
    };

    if (cappedAmount == 0) {
      Runtime.trap("Daily earning cap reached");
    };

    // Update earning record
    earningRecords.add(user, {
      existing with
      dailyEarned = currentDayEarned + cappedAmount;
      lastEarnDate = todayNs;
      lastTaskTime = todayNs;
    });

    // Credit the user balance and points
    switch (userProfiles.get(user)) {
      case null {};
      case (?profile) {
        userProfiles.add(user, {
          profile with
          balance = profile.balance + cappedAmount;
          totalPoints = profile.totalPoints + cappedAmount;
          weeklyPoints = profile.weeklyPoints + cappedAmount;
        });
      };
    };

    // Track platform payouts
    platformPayouts += cappedAmount;
  };

  public query ({ caller }) func getSpinHistory(user : Principal) : async ?SpinHistory {
    if (caller != user and not isAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    spinHistories.get(user);
  };

  public shared ({ caller }) func recordSpinResult(result : Text, amountWon : Nat) : async () {
    requireUser(caller);

    let nowNs = Time.now();

    let existing = switch (spinHistories.get(caller)) {
      case (?s) { s };
      case null { { lastSpin = 0; totalSpins = 0; totalWon = 0 } };
    };

    let existingEarning = switch (earningRecords.get(caller)) {
      case (?r) { r };
      case null {
        { dailyEarned = 0; lastEarnDate = 0; lastTaskTime = 0; streakDays = 0; consecutiveLosses = 0; vipTier = null };
      };
    };

    // Anti-loss enforcement: after 3 consecutive losses, next spin MUST be ≥50
    let isLoss = amountWon == 0;
    if (not isLoss and existingEarning.consecutiveLosses >= 3 and amountWon < 50) {
      Runtime.trap("Anti-loss triggered: reward must be ≥50 after 3 losses");
    };

    // Update consecutive loss counter in EarningRecord
    let newConsecutiveLosses : Nat = if (isLoss) {
      existingEarning.consecutiveLosses + 1;
    } else {
      0; // reset on win
    };

    // Always add 5 points for spinning (regardless of win/loss)
    let spinPoints : Nat = 5;

    // Update earning record with consecutive losses and spin points
    earningRecords.add(caller, {
      existingEarning with
      consecutiveLosses = newConsecutiveLosses;
      lastTaskTime = nowNs;
    });

    // Update spin history
    spinHistories.add(caller, {
      lastSpin = nowNs;
      totalSpins = existing.totalSpins + 1;
      totalWon = existing.totalWon + amountWon;
    });

    // Credit spin points regardless of win/loss
    switch (userProfiles.get(caller)) {
      case null {};
      case (?profile) {
        userProfiles.add(caller, {
          profile with
          totalPoints = profile.totalPoints + spinPoints;
          weeklyPoints = profile.weeklyPoints + spinPoints;
        });
      };
    };

    // Credit winnings if any
    if (amountWon > 0) {
      // Check revenue safety
      if (platformRevenue > 0 and platformPayouts + amountWon > platformRevenue) {
        let allowed : Nat = if (platformRevenue > platformPayouts) {
          platformRevenue - platformPayouts;
        } else { 0 };
        if (allowed == 0) { Runtime.trap("Platform revenue insufficient") };
      };

      // Check daily cap before crediting spin winnings
      let todayDay = nowNs / 86_400_000_000_000;
      let currentEarning = switch (earningRecords.get(caller)) {
        case (?r) { r };
        case null { existingEarning };
      };
      let currentDayEarned : Nat = if (currentEarning.lastEarnDate / 86_400_000_000_000 < todayDay) {
        0;
      } else {
        currentEarning.dailyEarned;
      };
      let dailyCap = adminSettings.dailyCapINR;
      let cappedWin : Nat = if (currentDayEarned >= dailyCap) {
        0;
      } else if (currentDayEarned + amountWon > dailyCap) {
        dailyCap - currentDayEarned;
      } else {
        amountWon;
      };

      if (cappedWin > 0) {
        switch (userProfiles.get(caller)) {
          case null {};
          case (?profile) {
            userProfiles.add(caller, {
              profile with
              balance = profile.balance + cappedWin;
              totalPoints = profile.totalPoints + cappedWin;
              weeklyPoints = profile.weeklyPoints + cappedWin;
            });
          };
        };

        // Record spin reward transaction
        let txId = getNextTransactionId();
        transactions.add(txId, {
          id = txId;
          user = caller;
          txType = #spin_reward;
          amount = cappedWin;
          status = #completed;
          paymentMethod = "spin";
          createdAt = nowNs;
          notes = "Spin reward: " # result;
        });

        platformPayouts += cappedWin;

        // Update earning record daily earned
        let updatedEarning = switch (earningRecords.get(caller)) {
          case (?r) { r };
          case null { existingEarning };
        };
        earningRecords.add(caller, {
          updatedEarning with
          dailyEarned = currentDayEarned + cappedWin;
          lastEarnDate = nowNs;
        });

        addNotification(caller, "You won ₹" # cappedWin.toText() # " from the spin wheel!", "spin_reward");
      };
    };
  };

  // ──────────────────────────────────────────────
  // VIP PURCHASES
  // ──────────────────────────────────────────────

  public query ({ caller }) func getVIPPurchases() : async [VIPPurchase] {
    requireAdmin(caller);
    vipPurchases.values().toArray().sort();
  };

  public query ({ caller }) func getMyVIPPurchases() : async [VIPPurchase] {
    requireUser(caller);
    let all = vipPurchases.values().toArray();
    all.filter<VIPPurchase>(func(v) { v.user == caller });
  };

  public shared ({ caller }) func submitVIPPurchase(tier : Text, amount : Nat, currency : Text, paymentMethod : Text, screenshot : Text, userName : Text, userEmail : Text) : async Nat {
    requireUser(caller);
    if (tier == "") { Runtime.trap("VIP tier cannot be empty") };
    if (screenshot == "") { Runtime.trap("Payment screenshot is required") };

    let id = getNextVIPId();
    vipPurchases.add(id, {
      id;
      user = caller;
      tier;
      amount;
      currency;
      paymentMethod;
      screenshot;
      status = #pending;
      submittedAt = Time.now();
      userName;
      userEmail;
    });

    let txId = getNextTransactionId();
    transactions.add(txId, {
      id = txId;
      user = caller;
      txType = #vip_purchase;
      amount;
      status = #pending;
      paymentMethod;
      createdAt = Time.now();
      notes = "VIP " # tier # " purchase request";
    });

    id;
  };

  public shared ({ caller }) func approveVIPPurchase(id : Nat) : async () {
    requireAdmin(caller);
    switch (vipPurchases.get(id)) {
      case null { Runtime.trap("VIP purchase not found") };
      case (?vip) {
        if (vip.status != #pending) { Runtime.trap("VIP purchase is not pending") };
        vipPurchases.add(id, { vip with status = #approved });
        let thirtyDaysNs : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
        let expiryTime : Int = Time.now() + thirtyDaysNs;
        switch (userProfiles.get(vip.user)) {
          case null {};
          case (?profile) {
            userProfiles.add(vip.user, {
              profile with
              vipTier = ?vip.tier;
              vipExpiry = ?expiryTime;
            });
            addNotification(vip.user, "Your VIP " # vip.tier # " membership has been activated! Valid for 30 days.", "vip_approved");
          };
        };
        // Track revenue from VIP purchase
        platformRevenue += vip.amount;
      };
    };
  };

  public shared ({ caller }) func rejectVIPPurchase(id : Nat) : async () {
    requireAdmin(caller);
    switch (vipPurchases.get(id)) {
      case null { Runtime.trap("VIP purchase not found") };
      case (?vip) {
        if (vip.status != #pending) { Runtime.trap("VIP purchase is not pending") };
        vipPurchases.add(id, { vip with status = #rejected });
        addNotification(vip.user, "Your VIP " # vip.tier # " purchase was not approved. Contact support.", "vip_rejected");
      };
    };
  };

  // ──────────────────────────────────────────────
  // NOTIFICATIONS
  // ──────────────────────────────────────────────

  public query ({ caller }) func getNotifications() : async [Notification] {
    requireUser(caller);
    switch (notifications.get(caller)) {
      case null { [] };
      case (?lst) { lst.toArray() };
    };
  };

  public shared ({ caller }) func markNotificationRead(id : Nat) : async () {
    requireUser(caller);
    switch (notifications.get(caller)) {
      case null {};
      case (?lst) {
        lst.mapInPlace(func(n : Notification) : Notification {
          if (n.id == id) { { n with isRead = true } } else { n }
        });
      };
    };
  };

  public shared ({ caller }) func sendAdminNotification(user : Principal, message : Text) : async () {
    requireAdmin(caller);
    if (message == "") { Runtime.trap("Message cannot be empty") };
    addNotification(user, message, "admin_announcement");
  };

  // ──────────────────────────────────────────────
  // ADMIN SETTINGS
  // ──────────────────────────────────────────────

  public query func getAdminSettings() : async AdminSettings {
    adminSettings;
  };

  public shared ({ caller }) func updateAdminSettings(settings : AdminSettings) : async () {
    requireAdmin(caller);
    adminSettings := settings;
  };

  // ──────────────────────────────────────────────
  // PLATFORM REVENUE
  // ──────────────────────────────────────────────

  public query ({ caller }) func getPlatformRevenue() : async { revenue : Nat; payouts : Nat; canWithdraw : Bool } {
    requireAdmin(caller);
    {
      revenue = platformRevenue;
      payouts = platformPayouts;
      canWithdraw = platformRevenue > platformPayouts;
    };
  };

  public shared ({ caller }) func updatePlatformRevenue(amount : Nat) : async () {
    requireAdmin(caller);
    platformRevenue += amount;
  };

  public query ({ caller }) func isWithdrawalAllowed() : async Bool {
    adminSettings.withdrawalEnabled and platformRevenue > platformPayouts;
  };

  // ──────────────────────────────────────────────
  // FRAUD / FREEZE
  // ──────────────────────────────────────────────

  public query ({ caller }) func getFraudLogs() : async [FraudLog] {
    requireAdmin(caller);
    fraudLogs.values().toArray();
  };

  public shared ({ caller }) func recordFraudLog(user : Principal, reason : Text) : async () {
    requireAdmin(caller);
    fraudLogs.add(user, {
      user;
      reason;
      timestamp = Time.now();
      action = "logged";
    });
  };

  public shared ({ caller }) func freezeUser(user : Principal, reason : Text) : async () {
    requireAdmin(caller);
    switch (userProfiles.get(user)) {
      case null { Runtime.trap("User not found") };
      case (?profile) {
        let frozenReason = if (reason == "") { "Flagged by admin" } else { reason };
        userProfiles.add(user, {
          profile with
          isFrozen = true;
          frozenReason = ?frozenReason;
        });
        fraudLogs.add(user, {
          user;
          reason = frozenReason;
          timestamp = Time.now();
          action = "frozen";
        });
        addNotification(user, "Your account has been temporarily frozen due to unusual activity. Contact support.", "account_frozen");
      };
    };
  };

  public shared ({ caller }) func unfreezeUser(user : Principal) : async () {
    requireAdmin(caller);
    switch (userProfiles.get(user)) {
      case null { Runtime.trap("User not found") };
      case (?profile) {
        userProfiles.add(user, { profile with isFrozen = false; frozenReason = null });
        addNotification(user, "Your account has been restored successfully. Welcome back!", "account_restored");
      };
    };
  };

  public query ({ caller }) func isUserFrozen(user : Principal) : async Bool {
    switch (userProfiles.get(user)) {
      case null { false };
      case (?profile) { profile.isFrozen };
    };
  };

  // ──────────────────────────────────────────────
  // LEADERBOARD
  // ──────────────────────────────────────────────

  public query func getLeaderboard() : async [LeaderboardEntry] {
    let entries = List.empty<LeaderboardEntry>();
    for ((_, profile) in userProfiles.entries()) {
      entries.add({
        user = profile.user;
        username = profile.username;
        weeklyPoints = profile.weeklyPoints;
        vipTier = profile.vipTier;
      });
    };
    // Sort descending by weeklyPoints, take top 50
    let sorted = entries.toArray().sort();
    if (sorted.size() <= 50) { sorted } else {
      sorted.sliceToArray(0, 50);
    };
  };

};
