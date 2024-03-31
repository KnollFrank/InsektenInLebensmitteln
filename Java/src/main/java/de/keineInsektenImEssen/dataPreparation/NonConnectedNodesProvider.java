package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.Sets;
import de.keineInsektenImEssen.common.Utils;
import org.jgrapht.Graph;
import org.jgrapht.traverse.BreadthFirstIterator;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

class NonConnectedNodesProvider {

    public static <V> Set<V> getNonConnectedNodes(final Graph<V, ?> graph, final Set<V> nodes) {
        return nodes
                .stream()
                .filter(node -> isLowestNonConnectedNode(graph, nodes, node))
                .collect(Collectors.toSet());
    }

    private static <V> boolean isLowestNonConnectedNode(final Graph<V, ?> graph, final Set<V> nodes, final V node) {
        return Collections.disjoint(
                getNodesOfSubtree(graph, node),
                Sets.difference(nodes, Collections.singleton(node)));
    }

    private static <V> Set<V> getNodesOfSubtree(final Graph<V, ?> graph, final V root) {
        return Utils
                .stream(new BreadthFirstIterator<>(graph, root))
                .collect(Collectors.toSet());
    }
}
