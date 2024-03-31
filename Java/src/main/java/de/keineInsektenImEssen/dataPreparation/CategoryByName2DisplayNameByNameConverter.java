package de.keineInsektenImEssen.dataPreparation;

import java.util.Map;
import java.util.stream.Collectors;

class CategoryByName2DisplayNameByNameConverter {

    public static Map<String, String> categoryByName2DisplayNameByName(final Map<String, Category> categoryByName) {
        return categoryByName
                .entrySet()
                .stream()
                .collect(
                        Collectors.toMap(
                                Map.Entry::getKey,
                                nameCategoryEntry ->
                                        getDisplayName(
                                                nameCategoryEntry.getValue(),
                                                nameCategoryEntry.getKey())));
    }

    private static String getDisplayName(final Category category, final String defaultDisplayName) {
        return category.getNameByCountry().getOrDefault("en", defaultDisplayName);
    }
}
