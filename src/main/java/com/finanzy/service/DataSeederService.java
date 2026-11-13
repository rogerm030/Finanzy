package com.finanzy.service;

import com.finanzy.model.*;
import com.finanzy.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class DataSeederService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final DebtRecordRepository debtRecordRepository;
    private final RecurringRuleRepository recurringRuleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeederService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            CategoryRepository categoryRepository,
            TransactionRepository transactionRepository,
            SavingsGoalRepository savingsGoalRepository,
            DebtRecordRepository debtRecordRepository,
            RecurringRuleRepository recurringRuleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.savingsGoalRepository = savingsGoalRepository;
        this.debtRecordRepository = debtRecordRepository;
        this.recurringRuleRepository = recurringRuleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void initDemoUser() {
        if (userRepository.findByEmailIgnoreCase("demo@finanzy.app").isPresent()) {
            return;
        }
        User demo = new User();
        demo.setUuid(UUID.randomUUID().toString());
        demo.setName("Roger (Cuenta Demo)");
        demo.setEmail("demo@finanzy.app");
        demo.setPasswordHash(passwordEncoder.encode("demo123"));
        demo.setCurrency("USD");
        demo.setThemeMode("dark");
        demo.setAccentColor("#6366f1");
        demo = userRepository.save(demo);

        seedDefaultDataForUser(demo.getId(), demo.getCurrency(), true);
    }

    public void seedDefaultDataForUser(Long userId, String currency, boolean includeSampleHistory) {
        if (!categoryRepository.findByUserId(userId).isEmpty()) {
            return;
        }

        // 1. Default Accounts
        Account bank = createAccount(userId, "Banco Principal", "BANK", new BigDecimal("3450.00"), currency, "#3b82f6", "landmark", null, null, null);
        Account cash = createAccount(userId, "Efectivo Billetera", "CASH", new BigDecimal("280.00"), currency, "#10b981", "wallet", null, null, null);
        Account card = createAccount(userId, "Tarjeta Visa Oro", "CREDIT_CARD", new BigDecimal("-420.00"), currency, "#8b5cf6", "credit-card", new BigDecimal("3000.00"), 15, 5);
        Account savings = createAccount(userId, "Fondo de Ahorro", "SAVINGS", new BigDecimal("5200.00"), currency, "#f59e0b", "piggy-bank", null, null, null);

        // 2. Default Categories (Expense & Income)
        Category catFood = createCategory(userId, "Alimentación y Super", "EXPENSE", "utensils", "#ef4444", "NEEDS", new BigDecimal("500.00"));
        Category catHome = createCategory(userId, "Vivienda y Servicios", "EXPENSE", "home", "#3b82f6", "NEEDS", new BigDecimal("700.00"));
        Category catTransport = createCategory(userId, "Transporte y Gasolina", "EXPENSE", "car", "#f59e0b", "NEEDS", new BigDecimal("220.00"));
        Category catHealth = createCategory(userId, "Salud y Farmacia", "EXPENSE", "heart-pulse", "#10b981", "NEEDS", new BigDecimal("150.00"));
        Category catFun = createCategory(userId, "Ocio y Restaurantes", "EXPENSE", "gamepad-2", "#ec4899", "WANTS", new BigDecimal("250.00"));
        Category catShop = createCategory(userId, "Compras y Tecnología", "EXPENSE", "shopping-bag", "#8b5cf6", "WANTS", new BigDecimal("300.00"));
        Category catSubs = createCategory(userId, "Suscripciones y Apps", "EXPENSE", "tv", "#06b6d4", "WANTS", new BigDecimal("80.00"));
        Category catInvest = createCategory(userId, "Ahorro e Inversión", "EXPENSE", "trending-up", "#14b8a6", "SAVINGS", new BigDecimal("600.00"));

        Category catSalary = createCategory(userId, "Salario Mensual", "INCOME", "briefcase", "#10b981", "SAVINGS", BigDecimal.ZERO);
        Category catFreelance = createCategory(userId, "Proyectos Freelance", "INCOME", "laptop", "#6366f1", "SAVINGS", BigDecimal.ZERO);
        Category catPassive = createCategory(userId, "Rendimientos / Dividendos", "INCOME", "sparkles", "#f59e0b", "SAVINGS", BigDecimal.ZERO);

        if (!includeSampleHistory) {
            return;
        }

        LocalDate today = LocalDate.now();
        LocalDate prevMonth = today.minusMonths(1);
        LocalDate twoMonthsAgo = today.minusMonths(2);

        // Current Month Transactions
        createTx(userId, bank.getUuid(), catSalary.getUuid(), "INCOME", "2800.00", "Sueldo Mensual Empresa", today.withDayOfMonth(1).toString(), "sueldo,fijo", "Transferencia", "Empresa Tech");
        createTx(userId, bank.getUuid(), catFreelance.getUuid(), "INCOME", "650.00", "Consultoría Web PWA", today.withDayOfMonth(Math.min(5, today.getDayOfMonth())).toString(), "freelance,extra", "Transferencia", "Cliente Externo");
        createTx(userId, bank.getUuid(), catHome.getUuid(), "EXPENSE", "620.00", "Alquiler y Mantenimiento", today.withDayOfMonth(Math.min(2, today.getDayOfMonth())).toString(), "hogar,fijo", "Transferencia", "Inmobiliaria");
        createTx(userId, card.getUuid(), catFood.getUuid(), "EXPENSE", "185.50", "Compra quincenal supermercado", today.withDayOfMonth(Math.min(4, today.getDayOfMonth())).toString(), "supermercado,casa", "Tarjeta Crédito", "Supermercado Central");
        createTx(userId, cash.getUuid(), catTransport.getUuid(), "EXPENSE", "65.00", "Tanqueada combustible y peajes", today.withDayOfMonth(Math.min(6, today.getDayOfMonth())).toString(), "auto,gasolina", "Efectivo", "Estación Primax");
        createTx(userId, card.getUuid(), catFun.getUuid(), "EXPENSE", "92.00", "Cena fin de semana con amigos", today.withDayOfMonth(Math.min(8, today.getDayOfMonth())).toString(), "cena,amigos", "Tarjeta Crédito", "Trattoria Roma");
        createTx(userId, card.getUuid(), catSubs.getUuid(), "EXPENSE", "34.90", "Netflix + Spotify + Cloud", today.withDayOfMonth(Math.min(10, today.getDayOfMonth())).toString(), "streaming,mensual", "Tarjeta Crédito", "Servicios Digitales");
        createTx(userId, bank.getUuid(), catInvest.getUuid(), "EXPENSE", "450.00", "Aporte mensual ETF S&P 500", today.withDayOfMonth(Math.min(11, today.getDayOfMonth())).toString(), "inversion,futuro", "Transferencia", "Broker Global");
        createTx(userId, card.getUuid(), catShop.getUuid(), "EXPENSE", "129.00", "Teclado mecánico inalámbrico", today.toString(), "setup,oficina", "Tarjeta Crédito", "Amazon");

        // Previous Month Transactions (for comparative analytics)
        createTx(userId, bank.getUuid(), catSalary.getUuid(), "INCOME", "2800.00", "Sueldo Mensual Empresa", prevMonth.withDayOfMonth(1).toString(), "sueldo,fijo", "Transferencia", "Empresa Tech");
        createTx(userId, bank.getUuid(), catFreelance.getUuid(), "INCOME", "420.00", "Diseño de base de datos", prevMonth.withDayOfMonth(14).toString(), "freelance", "Transferencia", "Startup Local");
        createTx(userId, bank.getUuid(), catHome.getUuid(), "EXPENSE", "620.00", "Alquiler y Servicios", prevMonth.withDayOfMonth(3).toString(), "hogar,fijo", "Transferencia", "Inmobiliaria");
        createTx(userId, card.getUuid(), catFood.getUuid(), "EXPENSE", "390.00", "Compras supermercado del mes", prevMonth.withDayOfMonth(12).toString(), "supermercado", "Tarjeta Crédito", "Supermercado Central");
        createTx(userId, cash.getUuid(), catTransport.getUuid(), "EXPENSE", "140.00", "Gasolina y mantenimiento", prevMonth.withDayOfMonth(18).toString(), "auto", "Efectivo", "Taller & Estación");
        createTx(userId, card.getUuid(), catFun.getUuid(), "EXPENSE", "195.00", "Salidas y cine", prevMonth.withDayOfMonth(22).toString(), "ocio", "Tarjeta Crédito", "Cineplanet");
        createTx(userId, bank.getUuid(), catInvest.getUuid(), "EXPENSE", "400.00", "Ahorro programado", prevMonth.withDayOfMonth(25).toString(), "ahorro", "Transferencia", "Fondo Mutuo");

        // 2 Months Ago
        createTx(userId, bank.getUuid(), catSalary.getUuid(), "INCOME", "2800.00", "Sueldo Mensual Empresa", twoMonthsAgo.withDayOfMonth(1).toString(), "sueldo", "Transferencia", "Empresa Tech");
        createTx(userId, bank.getUuid(), catHome.getUuid(), "EXPENSE", "610.00", "Alquiler y Luz", twoMonthsAgo.withDayOfMonth(3).toString(), "hogar", "Transferencia", "Inmobiliaria");
        createTx(userId, card.getUuid(), catFood.getUuid(), "EXPENSE", "410.00", "Alimentación del mes", twoMonthsAgo.withDayOfMonth(15).toString(), "comida", "Tarjeta Crédito", "Supermercado");
        createTx(userId, card.getUuid(), catHealth.getUuid(), "EXPENSE", "110.00", "Chequeo dental anual", twoMonthsAgo.withDayOfMonth(20).toString(), "salud", "Tarjeta Débito", "Clínica Dental");

        // Savings Goals
        createGoal(userId, "Fondo de Emergencia (6 meses)", "6000.00", "4200.00", today.plusMonths(5).toString(), "shield-check", "#10b981");
        createGoal(userId, "Viaje a Europa 2027", "3500.00", "1450.00", today.plusMonths(8).toString(), "plane", "#3b82f6");
        createGoal(userId, "Renovar MacBook Pro", "2200.00", "980.00", today.plusMonths(4).toString(), "laptop", "#8b5cf6");

        // Debts & Loans
        createDebt(userId, "Carlos Mendoza (Préstamo)", "OWED_TO_ME", "300.00", "120.00", today.plusDays(15).toString(), "Préstamo para entradas de concierto", "#10b981");
        createDebt(userId, "Cuota sin intereses TV", "I_OWE", "600.00", "350.00", today.plusDays(20).toString(), "3 cuotas restantes en tarjeta", "#f59e0b");

        // Recurring Subscriptions
        createRecurring(userId, "Alquiler Departamento", "EXPENSE", "620.00", bank.getUuid(), catHome.getUuid(), "MONTHLY", today.plusMonths(1).withDayOfMonth(2).toString());
        createRecurring(userId, "Combo Streaming (Netflix + Spotify)", "EXPENSE", "34.90", card.getUuid(), catSubs.getUuid(), "MONTHLY", today.plusMonths(1).withDayOfMonth(10).toString());
        createRecurring(userId, "Sueldo Nómina", "INCOME", "2800.00", bank.getUuid(), catSalary.getUuid(), "MONTHLY", today.plusMonths(1).withDayOfMonth(1).toString());
    }

    private Account createAccount(Long userId, String name, String type, BigDecimal balance, String currency, String color, String icon, BigDecimal limit, Integer cutoff, Integer payment) {
        Account a = new Account();
        a.setUuid(UUID.randomUUID().toString());
        a.setUserId(userId);
        a.setName(name);
        a.setType(type);
        a.setBalance(balance);
        a.setInitialBalance(balance);
        a.setCurrency(currency);
        a.setColor(color);
        a.setIcon(icon);
        a.setCreditLimit(limit);
        a.setCutoffDay(cutoff);
        a.setPaymentDay(payment);
        return accountRepository.save(a);
    }

    private Category createCategory(Long userId, String name, String type, String icon, String color, String needType, BigDecimal budget) {
        Category c = new Category();
        c.setUuid(UUID.randomUUID().toString());
        c.setUserId(userId);
        c.setName(name);
        c.setType(type);
        c.setIcon(icon);
        c.setColor(color);
        c.setBudgetNeedType(needType);
        c.setMonthlyBudget(budget);
        return categoryRepository.save(c);
    }

    private void createTx(Long userId, String accountUuid, String categoryUuid, String type, String amount, String desc, String date, String tags, String method, String merchant) {
        Transaction t = new Transaction();
        t.setUuid(UUID.randomUUID().toString());
        t.setUserId(userId);
        t.setAccountUuid(accountUuid);
        t.setCategoryUuid(categoryUuid);
        t.setType(type);
        t.setAmount(new BigDecimal(amount));
        t.setDescription(desc);
        t.setDate(date);
        t.setTags(tags);
        t.setPaymentMethod(method);
        t.setMerchant(merchant);
        transactionRepository.save(t);
    }

    private void createGoal(Long userId, String name, String target, String current, String deadline, String icon, String color) {
        SavingsGoal g = new SavingsGoal();
        g.setUuid(UUID.randomUUID().toString());
        g.setUserId(userId);
        g.setName(name);
        g.setTargetAmount(new BigDecimal(target));
        g.setCurrentAmount(new BigDecimal(current));
        g.setDeadline(deadline);
        g.setIcon(icon);
        g.setColor(color);
        savingsGoalRepository.save(g);
    }

    private void createDebt(Long userId, String person, String type, String total, String paid, String dueDate, String notes, String color) {
        DebtRecord d = new DebtRecord();
        d.setUuid(UUID.randomUUID().toString());
        d.setUserId(userId);
        d.setPersonName(person);
        d.setType(type);
        d.setTotalAmount(new BigDecimal(total));
        d.setPaidAmount(new BigDecimal(paid));
        d.setDueDate(dueDate);
        d.setNotes(notes);
        d.setColor(color);
        debtRecordRepository.save(d);
    }

    private void createRecurring(Long userId, String title, String type, String amount, String accUuid, String catUuid, String freq, String nextDate) {
        RecurringRule r = new RecurringRule();
        r.setUuid(UUID.randomUUID().toString());
        r.setUserId(userId);
        r.setTitle(title);
        r.setType(type);
        r.setAmount(new BigDecimal(amount));
        r.setAccountUuid(accUuid);
        r.setCategoryUuid(catUuid);
        r.setFrequency(freq);
        r.setNextDueDate(nextDate);
        recurringRuleRepository.save(r);
    }
}
