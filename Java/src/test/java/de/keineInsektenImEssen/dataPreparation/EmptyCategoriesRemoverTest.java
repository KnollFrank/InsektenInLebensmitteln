package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.productsview.categoriesgraph.Node;
import de.keineInsektenImEssen.productsview.categoriesgraph.NodeDAO;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;
import org.junit.jupiter.api.Test;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

public class EmptyCategoriesRemoverTest {

    @Test
    public void shouldRemoveEmptyCategories_singleCategory() {
        // Given
        final NodeDAO nodeDAO = new NodeDAO();
        final Graph<Node, DefaultEdge> categoriesGraph =
                DefaultDirectedGraph
                        .<Node, DefaultEdge>createBuilder(DefaultEdge.class)
                        .addVertex(new Node("A", nodeDAO))
                        .build();

        // When
        EmptyCategoriesRemover.removeEmptyCategories(categoriesGraph);

        // Then
        assertThat(
                GraphHelper.equalsGraphs(
                        categoriesGraph,
                        DefaultDirectedGraph
                                .<Node, DefaultEdge>createBuilder(DefaultEdge.class)
                                .build()),
                is(true));
    }

    @Test
    public void shouldRemoveEmptyCategories_categoryInTheMiddle() {
        // Given
        final NodeDAO nodeDAO = new NodeDAO();
        final Node A = new Node("A", nodeDAO);
        final Node B = new Node("B", nodeDAO);
        final Node C = new Node("C", nodeDAO);
        final Node D = new Node("D", nodeDAO);
        final Node E = new Node("E", nodeDAO);
        final Graph<Node, DefaultEdge> categoriesGraph =
                DefaultDirectedGraph
                        .<Node, DefaultEdge>createBuilder(DefaultEdge.class)
                        .addEdge(B, A)
                        .addEdge(C, A)
                        .addEdge(A, D)
                        .addEdge(A, E)
                        .build();

        B.addProduct(ProductTestFactory.createSomeProductHavingCategory(B.getName()));
        C.addProduct(ProductTestFactory.createSomeProductHavingCategory(C.getName()));
        D.addProduct(ProductTestFactory.createSomeProductHavingCategory(D.getName()));
        E.addProduct(ProductTestFactory.createSomeProductHavingCategory(E.getName()));

        // When
        EmptyCategoriesRemover.removeEmptyCategories(categoriesGraph);

        // Then
        assertThat(
                GraphHelper.equalsGraphs(
                        categoriesGraph,
                        DefaultDirectedGraph
                                .<Node, DefaultEdge>createBuilder(DefaultEdge.class)
                                .addEdge(B, D)
                                .addEdge(B, E)
                                .addEdge(C, D)
                                .addEdge(C, E)
                                .build()),
                is(true));
    }
}
