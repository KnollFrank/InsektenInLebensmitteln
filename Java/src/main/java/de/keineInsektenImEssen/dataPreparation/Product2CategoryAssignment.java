package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.model.IProduct;
import de.keineInsektenImEssen.productsview.categoriesgraph.Node;
import org.jgrapht.Graph;
import org.jgrapht.Graphs;
import org.jgrapht.graph.DefaultEdge;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

class Product2CategoryAssignment {

    public static void moveProductsFromSmallCategoriesIntoParentCategories(
            final Graph<Node, DefaultEdge> categoriesGraph,
            final int maxNumberOfProductsInSmallCategory) {

        PostOrderGraphVisitor.visitGraphInPostOrder(
                categoriesGraph,
                category -> {
                    if (isSmallCategory(category, maxNumberOfProductsInSmallCategory)) {
                        moveProductsFromSrc2Dsts(category, Graphs.predecessorListOf(categoriesGraph, category));
                    }
                });
    }

    private static boolean isSmallCategory(final Node category, final int maxNumberOfProductsInSmallCategory) {
        return category.getProducts().size() <= maxNumberOfProductsInSmallCategory;
    }

    static void moveProductsFromSrc2Dsts(final Node src, final List<Node> dsts) {
        if (dsts.isEmpty()) {
            return;
        }

        final Set<IProduct> srcProducts = new HashSet<>(src.getProducts());
        srcProducts.forEach(src::removeProduct);
        dsts.forEach(dst -> srcProducts.forEach(dst::addProduct));
    }
}