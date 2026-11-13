package com.finanzy.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String uuid;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // EXPENSE, INCOME

    @Column(nullable = false)
    private String icon = "tag";

    @Column(nullable = false)
    private String color = "#6366f1";

    @Column(nullable = false)
    private String budgetNeedType = "NEEDS"; // NEEDS, WANTS, SAVINGS (for 50/30/20 rule)

    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyBudget = BigDecimal.ZERO;

    private String parentUuid;

    @Column(nullable = false)
    private Boolean deleted = false;

    @Column(nullable = false)
    private Long updatedAt = System.currentTimeMillis();

    public Category() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUuid() { return uuid; }
    public void setUuid(String uuid) { this.uuid = uuid; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getBudgetNeedType() { return budgetNeedType; }
    public void setBudgetNeedType(String budgetNeedType) { this.budgetNeedType = budgetNeedType; }

    public BigDecimal getMonthlyBudget() { return monthlyBudget; }
    public void setMonthlyBudget(BigDecimal monthlyBudget) { this.monthlyBudget = monthlyBudget; }

    public String getParentUuid() { return parentUuid; }
    public void setParentUuid(String parentUuid) { this.parentUuid = parentUuid; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
