# Gerador de DOCX em lote

App em Streamlit que abre um DOCX modelo, mapeia textos a colunas de uma planilha (Excel/CSV) e gera um documento por linha.

## Passos rapidos
- Instale deps: `pip install -r requirements.txt`
- Rode: `streamlit run docx_batch_app.py`
- Na interface:
  - Envie o DOCX modelo.
  - Envie a planilha.
  - Na tabela de mapeamento, preencha:
    - **Texto no DOCX**: o texto exato que sera substituido.
    - **Coluna do Excel**: a coluna cujo valor entra no lugar.
  - Opcional: ajuste o template do nome do arquivo.
  - Clique em **Gerar documentos**. Os arquivos sao salvos em `saida_docx` e tambem podem ser baixados em ZIP.

## Notas
- Para encontrar o texto, use exatamente o que esta no DOCX (evite quebras/formatacao dividindo o placeholder).
- A substituicao recompõe o paragrafo em um unico run; se o trecho tiver estilos mistos (negrito dentro do placeholder), esse formato pode ser perdido. Planeje placeholders simples.

## Versao web (Node/JS)
- Arquivos: `server.js`, `public/index.html`, `package.json`.
- Instale deps Node: `npm install`
- Rode: `npm start` e abra `http://localhost:3000`
- Fluxo na interface web:
  - Envie o template `.docx` com placeholders `{{campo}}`.
  - Envie a planilha (Excel/CSV); o servidor devolve colunas.
  - Associe cada placeholder a uma coluna e clique em “Gerar ZIP” para baixar todos os DOCX gerados.
- Observacoes:
  - O servidor conserta delimitadores repetidos (`{{{{tag}}}}` -> `{{tag}}`) e preenche placeholders nao mapeados com vazio para evitar erros.
