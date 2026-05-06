## Nota Técnica — S4 | SGF Backend

### O que foi implementado
- 6 entidades JPA mapeadas (Classificacao, OrigemDado, Usuario, Item,
  Vistoria, LogFiscalizacao) com FetchType.LAZY nos relacionamentos
- 6 repositories criados com derived queries customizadas
- ObraService refatorado com lógica de negócio centralizada
- ObraController desacoplado — zero lógica de domínio no controller
- 3 DTOs implementados via Java Records (ObraRequestDTO,
  ObraResponseDTO, DashboardObraDTO)
- Endpoint GET /obras/{id}/dashboard funcional retornando agregação
  ABC em tempo real via JPQL com JOIN FETCH

### Decisões tomadas
- Java Records escolhidos para DTOs: imutáveis, sem boilerplate,
  ideais para objetos de transferência sem comportamento
- JOIN FETCH na query do dashboard para evitar N+1 queries ao
  carregar classificacao de cada item
- Logging com SLF4J nos pontos críticos do ObraService (salvar,
  deletar, gerarDashboard)

### Validação
- GET /obras retornou 3 obras com DTOs corretos
- GET /obras/{id}/dashboard retornou agregação correta:
  totalItens=7, A=3, B=2, C=2, emVistoria=2, pendentes=5

### Próximos passos
- Implementar serviços e DTOs restantes (Item, Vistoria, Log)
- Adicionar filtros por parâmetros de URL
- Exportar coleção Postman