package de.keineInsektenImEssen.dataPreparation;

import com.google.gson.reflect.TypeToken;
import de.keineInsektenImEssen.common.JsonUtils;

import java.io.Reader;
import java.util.Map;

class CategoriesProvider {

    public Map<String, Category> getCategoryByName(final Reader reader) {
        return JsonUtils.fromJson(
                reader,
                new TypeToken<Map<String, Category>>() {
                }.getType());
    }
}
