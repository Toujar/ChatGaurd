package com.chatguard.repository;

import com.chatguard.entity.VerificationEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VerificationEventRepository extends JpaRepository<VerificationEvent, String> {

    List<VerificationEvent> findByOrganizationId(String organizationId);

    Page<VerificationEvent> findByOrganizationId(String organizationId, Pageable pageable);

    List<VerificationEvent> findByUserId(String userId);

    List<VerificationEvent> findByOrganizationIdAndResolvedAtIsNull(String organizationId);

    @Query("SELECT COUNT(v) FROM VerificationEvent v WHERE v.organization.id = :orgId AND v.createdAt >= :since")
    Long countEventsSince(@Param("orgId") String organizationId, @Param("since") LocalDateTime since);

    @Query("SELECT v.riskLevel, COUNT(v) FROM VerificationEvent v WHERE v.organization.id = :orgId GROUP BY v.riskLevel")
    List<Object[]> countByRiskLevel(@Param("orgId") String organizationId);
}
