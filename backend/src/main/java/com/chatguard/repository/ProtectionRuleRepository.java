package com.chatguard.repository;

import com.chatguard.entity.ProtectionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProtectionRuleRepository extends JpaRepository<ProtectionRule, String> {

    List<ProtectionRule> findByOrganizationId(String organizationId);

    List<ProtectionRule> findByOrganizationIdAndEnabledTrue(String organizationId);

    Optional<ProtectionRule> findByIdAndOrganizationId(String id, String organizationId);

    List<ProtectionRule> findByOrganizationIdAndRuleType(String organizationId, ProtectionRule.RuleType ruleType);

    @Query("SELECT r FROM ProtectionRule r WHERE r.organization.id = :orgId AND r.enabled = true ORDER BY r.severity DESC")
    List<ProtectionRule> findActiveRulesByPriority(@Param("orgId") String organizationId);

    boolean existsByOrganizationIdAndName(String organizationId, String name);
}
