class InfoDialogController {

    static configureDialog({ openButton, dialogElement, showSupportSection, showAndroidAppSection }) {
        InfoDialogController.#configureSections({ dialogElement, showSupportSection, showAndroidAppSection });
        openButton.addEventListener('click', () => dialogElement.showModal());
    }

    static #configureSections({ dialogElement, showSupportSection, showAndroidAppSection }) {
        if (!showSupportSection) {
            UIUtils.hide(dialogElement.querySelector('#Support'));
        }
        if (!showAndroidAppSection) {
            UIUtils.hide(dialogElement.querySelector('#AndroidApp'));
        }
    }
}