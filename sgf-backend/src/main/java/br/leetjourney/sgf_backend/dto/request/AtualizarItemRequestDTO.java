package br.leetjourney.sgf_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * DTO para atualização completa de um item via PUT /itens/{id}.
 *
 * Separa-se do ItemRequestDTO (criação) porque na edição:
 * - obraId não é alterável (o item pertence a uma obra e não muda)
 * - status também tem endpoint próprio (PATCH /itens/{id}/status)
 * - apenas descrição e classificação podem ser editadas
 */
public record AtualizarItemRequestDTO(
        @NotNull UUID classificacaoId,
        @NotBlank String descricao
) {}
