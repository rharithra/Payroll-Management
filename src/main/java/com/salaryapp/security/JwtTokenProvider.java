package com.salaryapp.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.DecodingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {
    private final Key key;
    private final long validityMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:dev-secret-1234567890}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long validityMs
    ) {
        byte[] raw;
        try {
            raw = Decoders.BASE64.decode(secret);
        } catch (DecodingException | IllegalArgumentException e) {
            raw = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
        this.key = Keys.hmacShaKeyFor(raw);
        this.validityMs = validityMs;
    }

    public String createToken(String username, String role) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + validityMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }
}
