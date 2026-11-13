package com.finanzy.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String uuid;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String accountUuid;

    private String toAccountUuid; // Used when type == TRANSFER

    private String categoryUuid;

    @Column(nullable = false)
    private String type; // EXPENSE, INCOME, TRANSFER

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(nullable = false)
    private String description;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private String date; // ISO date YYYY-MM-DD

    private String tags; // Comma-separated tags e.g. "viaje,familia,urgente"

    private String paymentMethod; // Efectivo, Tarjeta Débito, Tarjeta Crédito, Transferencia, QR/Billetera

    private String merchant; // Store / place name

    @Column(columnDefinition = "TEXT")
    private String receiptDataUrl; // Optional base64 compressed receipt photo

    @Column(columnDefinition = "TEXT")
    private String customFieldsJson; // JSON object of user-defined custom fields

    @Column(nullable = false)
    private Boolean deleted = false;

    @Column(nullable = false)
    private Long updatedAt = System.currentTimeMillis();

    public Transaction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUuid() { return uuid; }
    public void setUuid(String uuid) { this.uuid = uuid; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getAccountUuid() { return accountUuid; }
    public void setAccountUuid(String accountUuid) { this.accountUuid = accountUuid; }

    public String getToAccountUuid() { return toAccountUuid; }
    public void setToAccountUuid(String toAccountUuid) { this.toAccountUuid = toAccountUuid; }

    public String getCategoryUuid() { return categoryUuid; }
    public void setCategoryUuid(String categoryUuid) { this.categoryUuid = categoryUuid; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }

    public String getReceiptDataUrl() { return receiptDataUrl; }
    public void setReceiptDataUrl(String receiptDataUrl) { this.receiptDataUrl = receiptDataUrl; }

    public String getCustomFieldsJson() { return customFieldsJson; }
    public void setCustomFieldsJson(String customFieldsJson) { this.customFieldsJson = customFieldsJson; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
