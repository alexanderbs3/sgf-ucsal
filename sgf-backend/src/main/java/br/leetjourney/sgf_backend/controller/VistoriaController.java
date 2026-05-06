package br.leetjourney.sgf_backend.controller;

import br.leetjourney.sgf_backend.dto.request.VistoriaRequestDTO;
import br.leetjourney.sgf_backend.dto.response.VistoriaResponseDTO;
import br.leetjourney.sgf_backend.service.VistoriaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/vistorias")
public class VistoriaController {

    private final VistoriaService vistoriaService;

    public VistoriaController(VistoriaService vistoriaService) {
        this.vistoriaService = vistoriaService;
    }


    @GetMapping
    public ResponseEntity<List<VistoriaResponseDTO>> listar(@RequestParam UUID obraId) {
        return ResponseEntity.ok(vistoriaService.listarPorObra(obraId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VistoriaResponseDTO>buscarPorId(@PathVariable UUID id){
        return ResponseEntity.ok(vistoriaService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<VistoriaResponseDTO>criar(@Valid @RequestBody VistoriaRequestDTO dto){
        return ResponseEntity.status(201).body(vistoriaService.salvar(dto));
    }


}
