package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.Sets;
import de.keineInsektenImEssen.model.Product;
import de.keineInsektenImEssen.productsview.categoriesgraph.Node;
import de.keineInsektenImEssen.productsview.categoriesgraph.NodeDAO;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

public class Product2CategoryAssignmentTest {

    @Test
    public void shouldMoveProductsFromSrc2Dsts() {
        // Given
        final NodeDAO nodeDAO = new NodeDAO();
        final Node preparedSaladsNode = new Node("en:prepared-salads", nodeDAO);
        final Node sodas = new Node("en:sodas", nodeDAO);
        final Product preparedSaladsProduct = ProductTestFactory.createSomeProductHavingCategory(preparedSaladsNode.getName());
        preparedSaladsNode.addProduct(preparedSaladsProduct);

        assertThat(sodas.getProducts().isEmpty(), is(true));
        assertThat(preparedSaladsNode.getProducts(), is(Collections.singleton(preparedSaladsProduct)));

        // When
        Product2CategoryAssignment.moveProductsFromSrc2Dsts(preparedSaladsNode, Collections.singletonList(sodas));

        // Then
        assertThat(sodas.getProducts(), is(Collections.singleton(preparedSaladsProduct)));
        assertThat(preparedSaladsProduct.getCategoriesTags(), is(Collections.singleton(sodas.getName())));

        assertThat(preparedSaladsNode.getProducts().isEmpty(), is(true));
    }

    @Test
    public void shouldMoveProductsFromSmallCategoriesIntoParentCategories() {
        /*
              A                  A
           (a1 a2)          (a1, a2, b, c)
             / \      =>        / \
            B   C              B   C
           (b) (c)             ()  ()
         */
        // Given
        final NodeDAO nodeDAO = new NodeDAO();
        final Node A = new Node("A", nodeDAO);
        final Node B = new Node("B", nodeDAO);
        final Node C = new Node("C", nodeDAO);
        final Graph<Node, DefaultEdge> categoriesGraph =
                DefaultDirectedGraph
                        .<Node, DefaultEdge>createBuilder(DefaultEdge.class)
                        .addEdge(A, B)
                        .addEdge(A, C)
                        .build();

        final Product a1 = ProductTestFactory.createSomeProductHavingCategory(A.getName());
        final Product a2 = ProductTestFactory.createSomeProductHavingCategory(A.getName());
        A.addProduct(a1);
        A.addProduct(a2);

        final Product b = ProductTestFactory.createSomeProductHavingCategory(B.getName());
        B.addProduct(b);

        final Product c = ProductTestFactory.createSomeProductHavingCategory(C.getName());
        C.addProduct(c);

        // When
        Product2CategoryAssignment.moveProductsFromSmallCategoriesIntoParentCategories(categoriesGraph, 1);

        // Then
        assertThat(B.getProducts(), is(Collections.emptySet()));
        assertThat(C.getProducts(), is(Collections.emptySet()));

        assertThat(A.getProducts(), is(Sets.newHashSet(b, c, a1, a2)));
        assertThat(b.getCategoriesTags(), is(Collections.singleton(A.getName())));
        assertThat(c.getCategoriesTags(), is(Collections.singleton(A.getName())));
        assertThat(a1.getCategoriesTags(), is(Collections.singleton(A.getName())));
        assertThat(a2.getCategoriesTags(), is(Collections.singleton(A.getName())));
    }

    @Test
    public void shouldMoveProductsFromSmallCategoriesIntoParentCategories_diamond() {
        /*
              A                  A
             (a)           (a, b, c, d)
             / \                / \
            B   C     =>       B   C
           (b) (c)             ()  ()
            \ /                 \ /
             D                   D
            (d)                 ()
         */
        // Given
        final NodeDAO nodeDAO = new NodeDAO();
        final Node A = new Node("A", nodeDAO);
        final Node B = new Node("B", nodeDAO);
        final Node C = new Node("C", nodeDAO);
        final Node D = new Node("D", nodeDAO);
        final Graph<Node, DefaultEdge> categoriesGraph =
                DefaultDirectedGraph
                        .<Node, DefaultEdge>createBuilder(DefaultEdge.class)
                        .addEdge(A, B)
                        .addEdge(A, C)
                        .addEdge(B, D)
                        .addEdge(C, D)
                        .build();

        final Product a = ProductTestFactory.createSomeProductHavingCategory(A.getName());
        A.addProduct(a);

        final Product b = ProductTestFactory.createSomeProductHavingCategory(B.getName());
        B.addProduct(b);

        final Product c = ProductTestFactory.createSomeProductHavingCategory(C.getName());
        C.addProduct(c);

        final Product d = ProductTestFactory.createSomeProductHavingCategory(D.getName());
        D.addProduct(d);

        // When
        Product2CategoryAssignment.moveProductsFromSmallCategoriesIntoParentCategories(categoriesGraph, 2);

        // Then
        assertThat(B.getProducts(), is(Collections.emptySet()));
        assertThat(C.getProducts(), is(Collections.emptySet()));
        assertThat(D.getProducts(), is(Collections.emptySet()));

        assertThat(A.getProducts(), is(Sets.newHashSet(a, b, c, d)));
        assertThat(a.getCategoriesTags(), is(Collections.singleton(A.getName())));
        assertThat(b.getCategoriesTags(), is(Collections.singleton(A.getName())));
        assertThat(c.getCategoriesTags(), is(Collections.singleton(A.getName())));
        assertThat(d.getCategoriesTags(), is(Collections.singleton(A.getName())));
    }

    @Test
    public void shouldMoveProductsFromSmallCategoriesIntoParentOfParentCategories() {
        /*
             A                  A
             ()                (c)
             |                 |
             B       =>        B
             ()                ()
             |                 |
             C                 C
            (c)               ()
         */
        // Given
        final NodeDAO nodeDAO = new NodeDAO();
        final Node A = new Node("A", nodeDAO);
        final Node B = new Node("B", nodeDAO);
        final Node C = new Node("C", nodeDAO);
        final Graph<Node, DefaultEdge> categoriesGraph =
                DefaultDirectedGraph
                        .<Node, DefaultEdge>createBuilder(DefaultEdge.class)
                        .addEdge(A, B)
                        .addEdge(B, C)
                        .build();

        final Product c = ProductTestFactory.createSomeProductHavingCategory(C.getName());
        C.addProduct(c);

        // When
        Product2CategoryAssignment.moveProductsFromSmallCategoriesIntoParentCategories(categoriesGraph, 1);

        // Then
        assertThat(A.getProducts(), is(Sets.newHashSet(c)));
        assertThat(c.getCategoriesTags(), is(Collections.singleton(A.getName())));

        assertThat(B.getProducts(), is(Collections.emptySet()));
        assertThat(C.getProducts(), is(Collections.emptySet()));
    }

    @Test
    public void shouldMoveProductsFromSmallCategoriesIntoMultipleDirectParentCategories() {
        /*
                 R                R
                / \              /  \
               B   C           B     C
              (b)  (c)      (a, b) (a, c)
               \  /     =>      \   /
                A                 A
               (a)               ()
         */
        // Given
        final NodeDAO nodeDAO = new NodeDAO();
        final Node R = new Node("R", nodeDAO);
        final Node A = new Node("A", nodeDAO);
        final Node B = new Node("B", nodeDAO);
        final Node C = new Node("C", nodeDAO);
        final Graph<Node, DefaultEdge> categoriesGraph =
                DefaultDirectedGraph
                        .<Node, DefaultEdge>createBuilder(DefaultEdge.class)
                        .addEdge(R, B)
                        .addEdge(R, C)
                        .addEdge(B, A)
                        .addEdge(C, A)
                        .build();

        final Product a = ProductTestFactory.createSomeProductHavingCategory(A.getName());
        A.addProduct(a);

        final Product b = ProductTestFactory.createSomeProductHavingCategory(B.getName());
        B.addProduct(b);

        final Product c = ProductTestFactory.createSomeProductHavingCategory(C.getName());
        C.addProduct(c);

        // When
        Product2CategoryAssignment.moveProductsFromSmallCategoriesIntoParentCategories(categoriesGraph, 1);

        // Then
        assertThat(B.getProducts(), is(Sets.newHashSet(a, b)));
        assertThat(b.getCategoriesTags(), is(Sets.newHashSet(B.getName())));

        assertThat(C.getProducts(), is(Sets.newHashSet(a, c)));
        assertThat(c.getCategoriesTags(), is(Sets.newHashSet(C.getName())));
        assertThat(a.getCategoriesTags(), is(Sets.newHashSet(B.getName(), C.getName())));

        assertThat(A.getProducts(), is(Collections.emptySet()));
    }
}
