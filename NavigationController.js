class NavigationController {

    #navigation;
    #nodeView;
    #prevBtn;
    #getScrollTop;
    #setScrollTop;

    constructor(navigation, nodeView, prevBtn, getScrollTop, setScrollTop) {
        this.#navigation = navigation;
        this.#nodeView = nodeView;
        this.#prevBtn = prevBtn;
        this.#getScrollTop = getScrollTop;
        this.#setScrollTop = setScrollTop;
    }

    gotoChildNode(child) {
        this.#navigation.gotoChildNode(child, this.#getScrollTop());
        this.#nodeView.displayNode(child);
        this.#enableOrDisablePrevBtn();
        this.#setScrollTop(0);
    }

    gotoParentNode() {
        const { parent, scrollTop } = this.#navigation.gotoParentNode();
        this.#nodeView.displayNode(parent);
        this.#enableOrDisablePrevBtn();
        this.#setScrollTop(scrollTop);
    }

    #enableOrDisablePrevBtn() {
        this.#prevBtn.disabled = !this.#navigation.hasParentNode();
    }
}
