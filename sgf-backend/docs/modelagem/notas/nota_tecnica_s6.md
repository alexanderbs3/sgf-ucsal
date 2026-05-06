### Decisões tomadas
- HttpMessageNotReadableException tratada separadamente do handler
  genérico para retornar 400 em vez de 500 em body ausente
- MethodArgumentTypeMismatchException adicionado para tratar
  requisições de favicon.ico que chegam ao handler de UUID
- open-in-view: false — elimina queries lazy fora da transação

### Validação
- GET /obras/00000000-... → 404 com JSON padronizado
- POST /obras body vazio → 400 "Body ausente ou malformado"
- POST /obras body {} → 400 com campos inválidos listados
- Todos os handlers logando corretamente via SLF4J