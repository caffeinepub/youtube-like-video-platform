import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface PlaylistView {
    id: string;
    title: string;
    owner: Principal;
    createdAt: Time;
    description: string;
    videos: Array<string>;
}
export type Time = bigint;
export interface Comment {
    id: string;
    content: string;
    author: Principal;
    timestamp: Time;
    videoId: string;
}
export interface AdminDashboard {
    analytics: AdminAnalytics;
    users: Array<UserProfile>;
    videos: Array<VideoMetadata>;
}
export interface AdminAnalytics {
    totalViews: bigint;
    totalVideos: bigint;
    totalUsers: bigint;
    totalComments: bigint;
}
export interface CommunityPost {
    id: string;
    body: string;
    author: Principal;
    timestamp: Time;
    attachment?: ExternalBlob;
}
export interface ApiKey {
    key: string;
    active: boolean;
    owner: Principal;
    createdAt: Time;
    apiLabel: string;
}
export interface VideoMetadata {
    id: string;
    title: string;
    duration: bigint;
    isShort: boolean;
    description: string;
    videoFile: ExternalBlob;
    viewCount: bigint;
    uploader: Principal;
    uploadDate: Time;
}
export interface UserProfile {
    name: string;
    handle: string;
    channelDescription: string;
    avatar?: Uint8Array;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(videoId: string, content: string): Promise<void>;
    addVideoToPlaylist(playlistId: string, videoId: string): Promise<void>;
    adminRemoveUserProfile(user: Principal): Promise<void>;
    adminRemoveVideo(videoId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearVideoComments(videoId: string): Promise<void>;
    createApiKey(apiLabel: string): Promise<string>;
    createCommunityPost(body: string, attachment: ExternalBlob | null): Promise<string>;
    createPlaylist(title: string, description: string): Promise<string>;
    deleteComment(videoId: string, commentId: string): Promise<void>;
    deleteCommunityPost(postId: string): Promise<void>;
    deletePlaylist(playlistId: string): Promise<void>;
    getAdminDashboard(): Promise<AdminDashboard>;
    getAllVideos(): Promise<Array<VideoMetadata>>;
    getApiKeys(): Promise<Array<ApiKey>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChannelVideoCount(channel: Principal): Promise<bigint>;
    getChannelVideos(channel: Principal): Promise<Array<VideoMetadata>>;
    getCommentCount(videoId: string): Promise<bigint>;
    getComments(videoId: string): Promise<Array<Comment>>;
    getCommunityPosts(): Promise<Array<CommunityPost>>;
    getCommunityPostsByChannel(channel: Principal): Promise<Array<CommunityPost>>;
    getPlaylistById(playlistId: string): Promise<PlaylistView | null>;
    getPlaylistVideos(playlistId: string): Promise<Array<VideoMetadata>>;
    getPlaylistsByOwner(owner: Principal): Promise<Array<PlaylistView>>;
    getSubscriberCount(channel: Principal): Promise<bigint>;
    getSubscribers(channel: Principal): Promise<Array<Principal>>;
    getTrendingVideos(): Promise<Array<VideoMetadata>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSubscriptions(user: Principal): Promise<Array<Principal>>;
    getVideo(videoId: string): Promise<VideoMetadata | null>;
    incrementViewCount(videoId: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<void>;
    revokeApiKey(key: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchVideos(searchTerm: string): Promise<Array<VideoMetadata>>;
    subscribeToChannel(channel: Principal): Promise<void>;
    unsubscribeFromChannel(channel: Principal): Promise<void>;
    updateUserProfile(name: string, channelDescription: string, handle: string, avatar: Uint8Array | null): Promise<void>;
    uploadVideo(title: string, description: string, duration: bigint, videoFile: ExternalBlob, isShort: boolean): Promise<string>;
    validateApiKey(key: string): Promise<boolean>;
}
