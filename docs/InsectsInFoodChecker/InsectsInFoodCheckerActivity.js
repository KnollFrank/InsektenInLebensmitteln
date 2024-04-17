class InsectsInFoodCheckerActivity {

    #highlightWithinTextarea;
    #ingredients;
    #ingredientsWithInsectsBlock;
    #ingredientsWithInsects;
    #noIngredientsWithInsectsFoundBlock;
    #ingredientsWithInsectsList;
    #clearButton;
    #ingredientsWithInsectsFinder;

    constructor(
        {
            ingredientsJQuery,
            ingredientsWithInsectsBlock,
            ingredientsWithInsects,
            noIngredientsWithInsectsFoundBlock,
            ingredientsWithInsectsList,
            clearButton
        }) {
        this.#ingredientsWithInsectsFinder = InsectsInFoodCheckerActivity.#createIngredientsWithInsectsFinder();
        this.#highlightWithinTextarea =
            new HighlightWithinTextarea(
                ingredientsJQuery,
                ingredients => this.#ingredientsWithInsectsFinder.invoke(ingredients));
        this.#ingredients = ingredientsJQuery[0];
        this.#ingredientsWithInsectsBlock = ingredientsWithInsectsBlock;
        this.#ingredientsWithInsects = ingredientsWithInsects;
        this.#noIngredientsWithInsectsFoundBlock = noIngredientsWithInsectsFoundBlock;
        this.#ingredientsWithInsectsList = ingredientsWithInsectsList;
        this.#clearButton = clearButton;
    }

    start() {
        this.#highlightWithinTextarea.initialize();
        this.#displayIngredientsWithInsectsList();
        this.#configureIngredientsForm();
        this.#hideResultBlocks();
        this.#clearButton.click();
        this.#ingredients.focus();
    }

    #displayIngredientsWithInsectsList() {
        this.#ingredientsWithInsectsList.innerHTML =
            UIUtils.asHtmlUL(this.#getSynonymousIngredientsList());
    }

    #getSynonymousIngredientsList() {
        return UnwantedIngredientsProvider
            .synonyms
            .map(synonym => this.#getSynonymousIngredients(synonym));
    }

    #getSynonymousIngredients(synonym) {
        return synonym
            .patterns
            .map(pattern => pattern.name)
            .join(', ');
    }

    #configureIngredientsForm() {
        this.#ingredients.addEventListener(
            'input',
            () => {
                this.#findIngredientsWithInsectsAndShowResults(this.#ingredients.value);
            });
        this.#clearButton.addEventListener(
            'click',
            () => {
                this.#ingredients.value = '';
                this.#findIngredientsWithInsectsAndShowResults(this.#ingredients.value);
                this.#ingredients.focus();
            });
    }

    #findIngredientsWithInsectsAndShowResults(ingredients) {
        const { matches } = this.#ingredientsWithInsectsFinder.invoke(ingredients);
        this.#showResults(matches);
    }

    #showResults(matches) {
        if (matches.length !== 0) {
            this.#showIngredientsWithInsects(this.#wordOccurrences2Str(matches));
        } else {
            this.#showNoIngredientsWithInsectsFoundBlock();
        }
        this.#highlightWithinTextarea.update();
    }

    #hideResultBlocks() {
        UIUtils.hide(this.#ingredientsWithInsectsBlock);
        UIUtils.hide(this.#noIngredientsWithInsectsFoundBlock);
    }

    #showIngredientsWithInsects(ingredientsWithInsects) {
        this.#ingredientsWithInsects.innerText = ingredientsWithInsects;
        UIUtils.show(this.#ingredientsWithInsectsBlock);

        UIUtils.hide(this.#noIngredientsWithInsectsFoundBlock);
        this.#insects_yes();
    }

    #showNoIngredientsWithInsectsFoundBlock() {
        UIUtils.hide(this.#ingredientsWithInsectsBlock);
        UIUtils.show(this.#noIngredientsWithInsectsFoundBlock);
        this.#insects_no();
    }

    #insects_yes() {
        const hwtContainer = document.querySelector('.hwt-container');
        hwtContainer.classList.add('insects_yes');
        hwtContainer.classList.remove('insects_no');
    }

    #insects_no() {
        const hwtContainer = document.querySelector('.hwt-container');
        hwtContainer.classList.add('insects_no');
        hwtContainer.classList.remove('insects_yes');
    }

    #wordOccurrences2Str(wordOccurrences) {
        const words = wordOccurrences.map(wordOccurrence => wordOccurrence.pattern);
        return [...new Set(words)].join(', ');
    }

    static #createIngredientsWithInsectsFinder() {
        const ingredientsWithInsectsFinder = new IngredientsWithInsectsFinder();
        return new UnaryFunctionCache(
            ingredients =>
                ingredientsWithInsectsFinder.findIngredientsWithInsects(ingredients));
    }
}