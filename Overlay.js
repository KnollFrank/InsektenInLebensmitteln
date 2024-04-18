class Overlay {

    #openButton;
    #closeButton;
    #container;
    #onOpen;
    #onClose;

    constructor({ openButton, closeButton, container, onOpen, onClose }) {
        this.#container = container;
        this.#openButton = openButton;
        this.#closeButton = closeButton;
        this.#onOpen = onOpen;
        this.#onClose = onClose
    }

    initialize() {
        this.#openButton.addEventListener(
            'click',
            _ => {
                this.#openOverlay();
                this.#onOpen();
            });
        this.#closeButton.addEventListener(
            'click',
            _ => {
                this.#onClose();
                this.#closeOverlay();
            });
    }

    #openOverlay() {
        UIUtils.setVisible(this.#container, true);
    }

    #closeOverlay() {
        UIUtils.setVisible(this.#container, false);
    }
}