package com.chatguard.controller;

import com.chatguard.dto.MessageDTO;
import com.chatguard.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Message management endpoints")
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    @Operation(summary = "Send message", description = "Send a new message")
    public ResponseEntity<MessageDTO.Response> sendMessage(
            @Valid @RequestBody MessageDTO.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messageService.sendMessage(request, userDetails.getUsername()));
    }

    @GetMapping("/channel/{channelId}")
    @Operation(summary = "Get channel messages", description = "Get paginated messages for a channel")
    public ResponseEntity<Page<MessageDTO.Response>> getChannelMessages(
            @PathVariable String channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messageService.getChannelMessages(channelId, userDetails.getUsername(), page, size));
    }

    @GetMapping("/direct/{userId}")
    @Operation(summary = "Get direct messages", description = "Get direct messages with a user")
    public ResponseEntity<java.util.List<MessageDTO.Response>> getDirectMessages(
            @PathVariable String userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messageService.getDirectMessages(userId, userDetails.getUsername()));
    }

    @PutMapping("/{messageId}")
    @Operation(summary = "Edit message", description = "Edit an existing message")
    public ResponseEntity<MessageDTO.Response> editMessage(
            @PathVariable String messageId,
            @Valid @RequestBody MessageDTO.UpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(messageService.updateMessage(messageId, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{messageId}")
    @Operation(summary = "Delete message", description = "Soft delete a message")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        messageService.deleteMessage(messageId, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
