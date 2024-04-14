class ProductsOfNodesSetter {

    static setProductsOfNodes(products, nodes) {
        for (const product of products) {
            ProductsOfNodesSetter.#setProductOfNodes(product, nodes);
        }
    }

    static #setProductOfNodes(product, nodes) {
        ProductsOfNodesSetter.#addProduct2EachNode(
            product,
            ProductsOfNodesSetter.#getNodesForProduct(nodes, product));
    }

    static #getNodesForProduct(nodes, product) {
        return new Set(
            [...product.categories_tags]
                .map(
                    categories_tag =>
                        Nodes.getNodeNamed(
                            nodes,
                            categories_tag)));
    }

    static #addProduct2EachNode(product, nodes) {
        for (const node of nodes) {
            node.addProduct(product);
        }
    }
}