
### O que foi implementado
- CorsConfig com WebMvcConfigurer liberando todos os endpoints
  para consumo pelo frontend dashboard
- Bateria completa de endpoints validada:
  GET /obras, GET /obras/{id}, GET /obras/{id}/dashboard,
  GET /itens?obraId=, GET /itens?obraId=&classificacao=,
  GET /vistorias?obraId=, GET /logs?vistoriaId=

### Decisões tomadas
- allowedOrigins("*") para ambiente de desenvolvimento —
  em produção deve ser restrito ao domínio do frontend
- maxAge(3600) para cache do preflight OPTIONS

### Validação
- Todos os endpoints respondendo corretamente com dados reais
- CORS configurado e funcional para integração com dashboard

### Próximos passos
- Consolidação IC: relatório semestral PROVIC
- Mapa de evolução do projeto
- Apresentação estruturada