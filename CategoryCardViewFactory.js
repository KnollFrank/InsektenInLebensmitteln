class CategoryCardViewFactory {

    static createCategoryCardView(category, onCategoryClicked) {
        const categoryCardView = UIUtils.instantiateTemplate('template-CategoryCardView');
        categoryCardView.querySelector(".category_name").textContent = category.getDisplayName();
        categoryCardView.addEventListener('click', _ => onCategoryClicked(category));
        return categoryCardView;
    }
}