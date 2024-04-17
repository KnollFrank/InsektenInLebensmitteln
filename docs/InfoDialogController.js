class InfoDialogController {

    static configureDialog(
        {
            openButton,
            dialogElement,
            ingredientsWithInsectsList,
            showSupportSection
        }) {
        InfoDialogController.#configureSections({ dialogElement, ingredientsWithInsectsList, showSupportSection });
        openButton.addEventListener('click', () => dialogElement.showModal());
    }

    static #configureSections({ dialogElement, ingredientsWithInsectsList, showSupportSection }) {
        ingredientsWithInsectsList.innerHTML = IngredientsWithInsectsHtmlProvider.getIngredientsWithInsectsHtml();
        if (!showSupportSection) {
            UIUtils.hide(dialogElement.querySelector('#Support'));
        }
    }
}