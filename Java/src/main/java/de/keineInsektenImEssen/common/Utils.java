package de.keineInsektenImEssen.common;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Sets;
import io.vavr.control.Either;
import org.jgrapht.alg.util.Pair;

import javax.annotation.Nullable;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.*;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

public class Utils {

    public static <T> List<List<T>> getSublists(final List<T> lst, final int sizeOfEachSublist) {
        if (sizeOfEachSublist < 0) {
            throw new IllegalArgumentException("sizeOfEachSublist must be < 0");
        }
        final ImmutableList.Builder<List<T>> sublistsBuilder = ImmutableList.builder();
        for (int fromIndex = 0; fromIndex <= lst.size() - sizeOfEachSublist; fromIndex++) {
            sublistsBuilder.add(lst.subList(fromIndex, fromIndex + sizeOfEachSublist));
        }
        return sublistsBuilder.build();
    }

    // adapted from https://stackoverflow.com/questions/31963297/how-to-zip-two-java-lists
    public static <A, B> List<Pair<A, B>> zip(final List<A> as, final List<B> bs) {
        if (as.size() != bs.size()) {
            throw new IllegalArgumentException();
        }
        return IntStream.range(0, as.size())
                .mapToObj(i -> Pair.of(as.get(i), bs.get(i)))
                .collect(Collectors.toList());
    }

    public static <T> Set<T> union(final Collection<Set<T>> sets) {
        return union(sets.stream());
    }

    public static <T> Set<T> union(final Set<T>... sets) {
        return union(Stream.of(sets));
    }

    private static <T> Set<T> union(final Stream<Set<T>> streamOfSets) {
        return streamOfSets
                .flatMap(Set::stream)
                .collect(Collectors.toSet());
    }

    public static <T> List<T> concatenate(final List<List<T>> lists) {
        return lists
                .stream()
                .flatMap(Collection::stream)
                .collect(Collectors.toList());
    }

    public static <T> List<T> concatenate(final List<T>... lists) {
        return concatenate(Arrays.asList(lists));
    }

    public static void sleep(final int millis) {
        try {
            Thread.sleep(millis);
        } catch (final InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    public static <T> Set<T> null2EmptySet(final @Nullable Set<T> ts) {
        return ts == null ? Collections.emptySet() : ts;
    }

    public static <T> Stream<T> stream(final Iterator<T> iterator) {
        return StreamSupport.stream(
                Spliterators.spliteratorUnknownSize(iterator, 0),
                false);
    }

    public static <T> T getOnlyElement(final Collection<T> ts) {
        if (ts.size() != 1) {
            throw new IllegalArgumentException("" + ts);
        }
        return ts.stream().findFirst().get();
    }

    public static <T> Optional<T> getLastElement(final List<T> ts) {
        return ts.isEmpty() ? Optional.empty() : Optional.of(ts.get(ts.size() - 1));
    }

    public static <K, V> Map<K, V> getSubmap(final Map<K, V> map, final Set<K> keys) {
        return map
                .entrySet()
                .stream()
                .filter(entry -> keys.contains(entry.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    public static <T> Optional<T> getElementAtIndex(final List<T> elements, final int index) {
        final Optional<T> element = _getElementAtIndex(elements, index);
        return element.isPresent() ?
                element :
                _getElementAtIndex(elements, elements.size() + index);
    }

    private static <T> Optional<T> _getElementAtIndex(final List<T> elements, final int index) {
        return index >= 0 && index < elements.size() ?
                Optional.of(elements.get(index)) :
                Optional.empty();
    }

    public static <L, R> void consumeEitherLeftOrRight(
            final Either<L, R> either,
            final Consumer<? super L> leftConsumer,
            final Consumer<? super R> rightConsumer) {
        Objects.requireNonNull(leftConsumer, "leftConsumer is null");
        Objects.requireNonNull(rightConsumer, "rightConsumer is null");
        if (either.isRight()) {
            rightConsumer.accept(either.get());
        } else {
            leftConsumer.accept(either.getLeft());
        }
    }

    public static <T> Map<T, Integer> getPositionByElement(final List<T> elements) {
        return IntStream
                .range(0, elements.size())
                .boxed()
                .collect(
                        Collectors.toMap(
                                elements::get,
                                Function.identity()));
    }

    public static Set<String> commaSeparatedStrings2Set(final String commaSeparatedStrings) {
        return commaSeparatedStrings.isEmpty()
                ? Collections.emptySet()
                : Sets.newHashSet(commaSeparatedStrings.split(","));
    }

    public static String set2CommaSeparatedString(final Set<String> set) {
        return set
                .stream()
                .collect(Collectors.joining(", "));
    }

    public static boolean isValidUrl(final String urlString) {
        try {
            new URL(urlString);
            return true;
        } catch (final MalformedURLException e) {
            return false;
        }
    }

    public static URL getUrl(final String url) {
        try {
            return new URL(url);
        } catch (final MalformedURLException e) {
            throw new RuntimeException(e);
        }
    }

    public static int getValueOrZero(final Integer value) {
        return value != null ? value : 0;
    }

    public static float getValueOrZero(final Float value) {
        return value != null ? value : 0;
    }
}
