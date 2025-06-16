export interface Announcement {
    senderName: string;
    operation: string;
    information: string;
    course?: string;
    attechedFileInfo?: string;
    date: string;
    time: string;
    diffrentBackground?: boolean;
}