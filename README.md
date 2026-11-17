# CAF • Gestão Inteligente de Escalas

Aplicação web estática para publicação no GitHub Pages, com autenticação e persistência compartilhada via Supabase.

## Arquivos
- `index.html`: estrutura e telas.
- `estilo.css`: identidade visual responsiva baseada no layout de referência.
- `js/app.js`: calendário, equipe, ausências, atividades, exportação e sincronização.
- `js/supabase-config.js`: URL e chave pública (anon) do Supabase.
- `supabase/schema.sql`: tabela e políticas RLS.
- `manifest.json`: metadados PWA.

## Configuração do Supabase
1. Crie um projeto no Supabase.
2. Abra **SQL Editor**, execute `supabase/schema.sql`.
3. Em **Project Settings > API**, copie Project URL e `anon` public key.
4. Cole os valores em `js/supabase-config.js`.
5. Em **Authentication > Providers**, mantenha Email habilitado.
6. Em **Authentication > Users**, crie os usuários autorizados. Não habilite cadastro público.
7. Publique os arquivos no repositório GitHub e habilite GitHub Pages.

## Sincronização
O sistema consulta o registro compartilhado a cada 10 segundos. As alterações são gravadas na tabela `caf_escalas`. A política inicial permite leitura e edição a qualquer usuário autenticado do projeto. Para uma implantação corporativa, limite quem pode criar contas e, se necessário, substitua as políticas por autorização baseada em papéis.

## Regras iniciais incluídas
- Duda, Adri e Leto como nomes-base de rodízio; equipe inicial também contém Adriene, Gi e Girlene.
- Girlene identificada como ServiceNow fixa.
- E-mail e V360 podem ser atribuídos à mesma pessoa no dia.
- Opção para evitar repetição consecutiva de E-mail.
- Ausências com colaborador, período e tipo.
- Atividades: E-mail, Retorno, Fieldglass, FUP, ServiceNow, V360, Spot Materiais e Encerramento.

**Importante:** esta versão oferece cadastro/edição manual das atribuições. O motor de distribuição automática do rodízio, incluindo todas as exceções de cobertura, deve ser validado com as regras operacionais completas antes de ser ativado.

## Exportação
- PDF: use o botão PDF e escolha “Salvar como PDF” na janela de impressão do navegador.
- JSON: backup e restauração dos dados da escala.

## Observações de segurança
- Nunca publique a chave `service_role` no front-end.
- A chave `anon` é pública por natureza; a segurança depende das políticas RLS e da autenticação.
- O projeto não inclui dados reais de fornecedores nem credenciais.
- O conflito de edição simultânea é resolvido por última gravação; para equipes com edição concorrente, recomenda-se adicionar bloqueio otimista/versionamento por registro.


## Atualização: gerador inteligente
Foi adicionado o botão **Gerar rodízio inteligente**, com seleção de datas, geração de prévia, revisão manual de responsáveis e aplicação da prévia ao calendário. A distribuição é executada no navegador e usa os colaboradores ativos e ausências cadastradas.

### Limitações e configuração necessária
- Configure URL e chave pública (anon/publishable) do Supabase em `js/supabase-config.js`; nunca coloque chave `service_role` no navegador.
- A autenticação e persistência dependem de um projeto Supabase configurado e das políticas RLS adequadas.
- A foto Microsoft 365 exige configuração de Microsoft Entra ID/Graph e permissões aprovadas pelo administrador; ainda não está conectada neste pacote.
- O gerador oferece prévia editável; valide as regras e a estrutura de dados antes de usar em produção.
- O ServiceNow prioriza Girlene quando disponível; se ela estiver ausente, a prévia usa substituto e deve ser conferida pelo gestor.
- PWA precisa ser hospedada em HTTPS (ou localhost). O service worker não torna o Supabase offline.
