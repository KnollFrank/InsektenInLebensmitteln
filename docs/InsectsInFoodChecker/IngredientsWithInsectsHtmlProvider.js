class IngredientsWithInsectsHtmlProvider {

    static getIngredientsWithInsectsHtml() {
        return UIUtils.asHtmlUL(IngredientsWithInsectsHtmlProvider.#getSynonymousIngredientsList());
    }

    static #getSynonymousIngredientsList() {
        return UnwantedIngredientsProvider
            .synonyms
            .map(synonym => IngredientsWithInsectsHtmlProvider.#getSynonymousIngredients(synonym));
    }

    static #getSynonymousIngredients(synonym) {
        return UIUtils
            .createLink(
                {
                    href: synonym.url.href,
                    text: synonym.patterns.map(pattern => pattern.name).join(', ')
                })
            .outerHTML;
    }
}