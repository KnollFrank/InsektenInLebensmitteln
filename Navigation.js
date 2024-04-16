class Navigation {

    #nodes;

    constructor() {
        this.#nodes = [{ node: undefined, scrollTop: undefined }];
    }

    getCurrentNode() {
        return this.#nodes.at(-1);
    }

    getParentNode() {
        return this.#nodes.at(-2);
    }

    gotoChildNode({ child, scrollTopWithinParentOfChild }) {
        const parentOfChild = this.getCurrentNode();
        parentOfChild.scrollTop = scrollTopWithinParentOfChild;
        this.#nodes.push({ node: child, scrollTop: undefined });
    }

    gotoParentNode() {
        this.#nodes.pop();
    }

    hasParentNode() {
        return this.#nodes.length > 1;
    }
}