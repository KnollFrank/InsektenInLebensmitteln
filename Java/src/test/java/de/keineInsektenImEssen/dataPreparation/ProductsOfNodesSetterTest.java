package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.Sets;
import de.keineInsektenImEssen.model.Product;
import de.keineInsektenImEssen.productsview.categoriesgraph.Node;
import de.keineInsektenImEssen.productsview.categoriesgraph.NodeDAO;
import de.keineInsektenImEssen.productsview.categoriesgraph.ProductsOfNodesSetter;
import org.junit.jupiter.api.Test;

import java.util.Collections;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

public class ProductsOfNodesSetterTest {

    @Test
    public void shouldSetProductsOfNodes() {
        // Given
        final NodeDAO nodeDAO = new NodeDAO();
        final Node preparedSaladsNode = new Node("en:prepared-salads", nodeDAO);
        final Node sodas = new Node("en:sodas", nodeDAO);
        final Product preparedSaladsProduct = ProductTestFactory.createSomeProductHavingCategory(preparedSaladsNode.getName());

        // When
        ProductsOfNodesSetter.setProductsOfNodes(
                Sets.newHashSet(preparedSaladsProduct),
                Sets.newHashSet(preparedSaladsNode, sodas),
                new Node("Groceries", nodeDAO));

        // Then
        assertThat(preparedSaladsNode.getProducts(), is(Collections.singleton(preparedSaladsProduct)));
        assertThat(sodas.getProducts().isEmpty(), is(true));
    }

    @Test
    public void shouldSetProductsOfNodes_noCategories() {
        // Given
        final NodeDAO nodeDAO = new NodeDAO();
        final Node defaultNode = new Node("Groceries", nodeDAO);
        final Product productHavingNoCategory = ProductTestFactory.createSomeProductHavingCategories(Sets.newHashSet());

        // When
        ProductsOfNodesSetter.setProductsOfNodes(
                Sets.newHashSet(productHavingNoCategory),
                Sets.newHashSet(),
                defaultNode);

        // Then
        assertThat(defaultNode.getProducts(), is(Collections.singleton(productHavingNoCategory)));
    }
}
