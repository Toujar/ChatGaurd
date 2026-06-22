package com.chatguard.repository;

import com.chatguard.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    Page<Message> findByChannelId(String channelId, Pageable pageable);

    List<Message> findBySenderId(String senderId);

    List<Message> findByRecipientId(String recipientId);

    @Query("SELECT m FROM Message m WHERE m.channel.id = :channelId AND m.deletedAt IS NULL ORDER BY m.createdAt DESC")
    Page<Message> findActiveMessagesByChannel(@Param("channelId") String channelId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE (m.sender.id = :userId OR m.recipient.id = :userId) AND m.channel IS NULL")
    List<Message> findDirectMessages(@Param("userId") String userId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender.organization.id = :orgId AND m.createdAt >= :since")
    Long countMessagesSince(@Param("orgId") String organizationId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender.organization.id = :orgId AND m.protectionTriggered = true AND m.createdAt >= :since")
    Long countProtectedMessagesSince(@Param("orgId") String organizationId, @Param("since") LocalDateTime since);

    @Modifying
    @Query("UPDATE Message m SET m.content = :content, m.editedAt = :editedAt, m.editedBy.id = :editorId WHERE m.id = :messageId")
    void updateContent(@Param("messageId") String messageId, @Param("content") String content,
                       @Param("editedAt") LocalDateTime editedAt, @Param("editorId") String editorId);

    @Modifying
    @Query("UPDATE Message m SET m.deletedAt = :deletedAt, m.deletedBy.id = :deleterId WHERE m.id = :messageId")
    void softDelete(@Param("messageId") String messageId, @Param("deletedAt") LocalDateTime deletedAt,
                    @Param("deleterId") String deleterId);
}
