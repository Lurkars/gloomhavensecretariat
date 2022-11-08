export class ServerInfo {
    url: string;
    port: number;
    privacy: string;
    secure: boolean;
    website: string = "";
    description: string = "";
    location: string = "";

    constructor(url: string, port: number, privacy: string, secure: boolean = false) {
        this.url = url;
        this.port = port;
        this.privacy = privacy;
        this.secure = secure;
    }
};