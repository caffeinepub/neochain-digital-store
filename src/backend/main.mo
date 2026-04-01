import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // MODULES

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

  module ReferralCode {
    public func compare(rc1 : ReferralCode, rc2 : ReferralCode) : Order.Order {
      Text.compare(rc1.code, rc2.code);
    };
  };

  module PaymentMethod {
    public func compare(pm1 : PaymentMethod, pm2 : PaymentMethod) : Order.Order {
      Text.compare(pm1.name, pm2.name);
    };
  };

  module UserProfile {
    public func compare(u1 : UserProfile, u2 : UserProfile) : Order.Order {
      Principal.compare(u1.user, u2.user);
    };
  };

  module SupportTicket {
    public func compare(t1 : SupportTicket, t2 : SupportTicket) : Order.Order {
      Nat.compare(t1.ticketId, t2.ticketId);
    };
  };

  // TYPES

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

  public type ReferralCode = {
    code : Text;
    owner : Principal;
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

  // FIELDS

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let productPlans = Map.empty<Nat, ProductPlan>();
  let transactions = Map.empty<Nat, Transaction>();
  let referralCodes = Map.empty<Text, Principal>();
  let paymentMethods = Map.empty<Text, PaymentMethod>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userReferralEarnings = Map.empty<Principal, Nat>();
  let supportTickets = Map.empty<Nat, SupportTicket>();
  var nextTransactionId = 1;
  var nextTicketId = 1;

  // STABLE FIELDS

  stable var stableUserProfiles : [(Principal, UserProfile)] = [];
  stable var stableTransactions : [(Nat, Transaction)] = [];
  stable var stableReferralCodes : [(Text, Principal)] = [];
  stable var stablePaymentMethods : [(Text, PaymentMethod)] = [];
  stable var stableNextTransactionId : Nat = 1;
  stable var stableAdminAssigned : Bool = false;
  stable var stableUserRoles : [(Principal, AccessControl.UserRole)] = [];
  stable var nextProductId : ?Nat = null;
  stable var stableSupportTickets : [(Nat, SupportTicket)] = [];
  stable var stableNextTicketId : Nat = 1;

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

  func generateReferralCode(user : Principal) : Text {
    let userText = user.toText();
    let len = userText.size();
    if (len >= 8) {
      Text.fromIter(userText.toIter().take(8));
    } else {
      userText # Text.fromArray(Array.repeat<Char>('0', 8 - len));
    };
  };

  func seedProductPlans() {
    if (productPlans.size() > 0) return;
    productPlans.add(
      1,
      {
        id = 1;
        name = "Starter Pack";
        price = 1500;
        features = ["20% Referral Commission", "Instant Activation", "One-time Purchase", "Fast Approval"];
        description = "Start your earning journey with a simple, beginner-friendly digital product. One-time purchase with fast approval.";
      },
    );
    productPlans.add(
      2,
      {
        id = 2;
        name = "Growth Pack";
        price = 3000;
        features = ["20% Referral Commission", "Instant Activation", "One-time Purchase", "Fast Approval"];
        description = "Accelerate your income with higher referral returns. Secure system, instant activation after approval.";
      },
    );
    productPlans.add(
      3,
      {
        id = 3;
        name = "Pro Pack";
        price = 5000;
        features = ["17% Referral Commission", "Instant Activation", "One-time Purchase", "Priority Approval"];
        description = "Maximize your earning potential with premium referral benefits. Trusted by thousands of active earners.";
      },
    );
    productPlans.add(
      4,
      {
        id = 4;
        name = "Elite Pack";
        price = 8000;
        features = ["15% Referral Commission", "Instant Activation", "One-time Purchase", "VIP Support"];
        description = "Top-tier plan for serious earners. Maximum commissions, priority approval, long-term earning potential.";
      },
    );
  };

  // ──────────────────────────────────────────────
  // UPGRADE HOOKS
  // ──────────────────────────────────────────────

  // Called BEFORE upgrade — snapshot all in-memory data to stable vars
  system func preupgrade() {
    stableUserProfiles := userProfiles.entries().toArray();
    stableTransactions := transactions.entries().toArray();
    stableReferralCodes := referralCodes.entries().toArray();
    stablePaymentMethods := paymentMethods.entries().toArray();
    stableNextTransactionId := nextTransactionId;
    stableAdminAssigned := accessControlState.adminAssigned;
    stableUserRoles := accessControlState.userRoles.entries().toArray();
    stableSupportTickets := supportTickets.entries().toArray();
    stableNextTicketId := nextTicketId;
  };

  // Called AFTER upgrade — restore all data from stable vars
  system func postupgrade() {
    for ((k, v) in stableUserProfiles.vals()) { userProfiles.add(k, v) };
    for ((k, v) in stableTransactions.vals()) { transactions.add(k, v) };
    for ((k, v) in stableReferralCodes.vals()) { referralCodes.add(k, v) };
    for ((k, v) in stablePaymentMethods.vals()) { paymentMethods.add(k, v) };
    nextTransactionId := stableNextTransactionId;
    accessControlState.adminAssigned := stableAdminAssigned;
    for ((k, v) in stableUserRoles.vals()) {
      accessControlState.userRoles.add(k, v);
    };
    for ((k, v) in stableSupportTickets.vals()) { supportTickets.add(k, v) };
    nextTicketId := stableNextTicketId;
    seedProductPlans();
  };

  // Seed plans on first install (postupgrade doesn't run on fresh install)
  ignore do { seedProductPlans() };

  // ──────────────────────────────────────────────
  // PUBLIC FUNCTIONS
  // ──────────────────────────────────────────────

  public shared ({ caller }) func registerUser(username : Text, referralCode : ?Text) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register");
    };

    if (username == "") {
      Runtime.trap("Username cannot be empty");
    };
    if (username.size() > 30) {
      Runtime.trap("Username cannot exceed 30 characters");
    };
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User already registered");
    };

    var referredBy : ?Principal = null;
    switch (referralCode) {
      case (null) {};
      case (?code) {
        if (code == "") {
          Runtime.trap("Referral code cannot be empty");
        };
        if (code.size() != 8) {
          Runtime.trap("Referral code must be exactly 8 characters");
        };
        switch (referralCodes.get(code)) {
          case (null) {
            Runtime.trap("Referral code does not exist");
          };
          case (?owner) {
            if (owner == caller) {
              Runtime.trap("Cannot use your own referral code");
            };
            referredBy := ?owner;
          };
        };
      };
    };

    let newReferralCode = generateReferralCode(caller);
    referralCodes.add(newReferralCode, caller);

    let userProfile : UserProfile = {
      user = caller;
      username;
      balance = 0;
      referralCode = newReferralCode;
      referredBy;
      referralEarnings = 0;
    };
    userProfiles.add(caller, userProfile);
    userReferralEarnings.add(caller, 0);
    userProfile;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (profile.user != caller) {
      Runtime.trap("Cannot save profile for another user");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getUserBalance(address : Principal) : async Nat {
    if (caller != address and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance");
    };
    switch (userProfiles.get(address)) {
      case (null) { 0 };
      case (?profile) { profile.balance };
    };
  };

  public shared ({ caller }) func createDepositRequest(amount : Nat, paymentMethod : Text, extraNotes : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create deposit requests");
    };

    if (amount == 0) {
      Runtime.trap("Deposit amount must be greater than zero");
    };
    if (paymentMethod == "") {
      Runtime.trap("Payment method cannot be empty");
    };

    // Auto-create profile if user doesn't have one (prevents silent failure)
    if (not userProfiles.containsKey(caller)) {
      let autoCode = generateReferralCode(caller);
      if (not referralCodes.containsKey(autoCode)) {
        referralCodes.add(autoCode, caller);
      };
      userProfiles.add(
        caller,
        {
          user = caller;
          username = "User";
          balance = 0;
          referralCode = autoCode;
          referredBy = null;
          referralEarnings = 0;
        },
      );
      userReferralEarnings.add(caller, 0);
    };

    let transactionId = getNextTransactionId();
    let notes = if (extraNotes == "") { "Deposit request created" } else { extraNotes };
    transactions.add(
      transactionId,
      {
        id = transactionId;
        user = caller;
        txType = #deposit;
        amount;
        status = #pending;
        paymentMethod;
        createdAt = Time.now();
        notes;
      },
    );
    transactionId;
  };

  public shared ({ caller }) func requestWithdrawal(amount : Nat, paymentMethod : Text, extraNotes : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };

    if (amount == 0) {
      Runtime.trap("Withdrawal amount must be greater than zero");
    };
    if (paymentMethod == "") {
      Runtime.trap("Payment method cannot be empty");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found. Please register first.") };
      case (?profile) {
        if (profile.balance < amount) {
          Runtime.trap("Insufficient balance");
        };

        let updatedProfile = {
          user = profile.user;
          username = profile.username;
          balance = profile.balance - amount;
          referralCode = profile.referralCode;
          referredBy = profile.referredBy;
          referralEarnings = profile.referralEarnings;
        };
        userProfiles.add(caller, updatedProfile);

        let transactionId = getNextTransactionId();
        let notes = if (extraNotes == "") { "Withdrawal request created" } else { extraNotes };
        transactions.add(
          transactionId,
          {
            id = transactionId;
            user = caller;
            txType = #withdrawal;
            amount;
            status = #pending;
            paymentMethod;
            createdAt = Time.now();
            notes;
          },
        );
        transactionId;
      };
    };
  };

  public shared ({ caller }) func processPurchase(productId : Nat, referralCode : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can make purchases");
    };

    let product = switch (productPlans.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        if (profile.balance < product.price) {
          Runtime.trap("Insufficient balance to purchase product");
        };

        let updatedProfile = {
          user = profile.user;
          username = profile.username;
          balance = profile.balance - product.price;
          referralCode = profile.referralCode;
          referredBy = profile.referredBy;
          referralEarnings = profile.referralEarnings;
        };
        userProfiles.add(caller, updatedProfile);

        let transactionId = getNextTransactionId();
        let notes = "Product purchase: " # product.name;
        transactions.add(
          transactionId,
          {
            id = transactionId;
            user = caller;
            txType = #purchase;
            amount = product.price;
            status = #completed;
            paymentMethod = "balance";
            createdAt = Time.now();
            notes;
          },
        );

        switch (profile.referredBy) {
          case (null) {};
          case (?referrer) {
            let bonusAmount = product.price / 10;
            switch (userProfiles.get(referrer)) {
              case (null) {};
              case (?referrerProfile) {
                let updatedReferrerProfile = {
                  user = referrerProfile.user;
                  username = referrerProfile.username;
                  balance = referrerProfile.balance + bonusAmount;
                  referralCode = referrerProfile.referralCode;
                  referredBy = referrerProfile.referredBy;
                  referralEarnings = referrerProfile.referralEarnings + bonusAmount;
                };
                userProfiles.add(referrer, updatedReferrerProfile);

                let bonusTransactionId = getNextTransactionId();
                transactions.add(
                  bonusTransactionId,
                  {
                    id = bonusTransactionId;
                    user = referrer;
                    txType = #referral_bonus;
                    amount = bonusAmount;
                    status = #completed;
                    paymentMethod = "referral";
                    createdAt = Time.now();
                    notes = "Referral bonus from " # profile.username;
                  },
                );
              };
            };
          };
        };

        transactionId;
      };
    };
  };

  public query ({ caller }) func getAllProductPlans() : async [ProductPlan] {
    productPlans.values().toArray().sort();
  };

  public shared ({ caller }) func addPaymentMethod(newPaymentMethod : PaymentMethod) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add payment methods");
    };

    let name = newPaymentMethod.name;
    let description = newPaymentMethod.description;
    if (name == "") {
      Runtime.trap("Payment method name cannot be empty");
    };
    if (description == "") {
      Runtime.trap("Payment method description cannot be empty");
    };
    paymentMethods.add(name, { name; description });
  };

  public shared ({ caller }) func removePaymentMethod(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove payment methods");
    };

    if (not paymentMethods.containsKey(name)) {
      Runtime.trap("Payment method not found");
    };
    paymentMethods.remove(name);
  };

  public query ({ caller }) func getAllPaymentMethods() : async [PaymentMethod] {
    paymentMethods.values().toArray().sort();
  };

  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.values().toArray().sort();
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };
    transactions.values().toArray().sort();
  };

  public shared ({ caller }) func approveTransaction(transactionId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve transactions");
    };

    switch (transactions.get(transactionId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?tx) {
        if (tx.status != #pending) {
          Runtime.trap("Transaction is not pending");
        };

        let updatedTx = {
          id = tx.id;
          user = tx.user;
          txType = tx.txType;
          amount = tx.amount;
          status = #approved;
          paymentMethod = tx.paymentMethod;
          createdAt = tx.createdAt;
          notes = tx.notes # " (approved)";
        };
        transactions.add(transactionId, updatedTx);

        if (tx.txType == #deposit) {
          switch (userProfiles.get(tx.user)) {
            case (null) {};
            case (?profile) {
              let updatedProfile = {
                user = profile.user;
                username = profile.username;
                balance = profile.balance + tx.amount;
                referralCode = profile.referralCode;
                referredBy = profile.referredBy;
                referralEarnings = profile.referralEarnings;
              };
              userProfiles.add(tx.user, updatedProfile);
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func rejectTransaction(transactionId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject transactions");
    };

    switch (transactions.get(transactionId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?tx) {
        if (tx.status != #pending) {
          Runtime.trap("Transaction is not pending");
        };

        let updatedTx = {
          id = tx.id;
          user = tx.user;
          txType = tx.txType;
          amount = tx.amount;
          status = #rejected;
          paymentMethod = tx.paymentMethod;
          createdAt = tx.createdAt;
          notes = tx.notes # " (rejected)";
        };
        transactions.add(transactionId, updatedTx);

        if (tx.txType == #withdrawal) {
          switch (userProfiles.get(tx.user)) {
            case (null) {};
            case (?profile) {
              let updatedProfile = {
                user = profile.user;
                username = profile.username;
                balance = profile.balance + tx.amount;
                referralCode = profile.referralCode;
                referredBy = profile.referredBy;
                referralEarnings = profile.referralEarnings;
              };
              userProfiles.add(tx.user, updatedProfile);
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateUserBalance(user : Principal, newBalance : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update user balances");
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile = {
          user = profile.user;
          username = profile.username;
          balance = newBalance;
          referralCode = profile.referralCode;
          referredBy = profile.referredBy;
          referralEarnings = profile.referralEarnings;
        };
        userProfiles.add(user, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func updateUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func getPlatformStats() : async {
    totalUsers : Nat;
    totalTransactions : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view platform stats");
    };
    {
      totalUsers = userProfiles.size();
      totalTransactions = transactions.size();
    };
  };

  // ──────────────────────────────────────────────
  // SUPPORT TICKET FUNCTIONS
  // ──────────────────────────────────────────────

  // Create a support ticket - open to all (guests and users)
  public shared ({ caller }) func createSupportTicket(guestName : Text, guestEmail : Text, problemSummary : Text) : async Nat {
    if (problemSummary == "") {
      Runtime.trap("Problem summary cannot be empty");
    };

    let isAnonymous = caller.isAnonymous();
    let userId : ?Principal = if (isAnonymous) { null } else { ?caller };

    let ticketId = getNextTicketId();
    supportTickets.add(
      ticketId,
      {
        ticketId;
        userId;
        guestName;
        guestEmail;
        problemSummary;
        status = #open;
        createdAt = Time.now();
        adminReply = "";
        adminRepliedAt = null;
      },
    );
    ticketId;
  };

  // Get tickets for the logged-in user
  public query ({ caller }) func getMyTickets() : async [SupportTicket] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tickets");
    };
    let all = supportTickets.values().toArray();
    all.filter<SupportTicket>(
      func(t) {
        switch (t.userId) {
          case (null) { false };
          case (?uid) { uid == caller };
        };
      }
    );
  };

  // Get all support tickets - admin only
  public query ({ caller }) func getAllSupportTickets() : async [SupportTicket] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all support tickets");
    };
    supportTickets.values().toArray().sort();
  };

  // Admin reply to a ticket
  public shared ({ caller }) func replyToTicket(ticketId : Nat, reply : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reply to tickets");
    };

    switch (supportTickets.get(ticketId)) {
      case (null) { Runtime.trap("Ticket not found") };
      case (?ticket) {
        let updatedTicket = {
          ticketId = ticket.ticketId;
          userId = ticket.userId;
          guestName = ticket.guestName;
          guestEmail = ticket.guestEmail;
          problemSummary = ticket.problemSummary;
          status = ticket.status;
          createdAt = ticket.createdAt;
          adminReply = reply;
          adminRepliedAt = ?Time.now();
        };
        supportTickets.add(ticketId, updatedTicket);
      };
    };
  };

  // Admin resolve a ticket
  public shared ({ caller }) func resolveTicket(ticketId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can resolve tickets");
    };

    switch (supportTickets.get(ticketId)) {
      case (null) { Runtime.trap("Ticket not found") };
      case (?ticket) {
        let updatedTicket = {
          ticketId = ticket.ticketId;
          userId = ticket.userId;
          guestName = ticket.guestName;
          guestEmail = ticket.guestEmail;
          problemSummary = ticket.problemSummary;
          status = #resolved;
          createdAt = ticket.createdAt;
          adminReply = ticket.adminReply;
          adminRepliedAt = ticket.adminRepliedAt;
        };
        supportTickets.add(ticketId, updatedTicket);
      };
    };
  };
};
