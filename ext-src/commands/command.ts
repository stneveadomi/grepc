import { LogOutputChannel } from "vscode";

export class Command {

    id: string;
    callback: () => void;

    constructor(id: string, callback: () => void, logger: LogOutputChannel) {
        this.id = id;
        this.callback = () => {
            logger.info(`Running command: ${id}`);
            callback();
        };
    }

}