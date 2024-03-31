class Navigation {

    #nodes;

    constructor(rootNode) {
        this.#nodes = [rootNode];
    }

    getCurrentNode() {
        return this.#nodes.at(-1);
    }

    getParentNode() {
        return this.#nodes.at(-2);
    }

    gotoChildNode(child) {
        this.#nodes.push(child);
    }

    gotoParentNodeIfExists() {
        if (this.#nodes.length > 1) {
            this.#nodes.pop();
        }
        return this.getCurrentNode();
    }
}