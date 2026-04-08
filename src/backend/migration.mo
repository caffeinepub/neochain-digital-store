import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";

module {

  // ── Old types (from the previously deployed version) ──

  type OldUserRole = {
    #admin;
    #user;
    #guest;
  };

  type OldAccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, OldUserRole>;
  };

  type OldTransactionType = {
    #deposit;
    #withdrawal;
    #purchase;
    #referral_bonus;
  };

  type OldTransactionStatus = {
    #pending;
    #approved;
    #rejected;
    #completed;
  };

  type OldTransaction = {
    id : Nat;
    user : Principal;
    txType : OldTransactionType;
    amount : Nat;
    status : OldTransactionStatus;
    paymentMethod : Text;
    createdAt : Time.Time;
    notes : Text;
  };

  type OldUserProfile = {
    user : Principal;
    username : Text;
    balance : Nat;
    referralCode : Text;
    referredBy : ?Principal;
    referralEarnings : Nat;
  };

  type OldTicketStatus = { #open; #resolved };

  type OldSupportTicket = {
    ticketId : Nat;
    userId : ?Principal;
    guestName : Text;
    guestEmail : Text;
    problemSummary : Text;
    status : OldTicketStatus;
    createdAt : Time.Time;
    adminReply : Text;
    adminRepliedAt : ?Time.Time;
  };

  // ── New types (matching current main.mo) ──

  type NewUserRole = {
    #admin;
    #user;
  };

  type NewTransactionType = {
    #deposit;
    #withdrawal;
    #purchase;
    #referral_bonus;
    #task_reward;
    #spin_reward;
    #login_bonus;
    #vip_purchase;
  };

  type NewTransactionStatus = {
    #pending;
    #approved;
    #rejected;
    #completed;
  };

  type NewTransaction = {
    id : Nat;
    user : Principal;
    txType : NewTransactionType;
    amount : Nat;
    status : NewTransactionStatus;
    paymentMethod : Text;
    createdAt : Time.Time;
    notes : Text;
  };

  type NewUserProfile = {
    user : Principal;
    username : Text;
    balance : Nat;
    referralCode : Text;
    referredBy : ?Principal;
    referralEarnings : Nat;
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

  type NewSupportTicket = {
    ticketId : Nat;
    userId : ?Principal;
    guestName : Text;
    guestEmail : Text;
    problemSummary : Text;
    status : OldTicketStatus;
    createdAt : Time.Time;
    adminReply : Text;
    adminRepliedAt : ?Time.Time;
  };

  // ── OldActor: stable fields from the previously deployed version ──

  type OldActor = {
    accessControlState : OldAccessControlState;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    transactions : Map.Map<Nat, OldTransaction>;
    referralCodes : Map.Map<Text, Principal>;
    paymentMethods : Map.Map<Text, { name : Text; description : Text }>;
    supportTickets : Map.Map<Nat, OldSupportTicket>;
    var stableUserProfiles : [(Principal, OldUserProfile)];
    var stableTransactions : [(Nat, OldTransaction)];
    var stableReferralCodes : [(Text, Principal)];
    var stablePaymentMethods : [(Text, { name : Text; description : Text })];
    var stableNextTransactionId : Nat;
    var stableAdminAssigned : Bool;
    var stableUserRoles : [(Principal, OldUserRole)];
    var nextProductId : ?Nat;
    var stableSupportTickets : [(Nat, OldSupportTicket)];
    var stableNextTicketId : Nat;
    var nextTransactionId : Nat;
    var nextTicketId : Nat;
  };

  // ── NewActor: stable fields for the new version ──

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
    transactions : Map.Map<Nat, NewTransaction>;
    referralCodes : Map.Map<Text, Principal>;
    paymentMethods : Map.Map<Text, { name : Text; description : Text }>;
    supportTickets : Map.Map<Nat, NewSupportTicket>;
    var stableUserProfiles : [(Principal, NewUserProfile)];
    var stableTransactions : [(Nat, NewTransaction)];
    var stableReferralCodes : [(Text, Principal)];
    var stablePaymentMethods : [(Text, { name : Text; description : Text })];
    var stableNextTransactionId : Nat;
    var stableAdminAssigned : Bool;
    var stableUserRoles : [(Principal, NewUserRole)];
    var stableSupportTickets : [(Nat, NewSupportTicket)];
    var stableNextTicketId : Nat;
    var nextTransactionId : Nat;
    var nextTicketId : Nat;
  };

  func migrateUserProfile(old : OldUserProfile) : NewUserProfile {
    {
      old with
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
  };

  func migrateTransactionType(old : OldTransactionType) : NewTransactionType {
    switch old {
      case (#deposit) { #deposit };
      case (#withdrawal) { #withdrawal };
      case (#purchase) { #purchase };
      case (#referral_bonus) { #referral_bonus };
    };
  };

  func migrateTransactionStatus(old : OldTransactionStatus) : NewTransactionStatus {
    switch old {
      case (#pending) { #pending };
      case (#approved) { #approved };
      case (#rejected) { #rejected };
      case (#completed) { #completed };
    };
  };

  func migrateTransaction(old : OldTransaction) : NewTransaction {
    {
      old with
      txType = migrateTransactionType(old.txType);
      status = migrateTransactionStatus(old.status);
    };
  };

  func migrateUserRole(old : OldUserRole) : NewUserRole {
    switch old {
      case (#admin) { #admin };
      case (#user) { #user };
      case (#guest) { #user }; // guests become regular users
    };
  };

  public func run(old : OldActor) : NewActor {
    // Migrate userProfiles Map
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_, p) { migrateUserProfile(p) }
    );

    // Migrate transactions Map
    let newTransactions = old.transactions.map<Nat, OldTransaction, NewTransaction>(
      func(_, t) { migrateTransaction(t) }
    );

    // Migrate stableUserProfiles array
    let newStableUserProfiles = old.stableUserProfiles.map(
      func((_, p)) { migrateUserProfile(p) }
    );

    // Migrate stableTransactions array
    let newStableTransactions = old.stableTransactions.map(
      func((id, t)) { migrateTransaction(t) }
    );

    // Migrate stableUserRoles array (drop #guest → #user, extract admin info)
    let newStableUserRoles = old.stableUserRoles.map(
      func((p, r)) { (p, migrateUserRole(r)) }
    );

    // Extract adminAssigned from old accessControlState
    let newAdminAssigned = old.accessControlState.adminAssigned;

    {
      userProfiles = newUserProfiles;
      transactions = newTransactions;
      referralCodes = old.referralCodes;
      paymentMethods = old.paymentMethods;
      supportTickets = old.supportTickets;
      var stableUserProfiles = Array.tabulate<(Principal, NewUserProfile)>(
        newStableUserProfiles.size(),
        func(i) {
          let (p, _) = old.stableUserProfiles[i];
          (p, newStableUserProfiles[i]);
        }
      );
      var stableTransactions = Array.tabulate<(Nat, NewTransaction)>(
        newStableTransactions.size(),
        func(i) {
          let (id, _) = old.stableTransactions[i];
          (id, newStableTransactions[i]);
        }
      );
      var stableReferralCodes = old.stableReferralCodes;
      var stablePaymentMethods = old.stablePaymentMethods;
      var stableNextTransactionId = old.stableNextTransactionId;
      var stableAdminAssigned = newAdminAssigned;
      var stableUserRoles = newStableUserRoles;
      var stableSupportTickets = old.stableSupportTickets;
      var stableNextTicketId = old.stableNextTicketId;
      var nextTransactionId = old.nextTransactionId;
      var nextTicketId = old.nextTicketId;
    };
  };
};
