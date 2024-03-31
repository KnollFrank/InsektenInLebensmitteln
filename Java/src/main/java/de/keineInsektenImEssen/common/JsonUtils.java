package de.keineInsektenImEssen.common;

import com.google.gson.Gson;

import java.io.IOException;
import java.io.Reader;
import java.lang.reflect.Type;

public class JsonUtils {

    public static <T> T fromJson(final Reader json, final Type typeOfT) {
        try (final Reader _json = json) {
            return new Gson().fromJson(_json, typeOfT);
        } catch (final IOException e) {
            throw new RuntimeException(e);
        }
    }
}
