package de.keineInsektenImEssen.productsview.categoriesgraph;

import de.keineInsektenImEssen.common.Utils;
import de.keineInsektenImEssen.model.IProduct;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

public class ProductsOfNodesSetter {

    public static void setProductsOfNodes(
            final Set<? extends IProduct> products,
            final Set<Node> nodes,
            final Node defaultNode) {
        products.forEach(product -> setProductOfNodes(product, nodes, defaultNode));
    }

    private static void setProductOfNodes(final IProduct product, final Set<Node> nodes, final Node defaultNode) {
        addProduct2EachNode(
                product,
                getNodesForProductOrDefault(nodes, product, defaultNode));
    }

    private static Set<Node> getNodesForProductOrDefault(final Set<Node> nodes, final IProduct product, final Node defaultNode) {
        final Set<Node> nodesForProduct = getNodesForProduct(nodes, product);
        return nodesForProduct.isEmpty() ?
                Collections.singleton(defaultNode) :
                nodesForProduct;
    }

    private static Set<Node> getNodesForProduct(final Set<Node> nodes, final IProduct product) {
        return product
                .getCategoriesTags()
                .stream()
                .map(categories_tag -> getNodeNamed(nodes, categories_tag))
                .collect(Collectors.toSet());
    }

    private static Node getNodeNamed(final Set<Node> nodes, final String name) {
        return Utils.getOnlyElement(
                nodes
                        .stream()
                        .filter(node -> name.equals(node.getName()))
                        .collect(Collectors.toList()));
    }

    private static void addProduct2EachNode(final IProduct product, final Set<Node> nodes) {
        nodes.forEach(node -> node.addProduct(product));
    }
}
