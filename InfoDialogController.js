class InfoDialogController {

    static configureDialog(
        {
            openButton,
            dialogElement,
            ingredientsWithInsectsList,
            showSupportSection,
            // FK-TODO: remove showAndroidAppSection
            showAndroidAppSection
        }) {
        InfoDialogController.#configureSections({ dialogElement, ingredientsWithInsectsList, showSupportSection, showAndroidAppSection });
        openButton.addEventListener('click', () => dialogElement.showModal());
    }

    static #configureSections({ dialogElement, ingredientsWithInsectsList, showSupportSection, showAndroidAppSection }) {
        ingredientsWithInsectsList.innerHTML = IngredientsWithInsectsHtmlProvider.getIngredientsWithInsectsHtml();
        if (!showSupportSection) {
            UIUtils.hide(dialogElement.querySelector('#Support'));
        }
        if (!showAndroidAppSection) {
            UIUtils.hide(dialogElement.querySelector('#AndroidApp'));
        }
    }
}