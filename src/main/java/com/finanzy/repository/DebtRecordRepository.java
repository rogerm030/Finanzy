package com.finanzy.repository;

import com.finanzy.model.DebtRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DebtRecordRepository extends JpaRepository<DebtRecord, Long> {
    List<DebtRecord> findByUserId(Long userId);
    Optional<DebtRecord> findByUuidAndUserId(String uuid, Long userId);
}
