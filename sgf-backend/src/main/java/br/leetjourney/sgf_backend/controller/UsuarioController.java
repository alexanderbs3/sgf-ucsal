
package br.leetjourney.sgf_backend.controller;

import br.leetjourney.sgf_backend.dto.request.AtualizarPapelUsuarioDTO;
import br.leetjourney.sgf_backend.dto.request.UsuarioRequestDTO;
import br.leetjourney.sgf_backend.dto.response.UsuarioResponseDTO;
import br.leetjourney.sgf_backend.model.PapelUsuario;
import br.leetjourney.sgf_backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    /** GET /usuarios */
    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    /** GET /usuarios/papeis */
    @GetMapping("/papeis")
    public ResponseEntity<List<String>> listarPapeis() {
        return ResponseEntity.ok(
                Arrays.stream(PapelUsuario.values()).map(Enum::name).toList()
        );
    }

    /** GET /usuarios/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    /** POST /usuarios */
    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> criar(@Valid @RequestBody UsuarioRequestDTO dto) {
        return ResponseEntity.status(201).body(usuarioService.criar(dto));
    }

    /** PUT /usuarios/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody UsuarioRequestDTO dto) {
        return ResponseEntity.ok(usuarioService.atualizar(id, dto));
    }

    /** PATCH /usuarios/{id}/papel */
    @PatchMapping("/{id}/papel")
    public ResponseEntity<UsuarioResponseDTO> atualizarPapel(
            @PathVariable UUID id,
            @Valid @RequestBody AtualizarPapelUsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.atualizarPapel(id, dto));
    }

    /**
     * DELETE /usuarios/{id}?forcar=false
     *
     * @param forcar  Quando {@code true}, remove o usuário mesmo que possua vistorias
     *                vinculadas (exclusivo para Administradores — sem auth real, o
     *                frontend controla o acesso a este parâmetro).
     *                Padrão: {@code false} (comportamento seguro).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "false") boolean forcar) {
        usuarioService.deletar(id, forcar);
        return ResponseEntity.noContent().build();
    }
}
