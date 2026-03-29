import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
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

  // STATE

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Product plans (seeded)
  let productPlans = Map.empty<Nat, ProductPlan>();
  let nextProductId = Nat.fromText("5");

  // Transactions
  let transactions = Map.empty<Nat, Transaction>();
  var nextTransactionId = 1;

  // Referral codes (simple 8-char code -> owner principal)
  let referralCodes = Map.empty<Text, Principal>();

  // Payment methods
  let paymentMethods = Map.empty<Text, PaymentMethod>();

  // User profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User referral earnings
  let userReferralEarnings = Map.empty<Principal, Nat>();

  // Helper function to get next transaction id and increment
  func getNextTransactionId() : Nat {
    let id = nextTransactionId;
    nextTransactionId += 1;
    id;
  };

  // Helper function to generate referral code
  func generateReferralCode(user : Principal) : Text {
    let userText = user.toText();
    let len = userText.size();
    if (len >= 8) {
      Text.fromIter(userText.toIter().take(8));
    } else {
      userText # Text.fromArray(Array.repeat<Char>('0', 8 - len));
    };
  };

  // INITIALIZATION

  system func preupgrade() {
    // Seed product plans
    productPlans.add(
      1, {
        id = 1;
        name = "Basic";
        price = 29;
        features = ["Core marketplace", "1 storefront", "Email support"];
        description = "Best for individuals";
      },
    );
    productPlans.add(
      2, {
        id = 2;
        name = "Standard";
        price = 79;
        features = ["Custom branding", "5 stores", "Payout tools"];
        description = "Best for small businesses";
      },
    );
    productPlans.add(
      3, {
        id = 3;
        name = "Premium";
        price = 149;
        features = ["Premium support", "Advanced reports"];
        description = "Best for growing businesses";
      },
    );
    productPlans.add(
      4, {
        id = 4;
        name = "Enterprise";
        price = 299;
        features = ["Custom solutions", "Dedicated manager"];
        description = "Custom for large orgs";
      },
    );
  };

  // PUBLIC FUNCTIONS

  // User registration - requires user role
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
      case (null) { };
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

  // Get caller's user profile - requires user role
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  // Save caller's user profile - requires user role
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (profile.user != caller) {
      Runtime.trap("Cannot save profile for another user");
    };
    userProfiles.add(caller, profile);
  };

  // Get user profile - caller must be the user or admin
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Get user balance - caller must be the user or admin
  public query ({ caller }) func getUserBalance(address : Principal) : async Nat {
    if (caller != address and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance");
    };
    switch (userProfiles.get(address)) {
      case (null) { 0 };
      case (?profile) { profile.balance };
    };
  };

  // Create deposit request - requires user role
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

    let transactionId = getNextTransactionId();
    let notes = if (extraNotes == "") "Deposit request created" else extraNotes;
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

  // Request withdrawal - requires user role
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
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        if (profile.balance < amount) { 
          Runtime.trap("Insufficient balance") 
        };
        
        // Deduct balance immediately on withdrawal request
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
        let notes = if (extraNotes == "") "Withdrawal request created" else extraNotes;
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

  // Process purchase - requires user role
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

        // Deduct balance
        let updatedProfile = {
          user = profile.user;
          username = profile.username;
          balance = profile.balance - product.price;
          referralCode = profile.referralCode;
          referredBy = profile.referredBy;
          referralEarnings = profile.referralEarnings;
        };
        userProfiles.add(caller, updatedProfile);

        // Create purchase transaction
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

        // Process referral bonus (10% to referrer)
        switch (profile.referredBy) {
          case (null) { };
          case (?referrer) {
            let bonusAmount = product.price / 10; // 10% bonus
            switch (userProfiles.get(referrer)) {
              case (null) { };
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

                // Create referral bonus transaction
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

  // Get all product plans - public access
  public query ({ caller }) func getAllProductPlans() : async [ProductPlan] {
    productPlans.values().toArray().sort();
  };

  // Add payment method - admin only
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
    if (paymentMethods.containsKey(name)) {
      Runtime.trap("Payment method already exists");
    };
    paymentMethods.add(
      name,
      {
        name;
        description;
      },
    );
  };

  // Remove payment method - admin only
  public shared ({ caller }) func removePaymentMethod(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove payment methods");
    };

    if (not paymentMethods.containsKey(name)) {
      Runtime.trap("Payment method not found");
    };
    paymentMethods.remove(name);
  };

  // Get all payment methods - public access
  public query ({ caller }) func getAllPaymentMethods() : async [PaymentMethod] {
    paymentMethods.values().toArray().sort();
  };

  // Get all users - admin only
  public query ({ caller }) func getAllUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.values().toArray().sort();
  };

  // Get all transactions - admin only
  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };
    transactions.values().toArray().sort();
  };

  // Approve transaction - admin only
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

        // Update transaction status
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

        // For deposits, update user balance
        if (tx.txType == #deposit) {
          switch (userProfiles.get(tx.user)) {
            case (null) { };
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

  // Reject transaction - admin only
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

        // Update transaction status
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

        // For withdrawals, refund the balance
        if (tx.txType == #withdrawal) {
          switch (userProfiles.get(tx.user)) {
            case (null) { };
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

  // Update user balance - admin only
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

  // Update user role - admin only (uses AccessControl.assignRole which has built-in admin guard)
  public shared ({ caller }) func updateUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  // Get platform stats - admin only
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
};
