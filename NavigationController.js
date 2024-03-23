class NavigationController {

    #navigation;
    #nodeView;

    constructor(navigation, nodeView) {
        this.#navigation = navigation;
        this.#nodeView = nodeView;
    }

    gotoCurrentNode() {
        this.#nodeView.displayNode(this.#navigation.getCurrentNode());
        // FK-TODO: brauchen ein "recyclerViewOrTextView.recyclerView.scrollToPosition(getPositionOfCurrentNodeWithinParentNode());"
    }

    gotoChildNode(child) {
        this.#navigation.gotoChildNode(child);
        this.#nodeView.displayNode(child);
        // FK-TODO: brauchen ein "recyclerViewOrTextView.recyclerView.scrollToPosition(0);"
    }

    gotoParentNode() {
        const parent = this.#navigation.gotoParentNodeIfExists();
        this.#nodeView.displayNode(parent);
        // FK-TODO: brauchen ein "recyclerViewOrTextView.recyclerView.scrollToPosition(position);"
    }
}
