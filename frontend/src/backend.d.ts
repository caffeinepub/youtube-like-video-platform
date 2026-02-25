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
export type Time = bigint;
export interface Comment {
    id: string;
    content: string;
    author: Principal;
    timestamp: Time;
    videoId: string;
}
export interface VideoMetadata {
    id: string;
    title: string;
    duration: bigint;
    description: string;
    videoFile: ExternalBlob;
    viewCount: bigint;
    uploader: Principal;
    uploadDate: Time;
}
export interface UserProfile {
    name: string;
    channelDescription: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(videoId: string, content: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllVideos(): Promise<Array<VideoMetadata>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChannelVideos(channel: Principal): Promise<Array<VideoMetadata>>;
    getComments(videoId: string): Promise<Array<Comment>>;
    getSubscribers(channel: Principal): Promise<Array<Principal>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVideo(videoId: string): Promise<VideoMetadata | null>;
    incrementViewCount(videoId: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    subscribeToChannel(channel: Principal): Promise<void>;
    uploadVideo(title: string, description: string, duration: bigint, videoFile: ExternalBlob): Promise<string>;
}
