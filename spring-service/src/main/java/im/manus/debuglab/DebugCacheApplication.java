package im.manus.debuglab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

@SpringBootApplication
@EnableRedisHttpSession(redisNamespace = "debuglab:session", maxInactiveIntervalInSeconds = 1800)
public class DebugCacheApplication {
  public static void main(String[] args) {
    SpringApplication.run(DebugCacheApplication.class, args);
  }
}
