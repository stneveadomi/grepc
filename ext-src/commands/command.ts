
export class Command {

    id: string;
    callback: () => void;

    constructor(id: string, callback: () => void) {
        this.id = id;
        this.callback = callback;
    }

}