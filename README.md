# 🧩 MeritAI - Inclusão Inteligente

![Status](https://img.shields.io/badge/Status-Concluído-success)
![AI](https://img.shields.io/badge/Powered%20by-Google%20Gemini-blue)
![License](https://img.shields.io/badge/License-MIT-green)

> **Uma plataforma que une Direito, Tecnologia e Acessibilidade para quebrar as barreiras enfrentadas por pessoas neurodivergentes.**

🔗 **Acesse o projeto online:** [https://merit-ai-ebon.vercel.app/](https://merit-ai-ebon.vercel.app/)

---

## 📉 O Cenário: Por que o MeritAI é necessário?

Apesar dos avanços na legislação, pessoas atípicas (TEA, TDAH, entre outros) enfrentam um abismo entre o direito garantido e a realidade vivida. O MeritAI nasce para combater três estatísticas alarmantes:

* **Exclusão Profissional Crônica:** Estima-se que **85% dos adultos autistas no Brasil estão fora do mercado de trabalho formal**. A falta de processos seletivos adaptados desperdiça talentos únicos.
* **Barreiras de Linguagem:** Especialistas jurídicos apontam o "juridiquês" (linguagem técnica complexa) como um dos maiores obstáculos para o acesso à justiça no país. Quem não entende o que lê, não consegue lutar pelo seu direito.
* **Negativas por Burocracia:** Grande parte dos indeferimentos do benefício BPC/LOAS ocorre não pela ausência de deficiência, mas por falhas na documentação social e comprovação de renda.

---

## 💡 A Solução: Autonomia via Tecnologia

O MeritAI não é apenas um site informativo; é um **agente ativo de inclusão**. A plataforma ataca os problemas acima com ferramentas práticas:

### 1. Assistência Jurídica Descomplicada
Utilizamos a **Inteligência Artificial** para traduzir cartas do INSS e leis complexas. O usuário cola o texto difícil e recebe uma explicação simples e direta, eliminando a barreira do "juridiquês".

### 2. Simulador de Perícia Médica
Para reduzir a ansiedade e evitar indeferimentos, criamos um ambiente seguro onde a IA assume a persona de um perito do INSS. Ela realiza perguntas técnicas baseadas no diagnóstico do usuário e oferece feedback sobre como comunicar melhor suas limitações.

### 3. Empregabilidade Afirmativa
Combatemos a estatística de desemprego conectando o usuário a vagas de empresas preparadas para a neurodiversidade e gerando currículos que destacam hiperfocos e competências técnicas, em vez de apenas experiências passadas.

---

## 🛠️ Bastidores: Arquitetura Técnica

Este projeto foi desenvolvido durante a **Imersão Dev com Google Gemini**, demonstrando como conectar uma base de dados estruturada a modelos de linguagem avançados (LLMs).

### 1. Base de Conhecimento (JSON)
Diferente de chatbots genéricos que "alucinam", o MeritAI fundamenta suas respostas em dados estruturados locais. Criamos arquivos JSON que funcionam como a "verdade" do sistema para leis e oportunidades, garantindo precisão:
* **Benefícios:** Mapeamento de regras lógicas (renda per capita, CIDs, documentos) para sugerir direitos com assertividade.
* **Vagas:** Banco de dados de oportunidades com tags de acessibilidade (ex: "Sem vídeo", "Comunicação Assíncrona").

### 2. JavaScript (Lógica de Negócios)
A aplicação roda inteiramente no lado do cliente (Client-Side) usando JavaScript moderno (ES6+):
* **Consumo de API:** Integração direta com a API do Google Gemini (`gemini-2.5-flash`) para processamento de linguagem natural em tempo real.
* **Manipulação de DOM:** Atualização dinâmica da interface sem necessidade de recarregamento da página (SPA - Single Page Application feel).
* **Geração de Arquivos:** Uso de bibliotecas JS para criar e baixar arquivos `.docx` personalizados diretamente no navegador do usuário.

### 3. Front-end (Interface)
* **Design Inclusivo:** Interface limpa construída com HTML5 e CSS3, pensada para evitar sobrecarga sensorial (cores suaves, tipografia legível).
* **Responsividade:** Layout adaptável que funciona perfeitamente em celulares e desktops, garantindo acesso democrático.

