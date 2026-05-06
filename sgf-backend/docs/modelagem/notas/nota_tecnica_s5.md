### O que foi implementado
- DTOs de request e response para todas as entidades:
  Item, Vistoria, LogFiscalizacao (via Java Records)
- Services completos: ItemService, VistoriaService,
  LogFiscalizacaoService com lógica de negócio isolada
- Controllers: ItemController (/itens), VistoriaController
  (/vistorias), LogFiscalizacaoController (/logs)
- Filtros por parâmetro de URL: /itens?obraId=&classificacao=
  e /logs?vistoriaId= ou ?itemId=
- GlobalExceptionHandler com @RestControllerAdvice cobrindo:
  RecursoNaoEncontradoException (404),
  MethodArgumentNotValidException (400),
  HttpMessageNotReadableException (400),
  MethodArgumentTypeMismatchException (400),
  Exception genérica (500)
- RecursoNaoEncontradoException como exceção de domínio própria