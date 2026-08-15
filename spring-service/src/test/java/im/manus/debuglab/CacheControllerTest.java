package im.manus.debuglab;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;

class CacheControllerTest {
  @Test
  void cachesAnArticleUnderTheExpectedRedisKey() throws Exception {
    StringRedisTemplate redis = mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked")
    ValueOperations<String, String> values = mock(ValueOperations.class);
    when(redis.opsForValue()).thenReturn(values);
    CacheController controller = new CacheController(redis, new ObjectMapper());

    var response = controller.cacheArticle(42L, new ObjectMapper().readTree("{\"id\":42,\"title\":\"Leak\"}"));

    assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
    verify(values).set(eq("debuglab:article:42"), contains("\"title\":\"Leak\""), eq(Duration.ofHours(12)));
  }
}
