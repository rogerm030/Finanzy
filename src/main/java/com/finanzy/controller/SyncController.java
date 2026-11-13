package com.finanzy.controller;

import com.finanzy.model.*;
import com.finanzy.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final RecurringRuleRepository recurringRuleRepository;

    public SyncController(
            UserRepository userRepository,
            AccountRepository accountRepository,
            CategoryRepository categoryRepository,
            TransactionRepository transactionRepository,
            SavingsGoalRepository savingsGoalRepository,
            DebtRecordRepository debtRecordRepository,
            RecurringRuleRepository recurringRuleRepository
    ) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.savingsGoalRepository = savingsGoalRepository;
        this.debtRecordRepository = debtRecordRepository;
        this.recurringRuleRepository = recurringRuleRepository;
    }

    public static class SyncPayload {
        public List<Account> accounts;
        public List<Category> categories;
        public List<Transaction> transactions;
        public List<SavingsGoal> goals;
        public List<DebtRecord> debts;
        public List<RecurringRule> recurringRules;
        public Map<String, Object> preferences;
    }

    @GetMapping
    public ResponseEntity<?> pullAll(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(buildFullState(userId));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> syncBidirectional(Authentication auth, @RequestBody SyncPayload payload) {
        if (auth == null || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        Long userId = (Long) auth.getPrincipal();

        // 1. Update User Preferences if provided
        if (payload.preferences != null) {
            userRepository.findById(userId).ifPresent(user -> {
                Map<String, Object> p = payload.preferences;
                if (p.containsKey("name") && p.get("name") != null) user.setName(String.valueOf(p.get("name")));
                if (p.containsKey("currency") && p.get("currency") != null) user.setCurrency(String.valueOf(p.get("currency")));
                if (p.containsKey("themeMode") && p.get("themeMode") != null) user.setThemeMode(String.valueOf(p.get("themeMode")));
                if (p.containsKey("accentColor") && p.get("accentColor") != null) user.setAccentColor(String.valueOf(p.get("accentColor")));
                if (p.containsKey("budgetRuleNeeds") && p.get("budgetRuleNeeds") instanceof Number n) user.setBudgetRuleNeeds(n.intValue());
                if (p.containsKey("budgetRuleWants") && p.get("budgetRuleWants") instanceof Number n) user.setBudgetRuleWants(n.intValue());
                if (p.containsKey("budgetRuleSavings") && p.get("budgetRuleSavings") instanceof Number n) user.setBudgetRuleSavings(n.intValue());
                user.setUpdatedAt(System.currentTimeMillis());
                userRepository.save(user);
            });
        }

        // 2. Merge Accounts
        if (payload.accounts != null) {
            for (Account incoming : payload.accounts) {
                if (incoming.getUuid() == null) continue;
                Optional<Account> existingOpt = accountRepository.findByUuidAndUserId(incoming.getUuid(), userId);
                if (existingOpt.isEmpty()) {
                    incoming.setId(null);
                    incoming.setUserId(userId);
                    if (incoming.getUpdatedAt() == null) incoming.setUpdatedAt(System.currentTimeMillis());
                    accountRepository.save(incoming);
                } else {
                    Account existing = existingOpt.get();
                    long inTime = incoming.getUpdatedAt() != null ? incoming.getUpdatedAt() : System.currentTimeMillis();
                    if (inTime >= existing.getUpdatedAt()) {
                        existing.setName(incoming.getName());
                        existing.setType(incoming.getType());
                        existing.setBalance(incoming.getBalance() != null ? incoming.getBalance() : BigDecimal.ZERO);
                        existing.setInitialBalance(incoming.getInitialBalance() != null ? incoming.getInitialBalance() : BigDecimal.ZERO);
                        existing.setCurrency(incoming.getCurrency() != null ? incoming.getCurrency() : "USD");
                        existing.setColor(incoming.getColor() != null ? incoming.getColor() : "#10b981");
                        existing.setIcon(incoming.getIcon() != null ? incoming.getIcon() : "wallet");
                        existing.setCreditLimit(incoming.getCreditLimit());
                        existing.setCutoffDay(incoming.getCutoffDay());
                        existing.setPaymentDay(incoming.getPaymentDay());
                        existing.setIncludeInNetWorth(incoming.getIncludeInNetWorth() != null ? incoming.getIncludeInNetWorth() : true);
                        existing.setDeleted(incoming.getDeleted() != null ? incoming.getDeleted() : false);
                        existing.setUpdatedAt(inTime);
                        accountRepository.save(existing);
                    }
                }
            }
        }

        // 3. Merge Categories
        if (payload.categories != null) {
            for (Category incoming : payload.categories) {
                if (incoming.getUuid() == null) continue;
                Optional<Category> existingOpt = categoryRepository.findByUuidAndUserId(incoming.getUuid(), userId);
                if (existingOpt.isEmpty()) {
                    incoming.setId(null);
                    incoming.setUserId(userId);
                    if (incoming.getUpdatedAt() == null) incoming.setUpdatedAt(System.currentTimeMillis());
                    categoryRepository.save(incoming);
                } else {
                    Category existing = existingOpt.get();
                    long inTime = incoming.getUpdatedAt() != null ? incoming.getUpdatedAt() : System.currentTimeMillis();
                    if (inTime >= existing.getUpdatedAt()) {
                        existing.setName(incoming.getName());
                        existing.setType(incoming.getType());
                        existing.setIcon(incoming.getIcon() != null ? incoming.getIcon() : "tag");
                        existing.setColor(incoming.getColor() != null ? incoming.getColor() : "#6366f1");
                        existing.setBudgetNeedType(incoming.getBudgetNeedType() != null ? incoming.getBudgetNeedType() : "NEEDS");
                        existing.setMonthlyBudget(incoming.getMonthlyBudget() != null ? incoming.getMonthlyBudget() : BigDecimal.ZERO);
                        existing.setParentUuid(incoming.getParentUuid());
                        existing.setDeleted(incoming.getDeleted() != null ? incoming.getDeleted() : false);
                        existing.setUpdatedAt(inTime);
                        categoryRepository.save(existing);
                    }
                }
            }
        }

        // 4. Merge Transactions
        if (payload.transactions != null) {
            for (Transaction incoming : payload.transactions) {
                if (incoming.getUuid() == null) continue;
                Optional<Transaction> existingOpt = transactionRepository.findByUuidAndUserId(incoming.getUuid(), userId);
                if (existingOpt.isEmpty()) {
                    incoming.setId(null);
                    incoming.setUserId(userId);
                    if (incoming.getUpdatedAt() == null) incoming.setUpdatedAt(System.currentTimeMillis());
                    transactionRepository.save(incoming);
                } else {
                    Transaction existing = existingOpt.get();
                    long inTime = incoming.getUpdatedAt() != null ? incoming.getUpdatedAt() : System.currentTimeMillis();
                    if (inTime >= existing.getUpdatedAt()) {
                        existing.setAccountUuid(incoming.getAccountUuid());
                        existing.setToAccountUuid(incoming.getToAccountUuid());
                        existing.setCategoryUuid(incoming.getCategoryUuid());
                        existing.setType(incoming.getType());
                        existing.setAmount(incoming.getAmount() != null ? incoming.getAmount() : BigDecimal.ZERO);
                        existing.setDescription(incoming.getDescription());
                        existing.setNotes(incoming.getNotes());
                        existing.setDate(incoming.getDate());
                        existing.setTags(incoming.getTags());
                        existing.setPaymentMethod(incoming.getPaymentMethod());
                        existing.setMerchant(incoming.getMerchant());
                        existing.setReceiptDataUrl(incoming.getReceiptDataUrl());
                        existing.setCustomFieldsJson(incoming.getCustomFieldsJson());
                        existing.setDeleted(incoming.getDeleted() != null ? incoming.getDeleted() : false);
                        existing.setUpdatedAt(inTime);
                        transactionRepository.save(existing);
                    }
                }
            }
        }

        // 5. Merge Savings Goals
        if (payload.goals != null) {
            for (SavingsGoal incoming : payload.goals) {
                if (incoming.getUuid() == null) continue;
                Optional<SavingsGoal> existingOpt = savingsGoalRepository.findByUuidAndUserId(incoming.getUuid(), userId);
                if (existingOpt.isEmpty()) {
                    incoming.setId(null);
                    incoming.setUserId(userId);
                    if (incoming.getUpdatedAt() == null) incoming.setUpdatedAt(System.currentTimeMillis());
                    savingsGoalRepository.save(incoming);
                } else {
                    SavingsGoal existing = existingOpt.get();
                    long inTime = incoming.getUpdatedAt() != null ? incoming.getUpdatedAt() : System.currentTimeMillis();
                    if (inTime >= existing.getUpdatedAt()) {
                        existing.setName(incoming.getName());
                        existing.setTargetAmount(incoming.getTargetAmount() != null ? incoming.getTargetAmount() : BigDecimal.ZERO);
                        existing.setCurrentAmount(incoming.getCurrentAmount() != null ? incoming.getCurrentAmount() : BigDecimal.ZERO);
                        existing.setDeadline(incoming.getDeadline());
                        existing.setIcon(incoming.getIcon() != null ? incoming.getIcon() : "target");
                        existing.setColor(incoming.getColor() != null ? incoming.getColor() : "#10b981");
                        existing.setDeleted(incoming.getDeleted() != null ? incoming.getDeleted() : false);
                        existing.setUpdatedAt(inTime);
                        savingsGoalRepository.save(existing);
                    }
                }
            }
        }

        // 6. Merge Debt Records
        if (payload.debts != null) {
            for (DebtRecord incoming : payload.debts) {
                if (incoming.getUuid() == null) continue;
                Optional<DebtRecord> existingOpt = debtRecordRepository.findByUuidAndUserId(incoming.getUuid(), userId);
                if (existingOpt.isEmpty()) {
                    incoming.setId(null);
                    incoming.setUserId(userId);
                    if (incoming.getUpdatedAt() == null) incoming.setUpdatedAt(System.currentTimeMillis());
                    debtRecordRepository.save(incoming);
                } else {
                    DebtRecord existing = existingOpt.get();
                    long inTime = incoming.getUpdatedAt() != null ? incoming.getUpdatedAt() : System.currentTimeMillis();
                    if (inTime >= existing.getUpdatedAt()) {
                        existing.setPersonName(incoming.getPersonName());
                        existing.setType(incoming.getType());
                        existing.setTotalAmount(incoming.getTotalAmount() != null ? incoming.getTotalAmount() : BigDecimal.ZERO);
                        existing.setPaidAmount(incoming.getPaidAmount() != null ? incoming.getPaidAmount() : BigDecimal.ZERO);
                        existing.setDueDate(incoming.getDueDate());
                        existing.setNotes(incoming.getNotes());
                        existing.setColor(incoming.getColor() != null ? incoming.getColor() : "#f59e0b");
                        existing.setDeleted(incoming.getDeleted() != null ? incoming.getDeleted() : false);
                        existing.setUpdatedAt(inTime);
                        debtRecordRepository.save(existing);
                    }
                }
            }
        }

        // 7. Merge Recurring Rules
        if (payload.recurringRules != null) {
            for (RecurringRule incoming : payload.recurringRules) {
                if (incoming.getUuid() == null) continue;
                Optional<RecurringRule> existingOpt = recurringRuleRepository.findByUuidAndUserId(incoming.getUuid(), userId);
                if (existingOpt.isEmpty()) {
                    incoming.setId(null);
                    incoming.setUserId(userId);
                    if (incoming.getUpdatedAt() == null) incoming.setUpdatedAt(System.currentTimeMillis());
                    recurringRuleRepository.save(incoming);
                } else {
                    RecurringRule existing = existingOpt.get();
                    long inTime = incoming.getUpdatedAt() != null ? incoming.getUpdatedAt() : System.currentTimeMillis();
                    if (inTime >= existing.getUpdatedAt()) {
                        existing.setTitle(incoming.getTitle());
                        existing.setType(incoming.getType());
                        existing.setAmount(incoming.getAmount() != null ? incoming.getAmount() : BigDecimal.ZERO);
                        existing.setAccountUuid(incoming.getAccountUuid());
                        existing.setCategoryUuid(incoming.getCategoryUuid());
                        existing.setFrequency(incoming.getFrequency());
                        existing.setNextDueDate(incoming.getNextDueDate());
                        existing.setAutoCreate(incoming.getAutoCreate() != null ? incoming.getAutoCreate() : true);
                        existing.setActive(incoming.getActive() != null ? incoming.getActive() : true);
                        existing.setDeleted(incoming.getDeleted() != null ? incoming.getDeleted() : false);
                        existing.setUpdatedAt(inTime);
                        recurringRuleRepository.save(existing);
                    }
                }
            }
        }

        return ResponseEntity.ok(buildFullState(userId));
    }

    private Map<String, Object> buildFullState(Long userId) {
        Map<String, Object> state = new HashMap<>();
        userRepository.findById(userId).ifPresent(u -> state.put("user", AuthController.buildUserMap(u)));
        state.put("accounts", accountRepository.findByUserId(userId));
        state.put("categories", categoryRepository.findByUserId(userId));
        state.put("transactions", transactionRepository.findByUserIdOrderByDateDescUpdatedAtDesc(userId));
        state.put("goals", savingsGoalRepository.findByUserId(userId));
        state.put("debts", debtRecordRepository.findByUserId(userId));
        state.put("recurringRules", recurringRuleRepository.findByUserId(userId));
        state.put("serverTimestamp", System.currentTimeMillis());
        return state;
    }
}
