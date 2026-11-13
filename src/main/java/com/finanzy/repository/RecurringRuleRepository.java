package com.finanzy.repository;

import com.finanzy.model.RecurringRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RecurringRuleRepository extends JpaRepository<RecurringRule, Long> {
    List<RecurringRule> findByUserId(Long userId);
    Optional<RecurringRule> findByUuidAndUserId(String uuid, Long userId);
}
