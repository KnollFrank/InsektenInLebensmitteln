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
        this.#ingredientsWithInsectsList.innerHTML = IngredientsWithInsectsHtmlProvider.getIngredientsWithInsectsHtml();
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
        UIUtils.setVisible(this.#ingredientsWithInsectsBlock, false);
        UIUtils.setVisible(this.#noIngredientsWithInsectsFoundBlock, false);
    }

    #showIngredientsWithInsects(ingredientsWithInsects) {
        this.#ingredientsWithInsects.innerText = ingredientsWithInsects;
        UIUtils.setVisible(this.#ingredientsWithInsectsBlock, true);

        UIUtils.setVisible(this.#noIngredientsWithInsectsFoundBlock, false);
        this.#insects_yes();
    }

    #showNoIngredientsWithInsectsFoundBlock() {
        UIUtils.setVisible(this.#ingredientsWithInsectsBlock, false);
        UIUtils.setVisible(this.#noIngredientsWithInsectsFoundBlock, true);
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