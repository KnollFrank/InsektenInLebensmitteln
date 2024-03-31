package de.keineInsektenImEssen.common;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

public class TestUtils {

    public static List<String> sort(final Collection<String> strs) {
        return strs.stream().sorted().collect(Collectors.toList());
    }
}
