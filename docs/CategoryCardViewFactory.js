// FK-TODO: make CategoryCardView a custom html element. See https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements
class CategoryCardViewFactory {

    static createCategoryCardView(category, onCategoryClicked) {
        const categoryCardView = UIUtils.instantiateTemplate('template-CategoryCardView');
        categoryCardView.querySelector(".category_name").textContent = category.getDisplayName();
        categoryCardView.addEventListener('click', _ => onCategoryClicked(category));
        return categoryCardView;
    }
}