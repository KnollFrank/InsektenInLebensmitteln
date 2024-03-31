package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Sets;
import org.junit.jupiter.api.Test;

import java.io.Reader;
import java.io.StringReader;
import java.util.Collections;
import java.util.Map;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

public class CategoriesProviderTest {

    @Test
    public void shouldGetCategoryByName() {
        shouldGetCategoryByName(
                """
                        {
                          "en:nutmeg": {
                            "name": {
                              "de": "Muskatnuss"
                            },
                            "dummy": {},
                            "children": [
                              "some child",
                              "en:whole-nutmeg"
                            ],
                            "parents": [
                              "en:spices"
                            ]
                          }
                        }""",
                ImmutableMap
                        .<String, Category>builder()
                        .put(
                                "en:nutmeg",
                                new Category(
                                        ImmutableMap
                                                .<String, String>builder()
                                                .put("de", "Muskatnuss")
                                                .build(),
                                        Sets.newHashSet("some child", "en:whole-nutmeg"),
                                        Collections.singleton("en:spices")))
                        .build());
    }

    @Test
    public void shouldGetCategoryByName_no_children() {
        shouldGetCategoryByName(
                """
                        {
                          "en:whole-nutmeg": {
                            "name": {
                              "de": "Muskat ganz"
                            },
                            "parents": [
                              "en:nutmeg"
                            ]
                          }
                        }
                        """,
                ImmutableMap
                        .<String, Category>builder()
                        .put(
                                "en:whole-nutmeg",
                                new Category(
                                        ImmutableMap
                                                .<String, String>builder()
                                                .put("de", "Muskat ganz")
                                                .build(),
                                        null,
                                        Collections.singleton("en:nutmeg")))
                        .build());
    }

    private static void shouldGetCategoryByName(
            final String json,
            final Map<String, Category> categoryByNameExpected) {
        // Given
        final Reader reader = new StringReader(json);
        final CategoriesProvider categoriesProvider = new CategoriesProvider();

        // When
        final Map<String, Category> categoryByName = categoriesProvider.getCategoryByName(reader);

        // Then
        assertThat(categoryByName, is(categoryByNameExpected));
    }
}
