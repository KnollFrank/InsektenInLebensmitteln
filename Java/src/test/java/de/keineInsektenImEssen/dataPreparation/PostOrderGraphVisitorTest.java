package de.keineInsektenImEssen.dataPreparation;

import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

public class PostOrderGraphVisitorTest {

    @Test
    public void shouldVisitGraphInPostOrder_tree() {
        // Given
        final Graph<String, DefaultEdge> graph =
                DefaultDirectedGraph
                        .<String, DefaultEdge>createBuilder(DefaultEdge.class)
                        .addEdge("A", "B")
                        .addEdge("A", "C")
                        .build();

        // When
        final List<String> visitedNodes = new ArrayList<>();
        PostOrderGraphVisitor.visitGraphInPostOrder(graph, visitedNodes::add);

        // Then
        assertThat(visitedNodes, is(Arrays.asList("B", "C", "A")));
    }

    @Test
    public void shouldVisitGraphInPostOrder_diamond() {
        // Given
        /*
              A
             / \
            B   C
             \ /
              D
         */
        final Graph<String, DefaultEdge> graph =
                DefaultDirectedGraph
                        .<String, DefaultEdge>createBuilder(DefaultEdge.class)
                        .addEdge("A", "B")
                        .addEdge("A", "C")
                        .addEdge("B", "D")
                        .addEdge("C", "D")
                        .build();

        // When
        final List<String> visitedNodes = new ArrayList<>();
        PostOrderGraphVisitor.visitGraphInPostOrder(graph, visitedNodes::add);

        // Then
        assertThat(visitedNodes, is(Arrays.asList("D", "B", "C", "A")));
    }
}
