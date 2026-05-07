package br.leetjourney.sgf_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * DTO de criação/atualização de obra.
 *
 * CORREÇÃO v6: campo `status` removido deste DTO.
 * Antes, o cliente podia enviar qualquer status na criação (ex: CONCLUIDA),
 * bypassando a máquina de estados. O status inicial agora é sempre hardcoded
 * como PLANEJADA no ObraService.salvar(). Alterações de status são feitas
 * exclusivamente via PATCH /obras/{id}/status com validação de transição.
 */
public record ObraRequestDTO(
        @NotBlank String codigo,
        @NotBlank String descricao,
        @NotNull  LocalDate dataInicio,
                  LocalDate dataPrevisaoConclusao
) {}
