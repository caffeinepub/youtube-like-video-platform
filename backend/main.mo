import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Time "mo:core/Time";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    channelDescription : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Video Data Types
  type VideoMetadata = {
    id : Text;
    title : Text;
    description : Text;
    uploadDate : Time.Time;
    duration : Nat;
    viewCount : Nat;
    uploader : Principal;
    videoFile : Storage.ExternalBlob;
  };

  module VideoMetadata {
    public func compare(meta1 : VideoMetadata, meta2 : VideoMetadata) : Order.Order {
      Text.compare(meta1.id, meta2.id);
    };
  };

  type Comment = {
    id : Text;
    videoId : Text;
    author : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  let videos = Map.empty<Text, VideoMetadata>();
  let comments = Map.empty<Text, List.List<Comment>>();
  let subscribers = Map.empty<Principal, List.List<Principal>>();

  // Video Upload
  public shared ({ caller }) func uploadVideo(title : Text, description : Text, duration : Nat, videoFile : Storage.ExternalBlob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload videos");
    };

    let videoId = title.concat(Time.now().toText());
    let metadata : VideoMetadata = {
      id = videoId;
      title;
      description;
      uploadDate = Time.now();
      duration;
      viewCount = 0;
      uploader = caller;
      videoFile = videoFile;
    };

    videos.add(videoId, metadata);
    videoId;
  };

  // Commenting System
  public shared ({ caller }) func addComment(videoId : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };

    let newComment : Comment = {
      id = Time.now().toText();
      videoId;
      author = caller;
      content;
      timestamp = Time.now();
    };

    let existingComments = switch (comments.get(videoId)) {
      case (null) { List.empty<Comment>() };
      case (?c) { c };
    };
    existingComments.add(newComment);
    comments.add(videoId, existingComments);
  };

  public query ({ caller }) func getComments(videoId : Text) : async [Comment] {
    // Public access - anyone can view comments
    switch (comments.get(videoId)) {
      case (null) { [] };
      case (?c) { c.toArray() };
    };
  };

  // Subscriptions
  public shared ({ caller }) func subscribeToChannel(channel : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can subscribe to channels");
    };

    if (channel == caller) {
      Runtime.trap("Cannot subscribe to yourself");
    };

    let existingSubscribers = switch (subscribers.get(channel)) {
      case (null) { List.empty<Principal>() };
      case (?subs) { subs };
    };

    if (existingSubscribers.toArray().values().any(func(sub) { sub == caller })) {
      Runtime.trap("Already subscribed to this channel");
    };

    existingSubscribers.add(caller);
    subscribers.add(channel, existingSubscribers);
  };

  public query ({ caller }) func getSubscribers(channel : Principal) : async [Principal] {
    // Public access - anyone can view subscriber counts
    switch (subscribers.get(channel)) {
      case (null) { [] };
      case (?subs) { subs.toArray() };
    };
  };

  // View Count
  public shared ({ caller }) func incrementViewCount(videoId : Text) : async () {
    // Public access - anyone can increment view count (including guests)
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        let updatedVideo = {
          video with
          viewCount = video.viewCount + 1 : Nat
        };
        videos.add(videoId, updatedVideo);
      };
    };
  };

  // Get Videos
  public query ({ caller }) func getVideo(videoId : Text) : async ?VideoMetadata {
    // Public access - anyone can view videos
    videos.get(videoId);
  };

  public query ({ caller }) func getAllVideos() : async [VideoMetadata] {
    // Public access - anyone can browse all videos
    videos.values().toArray().sort();
  };

  public query ({ caller }) func getChannelVideos(channel : Principal) : async [VideoMetadata] {
    // Public access - anyone can view channel videos
    videos.values().toArray().filter(
      func(video) {
        video.uploader == channel;
      }
    );
  };
};
