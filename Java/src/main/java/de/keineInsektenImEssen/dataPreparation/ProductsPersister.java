package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.Sets;
import de.keineInsektenImEssen.common.Utils;
import de.keineInsektenImEssen.model.IProduct;
import de.keineInsektenImEssen.model.Products;
import de.keineInsektenImEssen.productsview.categoriesgraph.Graph;
import de.keineInsektenImEssen.productsview.categoriesgraph.Node;
import de.keineInsektenImEssen.productsview.categoriesgraph.NodeAttributes;
import org.jgrapht.Graphs;
import org.jgrapht.graph.DefaultEdge;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

import static de.keineInsektenImEssen.common.FileUtils.persistAsJson;
import static de.keineInsektenImEssen.common.GraphIO.persistJsonGraph;
import static de.keineInsektenImEssen.common.Utils.getSubmap;
import static de.keineInsektenImEssen.dataPreparation.CategoryByName2DisplayNameByNameConverter.categoryByName2DisplayNameByName;
import static de.keineInsektenImEssen.dataPreparation.EmptyCategoriesRemover.removeEmptyCategories;
import static de.keineInsektenImEssen.dataPreparation.Nodes.names2Nodes;
import static de.keineInsektenImEssen.dataPreparation.Product2CategoryAssignment.moveProductsFromSmallCategoriesIntoParentCategories;
import static de.keineInsektenImEssen.dataPreparation.ProductWithNonConnectedCategoriesConverter.asProductsWithNonConnectedCategories;
import static de.keineInsektenImEssen.productsview.categoriesgraph.ProductsOfNodesSetter.setProductsOfNodes;
import static org.apache.commons.io.FileUtils.copyFileToDirectory;

class ProductsPersister {

    public static boolean persistProducts(
            final List<Product> products4Country,
            final Map<String, Category> categoryByName,
            final int maxNumberOfProductsInSmallCategory,
            final File destDir,
            final Path tmpDir) throws IOException {
        final Graph<Node, DefaultEdge, NodeAttributes> categoriesGraph = CategoryByName2GraphConverter.categoryByName2Graph(categoryByName);
        final Set<Node> categoriesOfProductsNodes = names2Nodes(Products.getCategories(products4Country), categoriesGraph.nodeAttributesDAO);
        addUnknownCategories(categoriesGraph, categoriesOfProductsNodes);
        addAbsoluteRootNode(categoriesGraph);
        final List<Product> productsWithNonConnectedCategoriesHavingImages =
                getProductsHavingImages(
                        asProductsWithNonConnectedCategories(
                                products4Country,
                                categoriesGraph));
        if (productsWithNonConnectedCategoriesHavingImages.isEmpty()) {
            return false;
        }
        setProductsOfNodes(
                new HashSet<>(productsWithNonConnectedCategoriesHavingImages),
                categoriesGraph.graph.vertexSet(),
                de.keineInsektenImEssen.productsview.categoriesgraph.Graphs.getRootNode(categoriesGraph.graph));
        moveProductsFromSmallCategoriesIntoParentCategories(categoriesGraph.graph, maxNumberOfProductsInSmallCategory);
        removeEmptyCategories(categoriesGraph.graph);
        addAbsoluteRootNode(categoriesGraph);
        persistDisplayNameByNameFile(categoryByName, categoriesGraph, destDir, tmpDir);
        persistAsProductsJsonFile(new ArrayList<>(getProducts(categoriesGraph.graph)), destDir, tmpDir);
        persistCategoriesGraphFile(categoriesGraph, destDir, tmpDir);
        return true;
    }

    private static void persistAsProductsJsonFile(final List<IProduct> products,
                                                  final File destDir,
                                                  final Path tmpDir) throws IOException {
        final File productsJsonFile = tmpDir.resolve("products.json").toFile();
        persistAsJson(products, productsJsonFile);
        // FK-TODO: die Datei "products.json" soll sich die Web-Anwendung von hier selbst abholen, denn die Android-App darf der Web-Anwendung keine Dateien heimlich unterschieben.
        copyFileToDirectory(productsJsonFile, destDir);
    }

    private static Node addAbsoluteRootNode(final Graph<Node, DefaultEdge, NodeAttributes> categoriesGraph) {
        return de.keineInsektenImEssen.productsview.categoriesgraph.Graphs.addAbsoluteRootNode(
                categoriesGraph.graph,
                () -> new Node("Groceries", categoriesGraph.nodeAttributesDAO));
    }

    private static void persistDisplayNameByNameFile(
            final Map<String, Category> categoryByName,
            final Graph<Node, DefaultEdge, NodeAttributes> categoriesGraph,
            final File destDir,
            final Path tmpDir) throws IOException {
        final File displayNameByNameFile = tmpDir.resolve("displayNameByName.json").toFile();
        persistAsJson(
                getDisplayNameByName(categoryByName, categoriesGraph.graph),
                displayNameByNameFile);
        // FK-TODO: die Datei displayNameByNameFile soll sich die Web-Anwendung von hier selbst abholen, denn die Android-App darf der Web-Anwendung keine Dateien heimlich unterschieben.
        copyFileToDirectory(displayNameByNameFile, destDir);
    }

    private static void persistCategoriesGraphFile(
            final Graph<Node, DefaultEdge, NodeAttributes> categoriesGraph,
            final File destDir,
            final Path tmpDir) throws IOException {
        final File categoriesGraphFile = tmpDir.resolve("categoriesGraph.json").toFile();
        persistJsonGraph(categoriesGraph.graph, Node::getName, categoriesGraphFile);
        copyFileToDirectory(categoriesGraphFile, destDir);
    }

    private static List<Product> getProductsHavingImages(final List<Product> products) {
        return products
                .stream()
                .filter(product -> Utils.isValidUrl(product.image_url))
                .collect(Collectors.toList());
    }

    private static void addUnknownCategories(final Graph<Node, DefaultEdge, NodeAttributes> categoriesGraph,
                                             final Set<Node> categories) {
        final Set<Node> unknownCategories = Sets.difference(categories, categoriesGraph.graph.vertexSet());
        final Node unknownCategory = new Node("Miscellaneous", categoriesGraph.nodeAttributesDAO);
        Graphs.addOutgoingEdges(categoriesGraph.graph, unknownCategory, unknownCategories);
    }

    private static Map<String, String> getDisplayNameByName(
            final Map<String, Category> categoryByName,
            final org.jgrapht.Graph<Node, DefaultEdge> graph) {
        return getSubmap(
                categoryByName2DisplayNameByName(categoryByName),
                getCategories(graph));
    }

    private static Set<String> getCategories(final org.jgrapht.Graph<Node, DefaultEdge> graph) {
        return graph
                .vertexSet()
                .stream()
                .map(Node::getName)
                .collect(Collectors.toSet());
    }

    private static Set<IProduct> getProducts(final org.jgrapht.Graph<Node, DefaultEdge> graph) {
        return graph
                .vertexSet()
                .stream()
                .flatMap(node -> node.getProducts().stream())
                .collect(Collectors.toSet());
    }
}
