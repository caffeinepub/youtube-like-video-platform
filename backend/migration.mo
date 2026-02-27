import Map "mo:core/Map";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    userProfiles : Map.Map<Principal, {
      name : Text;
      channelDescription : Text;
      avatar : ?[Nat8];
      handle : Text;
    }>;
    videos : Map.Map<Text, {
      id : Text;
      title : Text;
      description : Text;
      uploadDate : Time.Time;
      duration : Nat;
      viewCount : Nat;
      uploader : Principal;
      videoFile : Storage.ExternalBlob;
      isShort : Bool;
    }>;
    comments : Map.Map<Text, List.List<{
      id : Text;
      videoId : Text;
      author : Principal;
      content : Text;
      timestamp : Time.Time;
    }>>;
    subscribers : Map.Map<Principal, List.List<Principal>>;
    apiKeys : Map.Map<Text, {
      key : Text;
      owner : Principal;
      apiLabel : Text;
      createdAt : Time.Time;
      active : Bool;
    }>;
    playlists : Map.Map<Text, {
      id : Text;
      title : Text;
      description : Text;
      owner : Principal;
      videos : List.List<Text>;
      createdAt : Time.Time;
    }>;
    communityPosts : Map.Map<Text, {
      id : Text;
      author : Principal;
      body : Text;
      attachment : ?Storage.ExternalBlob;
      timestamp : Time.Time;
    }>;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, {
      name : Text;
      channelDescription : Text;
      avatar : ?[Nat8];
      handle : Text;
    }>;
    videos : Map.Map<Text, {
      id : Text;
      title : Text;
      description : Text;
      uploadDate : Time.Time;
      duration : Nat;
      viewCount : Nat;
      uploader : Principal;
      videoFile : Storage.ExternalBlob;
      isShort : Bool;
    }>;
    comments : Map.Map<Text, List.List<{
      id : Text;
      videoId : Text;
      author : Principal;
      content : Text;
      timestamp : Time.Time;
    }>>;
    subscribers : Map.Map<Principal, List.List<Principal>>;
    apiKeys : Map.Map<Text, {
      key : Text;
      owner : Principal;
      apiLabel : Text;
      createdAt : Time.Time;
      active : Bool;
    }>;
    playlists : Map.Map<Text, {
      id : Text;
      title : Text;
      description : Text;
      owner : Principal;
      videos : List.List<Text>;
      createdAt : Time.Time;
    }>;
    communityPosts : Map.Map<Text, {
      id : Text;
      author : Principal;
      body : Text;
      attachment : ?Storage.ExternalBlob;
      timestamp : Time.Time;
    }>;
    creatorBankBalance : Nat;
    withdrawalRequests : [{
      amountCents : Nat;
      timestamp : Time.Time;
      status : { #pending; #approved; #cancelled };
    }];
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      creatorBankBalance = 0; // Initialize new field
      withdrawalRequests = []; // Initialize new field
    };
  };
};
