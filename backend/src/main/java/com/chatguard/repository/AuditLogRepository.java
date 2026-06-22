package com.chatguard.repository;

import com.chatguard.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {

    Page<AuditLog> findByOrganizationId(String organizationId, Pageable pageable);

    Page<AuditLog> findByOrganizationIdAndActorId(String organizationId, String actorId, Pageable pageable);

    List<AuditLog> findByOrganizationIdAndCreatedAtAfter(String organizationId, LocalDateTime after);

    @Query("SELECT a FROM AuditLog a WHERE a.organization.id = :orgId AND a.action LIKE :actionPrefix%")
    Page<AuditLog> findByActionPrefix(@Param("orgId") String organizationId,
                                      @Param("actionPrefix") String actionPrefix,
                                      Pageable pageable);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.organization.id = :orgId AND a.createdAt >= :since")
    Long countLogsSince(@Param("orgId") String organizationId, @Param("since") LocalDateTime since);

    @Query("SELECT a.action, COUNT(a) FROM AuditLog a WHERE a.organization.id = :orgId GROUP BY a.action")
    List<Object[]> countByAction(@Param("orgId") String organizationId);
}
