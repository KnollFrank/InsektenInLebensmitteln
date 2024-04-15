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

    gotoChildNode(child, scrollTop) {
        this.#nodes.push({ node: child, scrollTop });
    }

    gotoParentNode() {
        // FK-TODO: refactor
        const parent = this.getParentNode();
        const current = this.getCurrentNode();
        this.#nodes.pop();
        return { parent: parent.node, scrollTop: current.scrollTop };
    }

    hasParentNode() {
        return this.#nodes.length > 1;
    }
}