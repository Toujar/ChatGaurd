package com.chatguard.controller;

import com.chatguard.dto.ChannelDTO;
import com.chatguard.entity.Channel;
import com.chatguard.entity.ChannelMember;
import com.chatguard.repository.ChannelRepository;
import com.chatguard.repository.UserRepository;
import com.chatguard.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Channel>> getChannels(@AuthenticationPrincipal UserDetails userDetails) {
        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        List<Channel> channels = channelRepository.findByOrganizationId(user.getOrganization().getId());
        return ResponseEntity.ok(channels);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Channel> getChannel(@PathVariable String id) {
        return channelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Channel> createChannel(
            @RequestBody ChannelDTO.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Channel channel = Channel.builder()
                .organization(user.getOrganization())
                .name(request.getName())
                .description(request.getDescription())
                .type(Channel.Type.valueOf(request.getType()))
                .createdBy(user)
                .sensitivityLevel(Channel.SensitivityLevel.NORMAL)
                .build();

        channel = channelRepository.save(channel);
        return ResponseEntity.ok(channel);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Void> joinChannel(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {

        var user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        var channel = channelRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Channel not found"));

        ChannelMember member = ChannelMember.builder()
                .channel(channel)
                .user(user)
                .role(ChannelMember.Role.MEMBER)
                .build();

        channel.getMembers().add(member);
        channelRepository.save(channel);

        return ResponseEntity.ok().build();
    }
}
