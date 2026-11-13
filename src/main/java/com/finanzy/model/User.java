package com.finanzy.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String uuid;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String currency = "USD";

    @Column(nullable = false)
    private String themeMode = "dark"; // light, dark, system

    @Column(nullable = false)
    private String accentColor = "#6366f1"; // Dynamic hex color

    @Column(nullable = false)
    private Integer budgetRuleNeeds = 50;

    @Column(nullable = false)
    private Integer budgetRuleWants = 30;

    @Column(nullable = false)
    private Integer budgetRuleSavings = 20;

    @Column(nullable = false)
    private Long updatedAt = System.currentTimeMillis();

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUuid() { return uuid; }
    public void setUuid(String uuid) { this.uuid = uuid; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getThemeMode() { return themeMode; }
    public void setThemeMode(String themeMode) { this.themeMode = themeMode; }

    public String getAccentColor() { return accentColor; }
    public void setAccentColor(String accentColor) { this.accentColor = accentColor; }

    public Integer getBudgetRuleNeeds() { return budgetRuleNeeds; }
    public void setBudgetRuleNeeds(Integer budgetRuleNeeds) { this.budgetRuleNeeds = budgetRuleNeeds; }

    public Integer getBudgetRuleWants() { return budgetRuleWants; }
    public void setBudgetRuleWants(Integer budgetRuleWants) { this.budgetRuleWants = budgetRuleWants; }

    public Integer getBudgetRuleSavings() { return budgetRuleSavings; }
    public void setBudgetRuleSavings(Integer budgetRuleSavings) { this.budgetRuleSavings = budgetRuleSavings; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
