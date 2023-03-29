export class ServerInfo {
    url: string;
    port: number;
    secure: boolean;
    description: string = "";
    location: string = "";
    urls: Record<string,string> = {};

    constructor(url: string, port: number, secure: boolean = false) {
        this.url = url;
        this.port = port;
        this.secure = secure;
    }
};