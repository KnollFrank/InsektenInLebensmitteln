class NavigationController {

    #navigation;
    #nodeView;
    #prevBtn;

    constructor(navigation, nodeView, prevBtn) {
        this.#navigation = navigation;
        this.#nodeView = nodeView;
        this.#prevBtn = prevBtn;
    }

    gotoCurrentNode() {
        this.#nodeView.displayNode(this.#navigation.getCurrentNode());
        this.#enableOrDisablePrevBtn();
        // FK-TODO: brauchen ein "recyclerViewOrTextView.recyclerView.scrollToPosition(getPositionOfCurrentNodeWithinParentNode());"
    }

    gotoChildNode(child) {
        this.#navigation.gotoChildNode(child);
        this.#nodeView.displayNode(child);
        this.#enableOrDisablePrevBtn();
        // FK-TODO: brauchen ein "recyclerViewOrTextView.recyclerView.scrollToPosition(0);"
    }

    gotoParentNode() {
        const parent = this.#navigation.gotoParentNodeIfExists();
        this.#nodeView.displayNode(parent);
        this.#enableOrDisablePrevBtn();
        // FK-TODO: brauchen ein "recyclerViewOrTextView.recyclerView.scrollToPosition(position);"
    }

    #enableOrDisablePrevBtn() {
        this.#prevBtn.disabled = !this.#navigation.hasParentNode();
    }
}
