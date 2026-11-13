package com.finanzy.controller;

import com.finanzy.model.User;
import com.finanzy.repository.UserRepository;
import com.finanzy.security.JwtService;
import com.finanzy.service.DataSeederService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final DataSeederService dataSeederService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            DataSeederService dataSeederService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.dataSeederService = dataSeederService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "Finanzy Spring Boot API");
        status.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(status);
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "Usuario Finanzy").trim();
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        String password = body.getOrDefault("password", "");
        String currency = body.getOrDefault("currency", "USD");
        String themeMode = body.getOrDefault("themeMode", "dark");
        String accentColor = body.getOrDefault("accentColor", "#6366f1");

        if (email.isEmpty() || password.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ingresa un correo válido y una contraseña de al menos 4 caracteres."));
        }

        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Este correo ya está registrado."));
        }

        User user = new User();
        user.setUuid(UUID.randomUUID().toString());
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setCurrency(currency);
        user.setThemeMode(themeMode);
        user.setAccentColor(accentColor);
        user = userRepository.save(user);

        // Seed default categories and accounts for new user
        dataSeederService.seedDefaultDataForUser(user.getId(), currency, false);

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(buildAuthResponse(user, token));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        String password = body.getOrDefault("password", "");

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty() || !passwordEncoder.matches(password, userOpt.get().getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "Credenciales incorrectas. Verifica tu correo y contraseña."));
        }

        User user = userOpt.get();
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(buildAuthResponse(user, token));
    }

    @PutMapping("/user/preferences")
    public ResponseEntity<?> updatePreferences(Authentication auth, @RequestBody Map<String, Object> body) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        Long userId = (Long) auth.getPrincipal();
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (body.containsKey("name")) user.setName(String.valueOf(body.get("name")));
        if (body.containsKey("currency")) user.setCurrency(String.valueOf(body.get("currency")));
        if (body.containsKey("themeMode")) user.setThemeMode(String.valueOf(body.get("themeMode")));
        if (body.containsKey("accentColor")) user.setAccentColor(String.valueOf(body.get("accentColor")));
        if (body.containsKey("budgetRuleNeeds")) user.setBudgetRuleNeeds(((Number) body.get("budgetRuleNeeds")).intValue());
        if (body.containsKey("budgetRuleWants")) user.setBudgetRuleWants(((Number) body.get("budgetRuleWants")).intValue());
        if (body.containsKey("budgetRuleSavings")) user.setBudgetRuleSavings(((Number) body.get("budgetRuleSavings")).intValue());
        user.setUpdatedAt(System.currentTimeMillis());

        userRepository.save(user);
        return ResponseEntity.ok(buildUserMap(user));
    }

    private Map<String, Object> buildAuthResponse(User user, String token) {
        Map<String, Object> res = new HashMap<>();
        res.put("token", token);
        res.put("user", buildUserMap(user));
        return res;
    }

    public static Map<String, Object> buildUserMap(User user) {
        Map<String, Object> u = new HashMap<>();
        u.put("id", user.getId());
        u.put("uuid", user.getUuid());
        u.put("name", user.getName());
        u.put("email", user.getEmail());
        u.put("currency", user.getCurrency());
        u.put("themeMode", user.getThemeMode());
        u.put("accentColor", user.getAccentColor());
        u.put("budgetRuleNeeds", user.getBudgetRuleNeeds());
        u.put("budgetRuleWants", user.getBudgetRuleWants());
        u.put("budgetRuleSavings", user.getBudgetRuleSavings());
        u.put("updatedAt", user.getUpdatedAt());
        return u;
    }
}
