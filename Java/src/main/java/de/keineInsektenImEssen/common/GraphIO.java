package de.keineInsektenImEssen.common;

import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.nio.dot.DOTExporter;
import org.jgrapht.nio.json.JSONExporter;
import org.jgrapht.nio.json.JSONImporter;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.function.Function;

public class GraphIO {

    public static <V> void persistJsonGraph(
            final Graph<V, DefaultEdge> graph,
            final Function<V, String> vertexIdProvider,
            final File file) {

        new JSONExporter<V, DefaultEdge>(vertexIdProvider).exportGraph(graph, file);
    }

    public static <V> void persistDotGraph(
            final Graph<V, DefaultEdge> graph,
            final Function<V, String> vertexIdProvider,
            final File file) {

        new DOTExporter<V, DefaultEdge>(vertexIdProvider).exportGraph(graph, file);
    }

    public static <V> Graph<V, DefaultEdge> loadJsonGraph(final Function<String, V> vertexFactory, final File file) {
        final Graph<V, DefaultEdge> graph = new DefaultDirectedGraph<>(DefaultEdge.class);
        createJSONImporter(vertexFactory).importGraph(graph, file);
        return graph;
    }

    public static <V> Graph<V, DefaultEdge> loadJsonGraph(final Function<String, V> vertexFactory, final InputStream inputStream) {
        try (final InputStream _inputStream = inputStream) {
            final Graph<V, DefaultEdge> graph = new DefaultDirectedGraph<>(DefaultEdge.class);
            createJSONImporter(vertexFactory).importGraph(graph, _inputStream);
            return graph;
        } catch (final IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static <V> JSONImporter<V, DefaultEdge> createJSONImporter(final Function<String, V> vertexFactory) {
        final JSONImporter<V, DefaultEdge> jsonImporter = new JSONImporter<>();
        jsonImporter.setVertexFactory(vertexFactory);
        return jsonImporter;
    }
}
