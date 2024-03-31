package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.ImmutableSet;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

public class NonConnectedNodesProviderTest {

    @Test
    public void shouldGetNonConnectedNodes() {
        // Given
        final Graph<String, DefaultEdge> graph =
                DefaultDirectedGraph
                        .<String, DefaultEdge>createBuilder(DefaultEdge.class)
                        .addEdge("rootNode", "X")
                        .addEdge("rootNode", "Y")
                        .addEdge("X", "A")
                        .addEdge("A", "B")
                        .addEdge("A", "C")
                        .addEdge("C", "D")
                        .build();

        // When
        final Set<String> nonConnectedNodes =
                NonConnectedNodesProvider.getNonConnectedNodes(
                        graph,
                        ImmutableSet.of("X", "A", "B", "C", "Y"));

        // Then
        assertThat(nonConnectedNodes, is(ImmutableSet.of("B", "C", "Y")));
    }
}
