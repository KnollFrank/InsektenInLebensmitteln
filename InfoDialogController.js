class InfoDialogController {

    static configureDialog({ openButton, dialogElement, ingredientsWithInsectsList }) {
        ingredientsWithInsectsList.innerHTML = IngredientsWithInsectsHtmlProvider.getIngredientsWithInsectsHtml();
        openButton.addEventListener('click', () => dialogElement.showModal());
    }
}