package de.keineInsektenImEssen.dataPreparation;

import org.jgrapht.Graph;

class GraphHelper {

    public static <V, E> boolean equalsGraphs(final Graph<V, E> graph1, final Graph<V, E> graph2) {
        if (graph1 == graph2) {
            return true;
        }
        if ((graph2 == null) || (graph1.getClass() != graph2.getClass())) {
            return false;
        }

        if (!graph1.vertexSet().equals(graph2.vertexSet())) {
            return false;
        }
        if (graph1.edgeSet().size() != graph2.edgeSet().size()) {
            return false;
        }

        final boolean isDirected = graph1.getType().isDirected();
        for (final E e : graph1.edgeSet()) {
            final V source = graph1.getEdgeSource(e);
            final V target = graph1.getEdgeTarget(e);

            if (!graph2.containsEdge(e)) {
                // return false;
            }

            final V gSource = graph2.getEdgeSource(e);
            final V gTarget = graph2.getEdgeTarget(e);

            if (isDirected) {
                if (!gSource.equals(source) || !gTarget.equals(target)) {
                    return false;
                }
            } else {
                if ((!gSource.equals(source) || !gTarget.equals(target))
                        && (!gSource.equals(target) || !gTarget.equals(source))) {
                    return false;
                }
            }

            if (Double.compare(graph1.getEdgeWeight(e), graph2.getEdgeWeight(e)) != 0) {
                return false;
            }
        }

        return true;
    }
}
