package com.chatguard.repository;

import com.chatguard.entity.Channel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, String> {

    List<Channel> findByOrganizationId(String organizationId);

    Optional<Channel> findByIdAndOrganizationId(String id, String organizationId);

    Optional<Channel> findByOrganizationIdAndName(String organizationId, String name);

    @Query("SELECT c FROM Channel c JOIN c.members m WHERE m.user.id = :userId")
    List<Channel> findChannelsByMemberId(@Param("userId") String userId);

    @Query("SELECT COUNT(m) FROM Channel c JOIN c.members m WHERE c.id = :channelId")
    Long countMembers(@Param("channelId") String channelId);

    Page<Channel> findByOrganizationId(String organizationId, Pageable pageable);

    boolean existsByOrganizationIdAndName(String organizationId, String name);
}
