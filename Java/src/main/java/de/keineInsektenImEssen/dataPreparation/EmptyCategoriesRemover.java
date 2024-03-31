package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.productsview.categoriesgraph.Node;
import org.jgrapht.Graph;
import org.jgrapht.Graphs;
import org.jgrapht.graph.DefaultEdge;

class EmptyCategoriesRemover {

    public static void removeEmptyCategories(final Graph<Node, DefaultEdge> categoriesGraph) {
        Graphs.removeVerticesAndPreserveConnectivity(
                categoriesGraph,
                EmptyCategoriesRemover::isEmptyCategory);
    }

    private static boolean isEmptyCategory(final Node category) {
        return category.getProducts().isEmpty();
    }
}
