package im.manus.debuglab;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal")
public class CacheController {
  private static final String ARTICLE_PREFIX = "debuglab:article:";
  private final StringRedisTemplate redis;
  private final ObjectMapper objectMapper;

  public CacheController(StringRedisTemplate redis, ObjectMapper objectMapper) {
    this.redis = redis;
    this.objectMapper = objectMapper;
  }

  @GetMapping("/cache/articles/{articleId}")
  public ResponseEntity<JsonNode> getArticle(@PathVariable long articleId) throws JsonProcessingException {
    String value = redis.opsForValue().get(articleKey(articleId));
    return value == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(objectMapper.readTree(value));
  }

  @PutMapping("/cache/articles/{articleId}")
  public ResponseEntity<Void> cacheArticle(@PathVariable long articleId, @RequestBody JsonNode article) throws JsonProcessingException {
    redis.opsForValue().set(articleKey(articleId), objectMapper.writeValueAsString(article), Duration.ofHours(12));
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/cache/articles/{articleId}")
  public ResponseEntity<Void> evictArticle(@PathVariable long articleId) {
    redis.delete(articleKey(articleId));
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/cache/status")
  public ResponseEntity<Map<String, Object>> status() {
    Map<String, Object> status = new LinkedHashMap<>();
    status.put("checkedAt", Instant.now().toString());
    status.put("provider", "spring-boot-lettuce");
    try {
      String pong = redis.execute((RedisCallback<String>) connection -> connection.ping());
      status.put("connected", "PONG".equalsIgnoreCase(pong));
      status.put("articleEntries", countKeys(ARTICLE_PREFIX + "*"));
      status.put("sessionEntries", countKeys("debuglab:session:sessions:*") );
      return ResponseEntity.ok(status);
    } catch (DataAccessException exception) {
      status.put("connected", false);
      status.put("articleEntries", 0);
      status.put("sessionEntries", 0);
      status.put("message", "Redis connection is unavailable.");
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(status);
    }
  }

  @PostMapping("/cache/flush")
  public ResponseEntity<Map<String, Object>> flushArticleCache() {
    int deleted = 0;
    try (Cursor<byte[]> cursor = redis.getConnectionFactory().getConnection().scan(
      ScanOptions.scanOptions().match(ARTICLE_PREFIX + "*").count(200).build())) {
      while (cursor.hasNext()) {
        redis.delete(new String(cursor.next()));
        deleted++;
      }
    }
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("deleted", deleted);
    result.put("status", status().getBody());
    return ResponseEntity.ok(result);
  }

  @PostMapping("/session/heartbeat")
  public Map<String, Object> sessionHeartbeat(@RequestBody(required = false) Map<String, String> payload, HttpSession session) {
    session.setAttribute("lastGatewayActor", payload == null ? "anonymous" : payload.getOrDefault("actor", "anonymous"));
    return Map.of("sessionId", session.getId(), "lastAccessedAt", Instant.now().toString());
  }

  private String articleKey(long articleId) {
    return ARTICLE_PREFIX + articleId;
  }

  private int countKeys(String pattern) {
    int count = 0;
    try (Cursor<byte[]> cursor = redis.getConnectionFactory().getConnection().scan(
      ScanOptions.scanOptions().match(pattern).count(200).build())) {
      while (cursor.hasNext()) {
        cursor.next();
        count++;
      }
    }
    return count;
  }
}
