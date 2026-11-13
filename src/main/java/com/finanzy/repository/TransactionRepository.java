package com.finanzy.repository;

import com.finanzy.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByDateDescUpdatedAtDesc(Long userId);
    Optional<Transaction> findByUuidAndUserId(String uuid, Long userId);
}
