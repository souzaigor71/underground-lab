# Underground Lab

Crie uma aplicação web completa chamada INSTITUTO UNDERGROUND — Gerador Inteligente de Estudos

A aplicação deve ser uma plataforma de geração de materiais de estudo usando inteligência artificial

OBJETIVO

O usuário deve conseguir informar qualquer assunto que queira estudar, por exemplo:

Programação

Python

JavaScript

Eletrônica

Arduino

Robótica

Matemática

História

Física

Inteligência Artificial

Desenvolvimento de jogos

Engenharia

Redes de computadores

Depois de informar o assunto, o sistema deve pesquisar informações relevantes e utilizar IA para gerar uma apostila completa, organizada e didática

O resultado deve poder ser visualizado dentro da própria aplicação e exportado para PDF e Markdown

INTERFACE

Crie uma interface moderna, tecnológica e profissional

Tema visual:

Fundo predominantemente preto ou quase preto

Verde escuro como cor secundária

Verde neon utilizado apenas para destaques

Texto branco/cinza claro

Aparência de laboratório tecnológico underground

Elementos com aparência de terminal futurista

Cards com bordas discretas

Pequenas animações

Interface responsiva para computador, tablet e celular

Nome no topo:

INSTITUTO UNDERGROUND

Subtítulo:

Gerador Inteligente de Estudos

Na página inicial mostrar:

Transforme qualquer assunto em uma experiência completa de aprendizado

TELA PRINCIPAL

Criar um campo grande:

O que você deseja estudar?

Placeholder:

Digite um assunto, por exemplo: Programação em Python

Abaixo criar as opções de personalização

NÍVEL DO CONTEÚDO

Criar três opções:

Iniciante

Explicações simples

Analogias

Conceitos fundamentais

Intermediário

Equilíbrio entre teoria e prática

Exemplos

Exercícios

Avançado

Explicações técnicas profundas

Casos de borda

Boas práticas

Arquitetura

Otimização

O padrão deve ser Intermediário

FOCO PEDAGÓGICO

Criar três opções:

Teórico e Conceitual

Prático e Exercícios

Equilibrado

O padrão deve ser Equilibrado

TAMANHO DA APOSTILA

Adicionar opção:

Resumida

Normal

Completa

Profunda

A opção Completa deve ser o padrão

BOTÃO

Criar um botão grande:

GERAR APOSTILA

Ao clicar, mostrar uma tela de processamento

PROCESSAMENTO

Mostrar uma interface de progresso com etapas

Exemplo:

[✓] Analisando assunto

[✓] Pesquisando fontes

[✓] Estruturando conteúdo

[✓] Gerando conceitos fundamentais

[✓] Gerando teoria

[✓] Gerando exemplos

[✓] Gerando exercícios

[✓] Criando gabarito

[✓] Criando glossário

[✓] Revisando conteúdo

[✓] Finalizando apostila

O progresso deve ser visual e animado

Não inventar que uma etapa foi concluída se ela ainda estiver executando

PESQUISA

O sistema deve possuir uma camada de pesquisa para buscar informações relevantes sobre o assunto

Quando possível, mostrar na apostila uma seção:

FONTES CONSULTADAS

Cada fonte deve possuir:

título

domínio

link

data de acesso

Priorizar fontes confiáveis

Para programação, priorizar documentação oficial

Para assuntos científicos, priorizar fontes acadêmicas e institucionais

GERAÇÃO DA APOSTILA

A IA deve gerar uma apostila estruturada

A estrutura deve ser aproximadamente:

Título

Introdução

Explicar o assunto e por que ele é importante

Objetivos de aprendizagem

Mostrar o que o estudante será capaz de compreender depois de estudar o material

Fundamentos

Explicar os conceitos fundamentais

Conceitos básicos

Explicação detalhada

Conceitos intermediários

Explicação detalhada

Conceitos avançados

Explicação aprofundada quando o nível selecionado permitir

Exemplos

Mostrar exemplos claros

Quando o assunto for programação, utilizar blocos de código com syntax highlighting

Exemplos práticos

Mostrar situações reais

Erros comuns

Mostrar erros frequentes e como evitá-los

Boas práticas

Mostrar recomendações importantes

Exercícios

Criar exercícios progressivos

Separar por dificuldade:

Fácil

Médio

Difícil

Gabarito

Mostrar respostas e explicações

Perguntas frequentes

Criar perguntas frequentes relacionadas ao assunto

Glossário

Listar termos importantes e suas definições

Resumo

Criar uma revisão geral

Checklist de aprendizado

Criar uma lista para o estudante verificar o que já domina

Fontes consultadas

Mostrar as fontes utilizadas

MODO DE ESTUDO

Depois que a apostila for criada, criar uma área de leitura

Layout semelhante a um leitor de livros digitais

Na lateral esquerda:

Introdução

Fundamentos

Conceitos básicos

Conceitos intermediários

Conceitos avançados

Exemplos

Exercícios

Gabarito

FAQ

Glossário

Resumo

Fontes

Ao clicar em uma seção, navegar diretamente para ela

Adicionar barra de progresso de leitura

Exemplo:

Progresso: 42%

MARCADORES

Permitir que o usuário marque páginas/seções como favoritas

Adicionar botão:

☆ Favoritar

Criar uma área:

MEUS MARCADORES

ANOTAÇÕES

Permitir que o usuário faça anotações dentro da apostila

Exemplo:

Minha anotação

O usuário pode escrever:

"Revisar este conceito depois"

As anotações devem ser armazenadas

QUIZ

Adicionar um modo de estudo interativo

Botão:

INICIAR QUIZ

A IA deve gerar perguntas baseadas na apostila

Tipos:

múltipla escolha

verdadeiro ou falso

resposta curta

Depois de responder:

Mostrar:

resposta correta

resposta do usuário

explicação

pontuação

No final:

Resultado

Exemplo:

8 / 10

80% de aproveitamento

FLASHCARDS

Adicionar uma área:

FLASHCARDS

A IA deve transformar conceitos importantes em cartões

Frente:

O que é uma variável?

Verso:

Uma variável é...

Permitir avançar e voltar entre cartões

EXPORTAÇÃO

Adicionar botões:

EXPORTAR PDF

EXPORTAR MARKDOWN

COPIAR MATERIAL

O PDF deve possuir:

capa

título

subtítulo

índice

capítulos

numeração de páginas

marcadores

código formatado

fontes

HISTÓRICO

Criar uma área:

MEUS ESTUDOS

Mostrar as apostilas anteriormente geradas

Cada item deve mostrar:

assunto

nível

data

progresso

quantidade de capítulos

Exemplo:

Python — Avançado

12 capítulos

Progresso: 67%

Permitir:

abrir

continuar estudando

excluir

exportar novamente

DASHBOARD

Criar um dashboard mostrando:

MEU APRENDIZADO

Cards:

Apostilas criadas

Horas estudadas

Quizzes realizados

Média dos quizzes

Tópicos estudados

Criar também uma sequência de estudos:

Sequência atual: 7 dias

INTELIGÊNCIA ARTIFICIAL

A arquitetura deve permitir utilizar uma API de IA através de variáveis de ambiente

NUNCA colocar API keys diretamente no frontend

As chaves devem permanecer no backend/server-side

Criar suporte preparado para:

Google Gemini

Groq

Permitir escolher o provedor de IA nas configurações administrativas

Criar um sistema de fallback:

Se o provedor principal apresentar erro temporário ou limite de requisições, tentar o segundo provedor

Implementar retry com backoff exponencial

Exemplo:

Tentativa 1

aguardar 2 segundos

Tentativa 2

aguardar 4 segundos

Tentativa 3

aguardar 8 segundos

Se continuar falhando, informar o usuário de maneira amigável

CONTROLE DE RATE LIMIT

É extremamente importante evitar o problema de disparar muitas requisições simultaneamente

Não gerar dezenas de solicitações de IA simultaneamente

Criar uma fila de processamento

Limitar a quantidade de requisições simultâneas

Se uma API retornar HTTP 429:

detectar automaticamente

aguardar

tentar novamente

atualizar a interface de progresso

Mostrar algo como:

A IA está temporariamente ocupada. Aguardando para continuar...

Nunca simplesmente encerrar a geração

CHECKPOINTS

A geração deve possuir checkpoints

Exemplo:

generation_id

Salvar cada seção individualmente

Se o processo for interrompido no capítulo 7 de 10, não gerar novamente os capítulos 1 a 6

Ao continuar, gerar apenas o que estiver faltando

Isso deve tornar o sistema resistente a falhas

BANCO DE DADOS

Criar estrutura para armazenar:

users

study_materials

chapters

sources

bookmarks

notes

quizzes

quiz_questions

flashcards

study_progress

generation_jobs

generation_checkpoints

SEGURANÇA

Nunca expor:

GEMINI_API_KEY

GROQ_API_KEY

outras credenciais

As APIs devem ser chamadas pelo backend

Adicionar validação de entrada

Adicionar tratamento de erros

Adicionar proteção contra solicitações excessivamente grandes

EXPERIÊNCIA DO USUÁRIO

O usuário nunca deve ficar olhando uma tela congelada

Durante processos demorados:

mostrar progresso

mostrar etapa atual

mostrar animação discreta

mostrar mensagens como:

Pesquisando conhecimento...

Construindo sua apostila...

Organizando os conceitos...

Preparando exercícios...

Revisando o material...

DESIGN DA APOSTILA

A apostila deve parecer um material profissional

Usar:

títulos bem definidos

subtítulos

caixas de destaque

exemplos

tabelas quando apropriado

código com syntax highlighting

listas

citações de fontes

separadores

Para código utilizar fonte monoespaçada

MODO ESCURO

O sistema deve iniciar no modo escuro

Adicionar opção para alternar:

Dark

Light

O modo escuro deve ser o visual principal da plataforma

RESPONSIVIDADE

A aplicação deve funcionar perfeitamente em:

Desktop

Tablet

Celular

No celular, o menu lateral deve virar um menu retrátil

TECNOLOGIA

Utilizar uma arquitetura moderna compatível com o ambiente do Lovable

Priorizar:

React

TypeScript

Tailwind CSS

Componentes reutilizáveis

Backend seguro para chamadas de IA

Banco de dados persistente

Código organizado e modular

IMPORTANTE

Não criar apenas uma landing page

Criar uma aplicação funcional

Todas as telas principais devem estar conectadas

O fluxo completo deve funcionar:

Assunto

→ Personalização

→ Pesquisa

→ Geração

→ Revisão

→ Apostila

→ Quiz

→ Flashcards

→ Progresso

→ Histórico

→ Exportação

A interface deve parecer um verdadeiro laboratório de estudos com inteligência artificial, e não apenas um formulário simples

O nome da aplicação deve ser:

INSTITUTO UNDERGROUND

Criar uma identidade visual tecnológica, sombria e profissional

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5fde6358-6ab9-435d-a67b-10aeda142a9a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
