import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";

module {
  // TYPE ALIASES TO SIMPLIFY MIGRATION
  type TransactionType = {
    #deposit;
    #withdrawal;
    #purchase;
    #referral_bonus;
  };

  type TransactionStatus = {
    #pending;
    #approved;
    #rejected;
    #completed;
  };

  type Transaction = {
    id : Nat;
    user : Principal.Principal;
    txType : TransactionType;
    amount : Nat;
    status : TransactionStatus;
    paymentMethod : Text;
    createdAt : Time.Time;
    notes : Text;
  };

  type ReferralCode = {
    code : Text;
    owner : Principal.Principal;
  };

  type PaymentMethod = {
    name : Text;
    description : Text;
  };

  type UserProfile = {
    user : Principal.Principal;
    username : Text;
    balance : Nat;
    referralCode : Text;
    referredBy : ?Principal.Principal;
    referralEarnings : Nat;
  };

  // NEW SUPPORT TICKET TYPE
  type TicketStatus = {
    #open;
    #resolved;
  };

  type SupportTicket = {
    ticketId : Nat;
    userId : ?Principal.Principal;
    guestName : Text;
    guestEmail : Text;
    problemSummary : Text;
    status : TicketStatus;
    createdAt : Time.Time;
    adminReply : Text;
    adminRepliedAt : ?Time.Time;
  };

  type OldActor = {
    accessControlState : {
      var adminAssigned : Bool;
      userRoles : Map.Map<Principal, AccessControl.UserRole>;
    };
    productPlans : Map.Map<Nat, {
      id : Nat;
      name : Text;
      price : Nat;
      features : [Text];
      description : Text;
    }>;
    transactions : Map.Map<Nat, Transaction>;
    referralCodes : Map.Map<Text, Principal.Principal>;
    paymentMethods : Map.Map<Text, PaymentMethod>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    userReferralEarnings : Map.Map<Principal.Principal, Nat>;
    nextTransactionId : Nat;
    nextProductId : ?Nat;
    _initPlans : ();
  };

  type NewActor = {
    accessControlState : {
      var adminAssigned : Bool;
      userRoles : Map.Map<Principal, AccessControl.UserRole>;
    };
    productPlans : Map.Map<Nat, {
      id : Nat;
      name : Text;
      price : Nat;
      features : [Text];
      description : Text;
    }>;
    transactions : Map.Map<Nat, Transaction>;
    referralCodes : Map.Map<Text, Principal.Principal>;
    paymentMethods : Map.Map<Text, PaymentMethod>;
    userProfiles : Map.Map<Principal.Principal, UserProfile>;
    userReferralEarnings : Map.Map<Principal.Principal, Nat>;
    nextTransactionId : Nat;
    nextProductId : ?Nat;
    supportTickets : Map.Map<Nat, SupportTicket>;
    nextTicketId : Nat;
  };

  // UPGRADE LOGIC - MIGRATION STEP
  public func run(old : OldActor) : NewActor {
    {
      old with
      supportTickets = Map.empty<Nat, SupportTicket>();
      nextTicketId = 1;
    };
  };
};
