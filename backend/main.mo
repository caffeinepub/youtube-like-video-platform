import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Iter "mo:core/Iter";
import Migration "migration";
import AccessControl "authorization/access-control";

// Migrate on upgrade to persist data
(with migration = Migration.run)
actor {
  include MixinStorage();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    channelDescription : Text;
    avatar : ?[Nat8];
    handle : Text;
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

  // Update User Profile Function
  public shared ({ caller }) func updateUserProfile(name : Text, channelDescription : Text, handle : Text, avatar : ?[Nat8]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    let updatedProfile : UserProfile = {
      name;
      channelDescription;
      handle;
      avatar;
    };

    userProfiles.add(caller, updatedProfile);
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
    isShort : Bool;
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
  public shared ({ caller }) func uploadVideo(title : Text, description : Text, duration : Nat, videoFile : Storage.ExternalBlob, isShort : Bool) : async Text {
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
      isShort;
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
    switch (comments.get(videoId)) {
      case (null) { [] };
      case (?c) { c.toArray() };
    };
  };

  // Delete a specific comment (for video owner or comment author)
  public shared ({ caller }) func deleteComment(videoId : Text, commentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete comments");
    };

    let currentComments = switch (comments.get(videoId)) {
      case (null) { Runtime.trap("No comments found for this video") };
      case (?c) { c };
    };

    let commentToDelete = currentComments.toArray().find(
      func(comment) { comment.id == commentId }
    );

    switch (commentToDelete) {
      case (null) { Runtime.trap("Comment not found") };
      case (?comment) {
        switch (videos.get(videoId)) {
          case (null) { Runtime.trap("Video not found") };
          case (?video) {
            if (comment.author != caller and video.uploader != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only comment author, video owner, or admin can delete comment");
            };
          };
        };
      };
    };

    let filteredComments = currentComments.filter(
      func(comment) { comment.id != commentId }
    );
    comments.add(videoId, filteredComments);
  };

  // Delete all comments for a video (only allowed by video owner or admin)
  public shared ({ caller }) func clearVideoComments(videoId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear video comments");
    };

    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?video) {
        if (video.uploader != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only video owner or admin can clear comments");
        };
      };
    };
    comments.remove(videoId);
  };

  // Count comments for a video
  public query ({ caller }) func getCommentCount(videoId : Text) : async Nat {
    switch (comments.get(videoId)) {
      case (null) { 0 };
      case (?c) { c.size() };
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

  public shared ({ caller }) func unsubscribeFromChannel(channel : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can unsubscribe from channels");
    };

    let existingSubscribers = switch (subscribers.get(channel)) {
      case (null) { Runtime.trap("No subscribers found for this channel") };
      case (?subs) { subs };
    };

    let filteredSubscribers = existingSubscribers.filter(
      func(sub) { sub != caller }
    );

    if (filteredSubscribers.size() == existingSubscribers.size()) {
      Runtime.trap("You are not subscribed to this channel");
    };

    subscribers.add(channel, filteredSubscribers);
  };

  public query ({ caller }) func getSubscribers(channel : Principal) : async [Principal] {
    switch (subscribers.get(channel)) {
      case (null) { [] };
      case (?subs) { subs.toArray() };
    };
  };

  public query ({ caller }) func getSubscriberCount(channel : Principal) : async Nat {
    switch (subscribers.get(channel)) {
      case (null) { 0 };
      case (?subs) { subs.size() };
    };
  };

  // Get all channels a user is subscribed to
  public query ({ caller }) func getUserSubscriptions(user : Principal) : async [Principal] {
    let channels = List.empty<Principal>();
    subscribers.keys().forEach(
      func(channel) {
        let channelSubscribers = switch (subscribers.get(channel)) {
          case (null) { List.empty<Principal>() };
          case (?subs) { subs };
        };
        if (channelSubscribers.toArray().values().any(func(sub) { sub == user })) {
          channels.add(channel);
        };
      }
    );
    channels.toArray();
  };

  // View Count - public action, anyone can increment (e.g. anonymous viewers)
  public shared ({ caller }) func incrementViewCount(videoId : Text) : async () {
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

  // Get Videos - public access
  public query ({ caller }) func getVideo(videoId : Text) : async ?VideoMetadata {
    videos.get(videoId);
  };

  public query ({ caller }) func getAllVideos() : async [VideoMetadata] {
    videos.values().toArray().sort();
  };

  public query ({ caller }) func getChannelVideos(channel : Principal) : async [VideoMetadata] {
    videos.values().toArray().filter(
      func(video) {
        video.uploader == channel;
      }
    );
  };

  // Count total videos of a specific channel
  public query ({ caller }) func getChannelVideoCount(channel : Principal) : async Nat {
    var count = 0;
    videos.values().forEach(
      func(video) {
        if (video.uploader == channel) { count += 1 };
      }
    );
    count;
  };

  // Trending Videos - public access
  public query ({ caller }) func getTrendingVideos() : async [VideoMetadata] {
    let now = Time.now();
    let weekInNanos : Int = 7 * 24 * 60 * 60 * 1_000_000_000; // 7 days in nanoseconds

    func trendingScore(video : VideoMetadata) : Int {
      let isRecent = if (now - video.uploadDate <= weekInNanos) {
        2 // Double weight for recent videos
      } else { 1 };
      let viewCountInt = switch (video.viewCount) {
        case (0) { 0 };
        case (_) { video.viewCount };
      };
      viewCountInt * isRecent;
    };

    let videoList = List.empty<(Int, VideoMetadata)>();

    videos.values().forEach(
      func(video) {
        let score = trendingScore(video);
        videoList.add((score, video));
      }
    );

    let arrayToSort = videoList.toArray();
    arrayToSort.sort(
      func(a, b) {
        let score1 = a.0;
        let score2 = b.0;
        if (score1 > score2) { #less } else if (score1 < score2) { #greater } else { #equal };
      }
    ).map(func(entry) { entry.1 });
  };

  public query ({ caller }) func getSubscribedShorts() : async [VideoMetadata] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only logged-in users can access their feed.");
    };

    var userSubscriptions = List.empty<Principal>();

    // Find channels the caller is subscribed to
    subscribers.keys().forEach(
      func(channel) {
        let channelSubscribers = switch (subscribers.get(channel)) {
          case (null) { List.empty<Principal>() };
          case (?subs) { subs };
        };
        if (channelSubscribers.toArray().values().any(func(sub) { sub == caller })) {
          userSubscriptions.add(channel);
        };
      }
    );

    if (userSubscriptions.isEmpty()) { return [] };

    // Filter shorts by subscribed channels
    let subscribedShorts = List.empty<VideoMetadata>();
    videos.values().forEach(
      func(video) {
        if (video.isShort) {
          if (userSubscriptions.toArray().values().any(func(channel) { channel == video.uploader })) {
            subscribedShorts.add(video);
          };
        };
      }
    );

    // Sort shorts by upload date DESC
    subscribedShorts.toArray().sort(
      func(a, b) {
        if (a.uploadDate > b.uploadDate) { #less } else if (a.uploadDate < b.uploadDate) { #greater } else { #equal };
      }
    );
  };

  // API Key Management
  type ApiKey = {
    key : Text;
    owner : Principal;
    apiLabel : Text;
    createdAt : Time.Time;
    active : Bool;
  };

  let apiKeys = Map.empty<Text, ApiKey>();

  // Generate Simple API Key
  func generateSimpleKey(principal : Principal) : Text {
    let timeText = Time.now().toText();
    principal.toText().concat(timeText);
  };

  // Create API Key
  public shared ({ caller }) func createApiKey(apiLabel : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create API keys");
    };

    let newKey = generateSimpleKey(caller);
    let apiKey : ApiKey = {
      key = newKey;
      owner = caller;
      apiLabel;
      createdAt = Time.now();
      active = true;
    };

    apiKeys.add(newKey, apiKey);
    newKey;
  };

  // Get User's API Keys
  public query ({ caller }) func getApiKeys() : async [ApiKey] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view API keys");
    };

    let userKeys = apiKeys.values().toArray().values().filter(
      func(apiKey) { apiKey.owner == caller }
    ).toArray();

    userKeys;
  };

  // Revoke API Key
  public shared ({ caller }) func revokeApiKey(key : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can revoke API keys");
    };

    switch (apiKeys.get(key)) {
      case (null) { Runtime.trap("API key not found") };
      case (?apiKey) {
        if (apiKey.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only key owner or admin can revoke");
        };

        let updatedKey = { apiKey with active = false };
        apiKeys.add(key, updatedKey);
      };
    };
  };

  // Validate API Key - public access
  public query ({ caller }) func validateApiKey(key : Text) : async Bool {
    switch (apiKeys.get(key)) {
      case (null) { false };
      case (?apiKey) { apiKey.active };
    };
  };

  // Playlist Types and Storage
  type Playlist = {
    id : Text;
    title : Text;
    description : Text;
    owner : Principal;
    videos : List.List<Text>; // Store video IDs in a List for ordering
    createdAt : Time.Time;
  };

  // Public view type for Playlist (immutable)
  type PlaylistView = {
    id : Text;
    title : Text;
    description : Text;
    owner : Principal;
    videos : [Text]; // Convert to immutable array
    createdAt : Time.Time;
  };

  // Helper function to create PlaylistView from internal Playlist
  func getPlaylistView(playlist : Playlist) : PlaylistView {
    {
      playlist with
      videos = playlist.videos.toArray();
    };
  };

  let playlists = Map.empty<Text, Playlist>();

  // Create Playlist
  public shared ({ caller }) func createPlaylist(title : Text, description : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create playlists");
    };

    let playlistId = title.concat(Time.now().toText());
    let newPlaylist : Playlist = {
      id = playlistId;
      title;
      description;
      owner = caller;
      videos = List.empty<Text>();
      createdAt = Time.now();
    };

    playlists.add(playlistId, newPlaylist);
    playlistId;
  };

  // Add Video to Playlist
  public shared ({ caller }) func addVideoToPlaylist(playlistId : Text, videoId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add videos to playlists");
    };

    let playlist = switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?p) { p };
    };

    if (playlist.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only playlist owner or admin can add videos");
    };

    let updatedVideos = playlist.videos.clone();
    updatedVideos.add(videoId); // Add video to end
    let updatedPlaylist = { playlist with videos = updatedVideos };
    playlists.add(playlistId, updatedPlaylist);
  };

  // Remove Video from Playlist
  public shared ({ caller }) func removeVideoFromPlaylist(playlistId : Text, videoId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove videos from playlists");
    };

    let playlist = switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?p) { p };
    };

    if (playlist.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only playlist owner or admin can remove videos");
    };

    let updatedVideos = playlist.videos.filter(func(id) { id != videoId });
    let updatedPlaylist = { playlist with videos = updatedVideos };
    playlists.add(playlistId, updatedPlaylist);
  };

  // Delete Playlist
  public shared ({ caller }) func deletePlaylist(playlistId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete playlists");
    };

    let playlist = switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?p) { p };
    };

    if (playlist.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only playlist owner or admin can delete playlist");
    };

    playlists.remove(playlistId);
  };

  // Get Playlist by ID - public access
  public query ({ caller }) func getPlaylistById(playlistId : Text) : async ?PlaylistView {
    switch (playlists.get(playlistId)) {
      case (null) { null };
      case (?p) { ?getPlaylistView(p) };
    };
  };

  // Get Playlists by Owner - public access
  public query ({ caller }) func getPlaylistsByOwner(owner : Principal) : async [PlaylistView] {
    playlists.values().toArray().map(getPlaylistView).filter(
      func(p) { p.owner == owner }
    );
  };

  // Get All Videos in Playlist (with metadata) - public access
  public query ({ caller }) func getPlaylistVideos(playlistId : Text) : async [VideoMetadata] {
    let playlist = switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?p) { p };
    };

    let videoIds = playlist.videos.toArray();
    let videosOpt = videoIds.map(func(id) { videos.get(id) });

    let filteredVideos = videosOpt.filter(
      func(opt) {
        switch (opt) {
          case (null) { false };
          case (?_) { true };
        };
      }
    );

    let finalVideos = filteredVideos.map(
      func(opt) {
        switch (opt) {
          case (null) { Runtime.trap("Unexpected null") };
          case (?v) { v };
        };
      }
    );
    finalVideos;
  };

  // Search Videos - public access
  public query ({ caller }) func searchVideos(searchTerm : Text) : async [VideoMetadata] {
    let lowerTerm = searchTerm.toLower();

    let matches = List.empty<VideoMetadata>();
    switch (videos.size()) {
      case (0) { [] };
      case (_) {
        videos.values().forEach(
          func(video) {
            let titleMatch = video.title.toLower().contains(#text lowerTerm);
            let descMatch = video.description.toLower().contains(#text lowerTerm);
            let uploaderMatch = video.uploader.toText().toLower().contains(#text lowerTerm);

            if (titleMatch or descMatch or uploaderMatch) {
              matches.add(video);
            };
          }
        );
        matches.toArray();
      };
    };
  };

  // ADMIN DASHBOARD

  type AdminAnalytics = {
    totalVideos : Nat;
    totalUsers : Nat;
    totalComments : Nat;
    totalViews : Nat;
  };

  type AdminDashboard = {
    users : [UserProfile];
    videos : [VideoMetadata];
    analytics : AdminAnalytics;
  };

  public query ({ caller }) func getAdminDashboard() : async AdminDashboard {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can access dashboard");
    };

    let totalVideos = videos.size();
    let totalUsers = userProfiles.size();

    var totalComments = 0;
    comments.values().forEach(func(commentList) { totalComments += commentList.size() });

    var totalViews = 0;
    videos.values().forEach(func(video) { totalViews += video.viewCount });

    let analytics : AdminAnalytics = {
      totalVideos;
      totalUsers;
      totalComments;
      totalViews;
    };

    {
      users = userProfiles.values().toArray();
      videos = videos.values().toArray();
      analytics;
    };
  };

  public shared ({ caller }) func adminRemoveVideo(videoId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can remove videos");
    };

    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (_) {
        videos.remove(videoId);
        comments.remove(videoId);
      };
    };
  };

  public shared ({ caller }) func adminRemoveUserProfile(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can remove user profiles");
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User profile not found") };
      case (_) {
        userProfiles.remove(user);
        let userVideos = videos.values().toArray().filter(
          func(video) { video.uploader == user }
        );
        userVideos.values().forEach(
          func(video) { videos.remove(video.id) }
        );
      };
    };
  };

  // Community Post Types and Storage

  type CommunityPost = {
    id : Text;
    author : Principal;
    body : Text;
    attachment : ?Storage.ExternalBlob;
    timestamp : Time.Time;
  };

  let communityPosts = Map.empty<Text, CommunityPost>();

  // Create Community Post
  public shared ({ caller }) func createCommunityPost(body : Text, attachment : ?Storage.ExternalBlob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };

    let postId = Time.now().toText();
    let post : CommunityPost = {
      id = postId;
      author = caller;
      body;
      attachment;
      timestamp = Time.now();
    };
    communityPosts.add(postId, post);
    postId;
  };

  // Get All Community Posts - public access
  public query ({ caller }) func getCommunityPosts() : async [CommunityPost] {
    communityPosts.values().toArray();
  };

  // Get Community Posts by Channel (author) - public access
  public query ({ caller }) func getCommunityPostsByChannel(channel : Principal) : async [CommunityPost] {
    communityPosts.values().toArray().filter(
      func(post) { post.author == channel }
    );
  };

  // Delete Community Post (author or admin only)
  public shared ({ caller }) func deleteCommunityPost(postId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete posts");
    };

    let post = switch (communityPosts.get(postId)) {
      case (null) { Runtime.trap("Community post not found") };
      case (?p) { p };
    };

    if (caller != post.author and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only post author or admin can delete post");
    };

    communityPosts.remove(postId);
  };

  type MonetizationStats = {
    totalEarnings : Nat;
    estimatedRevenue : Nat;
    monetizationStatus : Text;
  };

  public query ({ caller }) func getMonetizationStats() : async MonetizationStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view monetization stats");
    };

    let stats : MonetizationStats = {
      totalEarnings = 9000000;
      estimatedRevenue = 40;
      monetizationStatus = "Enabled";
    };

    stats;
  };

  // Creator Dollar Bank Account
  public type WithdrawalStatus = {
    #pending;
    #approved;
    #cancelled;
  };

  public type Withdrawal = {
    amountCents : Nat;
    timestamp : Time.Time;
    status : WithdrawalStatus;
  };

  public type AccountState = {
    balanceCents : Nat;
    withdrawals : [Withdrawal];
  };

  var creatorBankBalance = 0; // Balance in cents
  var withdrawalRequests : [Withdrawal] = [];

  // Get Account State (Balance + Withdrawals) - creator (user) access
  public query ({ caller }) func getCreatorBankAccountState() : async AccountState {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their account state");
    };
    {
      balanceCents = creatorBankBalance;
      withdrawals = withdrawalRequests;
    };
  };

  // Get Balance (Cents) - creator (user) access
  public query ({ caller }) func getCreatorBankBalanceCents() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their balance");
    };
    creatorBankBalance;
  };

  // Request Withdrawal - creator (user) action
  public shared ({ caller }) func requestWithdrawal(amountCents : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };

    if (amountCents == 0 or amountCents > creatorBankBalance) {
      Runtime.trap("Invalid withdrawal amount");
    };

    // Check for pending withdrawals
    let hasPending = withdrawalRequests.any(
      func(w) {
        switch (w.status) {
          case (#pending) { true };
          case (_) { false };
        };
      }
    );

    if (hasPending) {
      Runtime.trap("Existing pending withdrawal");
    };

    let newWithdrawal : Withdrawal = {
      amountCents;
      timestamp = Time.now();
      status = #pending;
    };

    withdrawalRequests := withdrawalRequests.concat([newWithdrawal]);
  };

  // Approve Withdrawal - admin-only action (admin processes the payout)
  public shared ({ caller }) func approveWithdrawal() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can approve withdrawals");
    };

    // Find the index of the first pending withdrawal (search from start)
    let pendingIndex = withdrawalRequests.findIndex(
      func(w) {
        switch (w.status) {
          case (#pending) { true };
          case (_) { false };
        };
      }
    );

    switch (pendingIndex) {
      case (null) { Runtime.trap("No pending withdrawals found") };
      case (?index) {
        let withdrawalToApprove = withdrawalRequests[index];
        let approvedWithdrawal = {
          withdrawalToApprove with
          status = #approved : WithdrawalStatus
        };

        if (creatorBankBalance >= withdrawalToApprove.amountCents) {
          creatorBankBalance -= withdrawalToApprove.amountCents;
        } else {
          Runtime.trap("Insufficient balance for withdrawal approval");
        };

        // Remove the pending withdrawal from the array
        let beforePendingWith = withdrawalRequests.sliceToArray(0, index);
        let afterPending = withdrawalRequests.sliceToArray(index + 1, withdrawalRequests.size());
        withdrawalRequests := beforePendingWith.concat(afterPending).concat([approvedWithdrawal]);
      };
    };
  };

  // Cancel Withdrawal - creator (user) can cancel their own pending withdrawal
  public shared ({ caller }) func cancelWithdrawal() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cancel withdrawals");
    };

    // Find the index of the first pending withdrawal (search from start)
    let firstPendingIndex = withdrawalRequests.findIndex(
      func(w) {
        switch (w.status) {
          case (#pending) { true };
          case (_) { false };
        };
      }
    );

    switch (firstPendingIndex) {
      case (null) { () };
      case (?index) {
        let withdrawalToCancel = withdrawalRequests[index];
        let cancelledWithdrawal = {
          withdrawalToCancel with
          status = #cancelled : WithdrawalStatus
        };

        // Remove the cancelled withdrawal from the array
        let beforeCancelled = withdrawalRequests.sliceToArray(0, index);
        let afterCancelled = withdrawalRequests.sliceToArray(index + 1, withdrawalRequests.size());
        withdrawalRequests := beforeCancelled.concat(afterCancelled).concat([cancelledWithdrawal]);
      };
    };
  };

  // Simulate Incoming Test Payment - admin-only action
  public shared ({ caller }) func simulateAdminBankPayment(testAmountCents : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can simulate payments");
    };
    creatorBankBalance += testAmountCents;
  };

  // Remove Last Pending Withdrawal - creator (user) action
  public shared ({ caller }) func removeLastPendingWithdrawal() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove their pending withdrawals");
    };

    let lastPendingIndex = switch (withdrawalRequests.size()) {
      case (0) { null };
      case (size) { ?(size - 1) };
    };

    switch (lastPendingIndex) {
      case (null) { Runtime.trap("No pending withdrawals to remove") };
      case (?index) {
        if (switch (withdrawalRequests[index].status) { case (#pending) { true }; case (_) { false } }) {
          withdrawalRequests := withdrawalRequests.sliceToArray(0, index);
        };
      };
    };
  };

  // Check for account deletion - creator (user) access
  public query ({ caller }) func getHasUnapprovedWithdrawal() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check their withdrawal status");
    };
    withdrawalRequests.find(
      func(w) {
        switch (w.status) {
          case (#pending) { true };
          case (_) { false };
        };
      }
    ) != null;
  };
};
