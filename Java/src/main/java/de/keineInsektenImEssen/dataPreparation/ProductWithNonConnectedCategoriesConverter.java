package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.productsview.categoriesgraph.Graph;
import de.keineInsektenImEssen.productsview.categoriesgraph.Node;
import de.keineInsektenImEssen.productsview.categoriesgraph.NodeAttributes;
import org.jgrapht.graph.DefaultEdge;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static de.keineInsektenImEssen.dataPreparation.Nodes.names2Nodes;
import static de.keineInsektenImEssen.dataPreparation.Nodes.nodes2Names;

class ProductWithNonConnectedCategoriesConverter {

    public static List<Product> asProductsWithNonConnectedCategories(
            final List<Product> products,
            final Graph<Node, DefaultEdge, NodeAttributes> categoriesGraph) {
        return new ProductWithNonConnectedCategoriesConverter(categoriesGraph).asProductsWithNonConnectedCategories(products);
    }

    private final Graph<Node, DefaultEdge, NodeAttributes> categoriesGraph;

    private ProductWithNonConnectedCategoriesConverter(final Graph<Node, DefaultEdge, NodeAttributes> categoriesGraph) {
        this.categoriesGraph = categoriesGraph;
    }

    private List<Product> asProductsWithNonConnectedCategories(final List<Product> products) {
        return products
                .stream()
                .map(this::asProductWithNonConnectedCategories)
                .collect(Collectors.toList());
    }

    private Product asProductWithNonConnectedCategories(final Product product) {
        return new Product(
                product.getBarcode(),
                product.getUnwantedIngredients(),
                product.image_url,
                getNonConnectedCategories(product.getCategoriesTags()),
                product.getProductName(),
                product.stores,
                product.getBrands(),
                product.getCountries());
    }

    private Set<String> getNonConnectedCategories(final Set<String> categories) {
        return nodes2Names(
                NonConnectedNodesProvider.getNonConnectedNodes(
                        this.categoriesGraph.graph,
                        names2Nodes(categories, categoriesGraph.nodeAttributesDAO)));
    }
}
