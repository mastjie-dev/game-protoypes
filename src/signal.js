
export default class Signal {
    constructor() {
        this.events = []
    }

    register(name, handler) {
        const exists = this.events.find(e => e.name === name);
        if (exists) {
            console.log("event already exists");
            return;
        }
        this.events.push({ name, handler });
    }

    emit(name, args) {
        const exists = this.events.find(e => e.name === name);
        if (!exists) {
            console.log("no such event");
            return;
        }
        exists.handler(args);
    }

    clear() {
        this.events.length = 0;
    }
}
