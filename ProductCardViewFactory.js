// FK-TODO: make ProductCardView a custom html element. See https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements
class ProductCardViewFactory {

    static createProductCardView({ product_name_html, image_url, unwantedIngredients, brands, stores, countries }) {
        const productCardView = UIUtils.instantiateTemplate('template-ProductCardView');
        productCardView.querySelector(".product_name").innerHTML = product_name_html;
        ProductCardViewFactory.#configureLoadingOfProductImage(
            {
                product_image: productCardView.querySelector('.product_image'),
                image_url: image_url,
                loading_image: productCardView.querySelector('.loading_image')
            }
        );
        productCardView.querySelector(".unwantedIngredients").textContent = unwantedIngredients;
        productCardView.querySelector(".brands").textContent = brands;
        productCardView.querySelector(".stores").textContent = stores;
        productCardView.querySelector(".countries").textContent = countries;
        return productCardView;
    }

    static #configureLoadingOfProductImage({ product_image, image_url, loading_image }) {
        product_image.src = image_url;
        UIUtils.show(loading_image);
        product_image.addEventListener('load', _ => UIUtils.hide(loading_image));
    }
}