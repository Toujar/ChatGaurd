package com.chatguard.repository;

import com.chatguard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndOrganizationId(String email, String organizationId);

    List<User> findByOrganizationId(String organizationId);

    Page<User> findByOrganizationId(String organizationId, Pageable pageable);

    List<User> findByOrganizationIdAndStatus(String organizationId, User.Status status);

    Page<User> findByOrganizationIdAndRole(String organizationId, User.Role role, Pageable pageable);

    List<User> findByRole(User.Role role);

    @Query("SELECT u FROM User u WHERE u.organization.id = :orgId AND u.riskScore >= :minScore")
    List<User> findHighRiskUsers(@Param("orgId") String organizationId, @Param("minScore") Integer minScore);

    @Query("SELECT COUNT(u) FROM User u WHERE u.organization.id = :orgId AND u.status = :status")
    Long countByOrganizationIdAndStatus(@Param("orgId") String organizationId, @Param("status") User.Status status);

    @Query("SELECT AVG(u.riskScore) FROM User u WHERE u.organization.id = :orgId")
    Double getAverageRiskScore(@Param("orgId") String organizationId);

    @Modifying
    @Query("UPDATE User u SET u.lastLoginAt = :lastLogin WHERE u.id = :userId")
    void updateLastLogin(@Param("userId") String userId, @Param("lastLogin") LocalDateTime lastLogin);

    @Modifying
    @Query("UPDATE User u SET u.riskScore = u.riskScore + :delta WHERE u.id = :userId")
    void updateRiskScore(@Param("userId") String userId, @Param("delta") Integer delta);

    boolean existsByEmail(String email);

    boolean existsByEmailAndOrganizationId(String email, String organizationId);
}
