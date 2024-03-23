class CategoriesView {

    #container;
    #onCategoryClicked;

    constructor(container) {
        this.#container = container;
        this.#onCategoryClicked = category => { };
    }

    displayCategories(categories) {
        this
            .#sortCategoriesByDisplayName(categories)
            .forEach(category => this.#displayCategory(category));
    }

    #sortCategoriesByDisplayName(categories) {
        return categories.toSorted(
            (category1, category2) =>
                Utils.compareStrsIgnoreCase(
                    category1.getDisplayName(),
                    category2.getDisplayName()));
    }

    setOnCategoryClicked(onCategoryClicked) {
        this.#onCategoryClicked = onCategoryClicked;
    }

    #displayCategory(category) {
        this.#container.appendChild(
            CategoryCardViewFactory.createCategoryCardView(
                category,
                category => this.#onCategoryClicked(category)));
    }
}