import { GoogleGenerativeAI } from "@google/generative-ai";

    // --- CONFIGURAÇÃO ---
    const GEMINI_API_KEY = "GEMINI_API_KEY"; 
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let BENEFICIOS_DB = null;
    let VAGAS_DB = null;

    async function loadData() {
        try {
            const [beneficiosRes, vagasRes] = await Promise.all([
                fetch('data/beneficios.json'),
                fetch('data/vagas.json')
            ]);
            
            if (!beneficiosRes.ok || !vagasRes.ok) throw new Error("Falha ao carregar dados JSON");
            
            BENEFICIOS_DB = await beneficiosRes.json();
            VAGAS_DB = await vagasRes.json();
            
            const activeSection = document.querySelector('section.active').id;
            if (activeSection === 'direitos') carregarBeneficios();
            if (activeSection === 'vagas') carregarVagas();
            
        } catch (error) {
            console.error("Erro ao carregar bases de conhecimento:", error);
            document.getElementById('lista-beneficios').innerHTML = '<p>Erro ao carregar dados. Certifique-se de rodar em um servidor local (http://) ou GitHub Pages.</p>';
        }
    }

    // Variáveis de Estado
    let userProfile = JSON.parse(localStorage.getItem('merit_profile')) || {};
    let activeChecklists = JSON.parse(localStorage.getItem('merit_checklists')) || {};
    let chatHistory = [];

    // --- FUNÇÕES GLOBAIS ---
    window.nav = nav;
    window.iniciarChecklist = iniciarChecklist;
    window.toggleCheck = toggleCheck;
    window.analisarLaudo = analisarLaudo;
    window.gerarDocumento = gerarDocumento;
    window.gerarCurriculo = gerarCurriculo;
    window.startSimulation = startSimulation;
    window.sendMessage = sendMessage;
    window.handleEnter = handleEnter;
    window.encontrarDefensoria = encontrarDefensoria;
    window.gerarDeclaracaoPobreza = gerarDeclaracaoPobreza;
    window.traduzirJuridiques = traduzirJuridiques;
    window.gerarRotina = gerarRotina;
    window.gerarMensagem = gerarMensagem;
    window.carregarVagas = carregarVagas;
    window.baixarCurriculoDocx = baixarCurriculoDocx;
    window.agendarDefensoria = agendarDefensoria;

    // --- FORMATADOR DE TEXTO IA ---
    function formatarTextoIA(texto) {
        if (!texto) return "";
        let html = texto.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--primary-color);">$1</strong>');
        html = html.replace(/^## (.*$)/gim, '<h3 style="margin-top:15px; margin-bottom:5px;">$1</h3>');
        html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<div style="margin-left:15px; margin-bottom:2px;">• $1</div>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    // --- NAVEGAÇÃO SPA ---
    function nav(sectionId, btnElement) {
        document.querySelectorAll('section').forEach(el => el.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
        
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
        if(btnElement) btnElement.classList.add('active');

        if (sectionId === 'direitos') carregarBeneficios();
        if (sectionId === 'checklist') renderChecklists();
        if (sectionId === 'vagas') carregarVagas();
        if (sectionId === 'home') preencherFormulario();
        if (sectionId === 'simulacao' && chatHistory.length === 0) startSimulation();
    }

    // --- PERFIL ---
    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const checkboxes = document.querySelectorAll('input[name="diagnostico"]:checked');
        const diagnosticosSelecionados = Array.from(checkboxes).map(cb => cb.value);
        const diagnosticosTexto = Array.from(checkboxes).map(cb => cb.getAttribute('data-label')).join(', ');

        if(diagnosticosSelecionados.length === 0) {
            return alert("Por favor, selecione ao menos um diagnóstico.");
        }

        userProfile = {
            nome: document.getElementById('nome').value,
            diagnostico: diagnosticosSelecionados, 
            diagnosticoTexto: diagnosticosTexto,   
            cidade: document.getElementById('cidade').value,
            idade: parseInt(document.getElementById('idade').value),
            renda: parseFloat(document.getElementById('renda').value),
            pessoas: parseInt(document.getElementById('pessoas').value)
        };
        
        localStorage.setItem('merit_profile', JSON.stringify(userProfile));
        alert('Perfil atualizado com sucesso!');
        nav('direitos', document.querySelectorAll('.nav-btn')[1]);
    });

    function preencherFormulario() {
        if(userProfile.nome) document.getElementById('nome').value = userProfile.nome;
        if(userProfile.cidade) document.getElementById('cidade').value = userProfile.cidade;
        if(userProfile.idade) document.getElementById('idade').value = userProfile.idade;
        if(userProfile.renda) document.getElementById('renda').value = userProfile.renda;
        if(userProfile.pessoas) document.getElementById('pessoas').value = userProfile.pessoas;

        if(userProfile.diagnostico && Array.isArray(userProfile.diagnostico)) {
            userProfile.diagnostico.forEach(val => {
                const cb = document.querySelector(`input[name="diagnostico"][value="${val}"]`);
                if(cb) cb.checked = true;
            });
        } else if (userProfile.diagnostico) {
            const cb = document.querySelector(`input[name="diagnostico"][value="${userProfile.diagnostico}"]`);
            if(cb) cb.checked = true;
        }
    }

    // --- DIREITOS ---
    function carregarBeneficios() {
        const container = document.getElementById('lista-beneficios');
        container.innerHTML = '<div class="loading" style="display:block"><span class="spin"></span> Buscando direitos compatíveis...</div>';
        
        if (!userProfile.nome || !userProfile.diagnostico) {
            container.innerHTML = '<div class="card" style="text-align:center; padding: 40px;"><p>Preencha seu perfil e selecione o diagnóstico na aba inicial.</p></div>';
            return;
        }

        if (!BENEFICIOS_DB) {
            setTimeout(carregarBeneficios, 500);
            return;
        }

        container.innerHTML = '';
        const rendaPerCapita = userProfile.renda / userProfile.pessoas;
        let encontrouAlgum = false;

        const userDiags = Array.isArray(userProfile.diagnostico) ? userProfile.diagnostico : [userProfile.diagnostico];

        Object.values(BENEFICIOS_DB).forEach(ben => {
            let elegivel = true;
            if (ben.tags) {
                const temMatch = userDiags.some(diag => ben.tags.includes(diag) || diag === 'outros');
                if (!temMatch) elegivel = false;
            }
            if (ben.criterios_logicos.renda_maxima && rendaPerCapita > (1412 * ben.criterios_logicos.renda_maxima)) elegivel = false;
            if (ben.id === 'bpc' && userDiags.includes('outros') && userDiags.length === 1 && userProfile.idade < 65) elegivel = false;

            if (elegivel) {
                encontrouAlgum = true;
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = `
                    <h3>${ben.nome}</h3>
                    <p style="color: #d1d5db; margin-bottom: 15px;">${ben.descricao}</p>
                    <div style="font-size:0.85rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                        <strong style="color: var(--secondary-color);">Documentos necessários:</strong><br> ${ben.documentos.join(', ')}
                    </div>
                    <button class="btn btn-outline" onclick="iniciarChecklist('${ben.id}')">
                        ${activeChecklists[ben.id] ? 'Continuar Processo →' : 'Iniciar Passo a Passo'}
                    </button>
                `;
                container.appendChild(div);
            }
        });

        if (!encontrouAlgum) {
            container.innerHTML = '<div class="card"><p>Com base nos diagnósticos selecionados e renda, não encontramos benefícios automáticos. Consulte a Defensoria.</p></div>';
        }
    }

    // --- VAGAS ---
    function carregarVagas() {
        const container = document.getElementById('lista-vagas');
        container.innerHTML = '<p class="loading" style="display:block">Carregando oportunidades...</p>';

        if (!VAGAS_DB) {
            setTimeout(carregarVagas, 500);
            return;
        }

        const filtroAfirmativa = document.getElementById('filtroAfirmativa').checked;
        const filtroCompativeis = document.getElementById('filtroCompativeis').checked;
        const habilidadesTexto = document.getElementById('habilidadesInput').value.toLowerCase();
        
        const habilidadesUsuario = habilidadesTexto.split(/[\s,]+/).filter(h => h.length > 2);

        container.innerHTML = ''; 

        const vagasFiltradas = VAGAS_DB.filter(vaga => {
            let passou = true;
            if (filtroAfirmativa && !vaga.afirmativa) passou = false;
            if (filtroCompativeis && habilidadesUsuario.length > 0) {
                const tagsVagaNorm = vaga.tags.map(t => t.toLowerCase());
                const temMatch = habilidadesUsuario.some(habilidade => 
                    tagsVagaNorm.some(tag => tag.includes(habilidade) || habilidade.includes(tag))
                );
                if (!temMatch) passou = false;
            } else if (filtroCompativeis && habilidadesUsuario.length === 0) {
                passou = false;
            }
            return passou;
        });

        if (vagasFiltradas.length === 0) {
            container.innerHTML = '<p>Nenhuma vaga encontrada com esses filtros.</p>';
            return;
        }

        vagasFiltradas.forEach(vaga => {
            const div = document.createElement('div');
            div.className = 'vaga-card';
            const tagsHtml = vaga.tags.map(tag => `<span class="vaga-tag" style="margin-right: 5px;">${tag}</span>`).join('');
            const iconeAfirmativa = vaga.afirmativa ? '<span title="Vaga Reservada" style="margin-left:5px">🌟</span>' : '';

            div.innerHTML = `
                <span class="vaga-empresa">${vaga.empresa}</span>
                <h3>${vaga.cargo} ${iconeAfirmativa}</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin: 8px 0;">${vaga.descricao}</p>
                <div style="margin-bottom: 15px;">${tagsHtml}</div>
                <button class="btn btn-small" style="width: 100%;" onclick="alert('Candidatura enviada para ${vaga.empresa}!')">Candidatar-se</button>
            `;
            container.appendChild(div);
        });
    }

    // --- CHECKLIST ---
    function iniciarChecklist(id) {
        if (!BENEFICIOS_DB) return alert("Dados ainda carregando...");
        if (!activeChecklists[id]) {
            const ben = BENEFICIOS_DB[id];
            activeChecklists[id] = { nome: ben.nome, etapas: ben.checklist.map(txt => ({ texto: txt, feito: false })) };
            localStorage.setItem('merit_checklists', JSON.stringify(activeChecklists));
        }
        nav('checklist', document.querySelectorAll('.nav-btn')[2]);
    }

    function renderChecklists() {
        const container = document.getElementById('checklists-container');
        container.innerHTML = '';
        if (Object.keys(activeChecklists).length === 0) return container.innerHTML = '<div class="card" style="text-align:center; padding:40px;"><p style="color:var(--text-muted)">Nenhum processo ativo.</p></div>';

        Object.entries(activeChecklists).forEach(([key, dados]) => {
            const total = dados.etapas.length;
            const feitos = dados.etapas.filter(e => e.feito).length;
            const porcentagem = total === 0 ? 0 : Math.round((feitos / total) * 100);

            const card = document.createElement('div');
            card.className = 'card';
            let html = `
                <div style="margin-bottom:15px;">
                    <h3 style="margin-bottom:5px;">${dados.nome}</h3>
                    <div class="checklist-progress-container">
                        <div class="checklist-progress-text"><span>Progresso</span><span>${porcentagem}%</span></div>
                        <div class="checklist-progress-bar-bg"><div class="checklist-progress-bar-fill" style="width: ${porcentagem}%"></div></div>
                    </div>
                </div>`;
            dados.etapas.forEach((etapa, idx) => {
                html += `
                    <div class="checklist-item ${etapa.feito ? 'checked' : ''}" onclick="toggleCheck('${key}', ${idx})">
                        <input type="checkbox" ${etapa.feito ? 'checked' : ''} readonly><span>${etapa.texto}</span>
                    </div>`;
            });
            card.innerHTML = html;
            container.appendChild(card);
        });
    }

    function toggleCheck(id, idx) {
        activeChecklists[id].etapas[idx].feito = !activeChecklists[id].etapas[idx].feito;
        localStorage.setItem('merit_checklists', JSON.stringify(activeChecklists));
        renderChecklists();
    }

    // --- IA HELPER ---
    async function callGemini(promptText) {
        try {
            const result = await model.generateContent(promptText);
            const response = await result.response;
            return response.text();
        } catch (e) {
            console.error(e);
            return "Erro ao conectar com a IA. Verifique se sua chave está ativa.";
        }
    }

    // --- FERRAMENTAS ---
    async function analisarLaudo() {
        const texto = document.getElementById('laudoInput').value;
        const out = document.getElementById('resultado-laudo');
        const load = document.getElementById('loading-laudo');
        if (!texto) return alert('Cole o laudo primeiro.');
        load.style.display = 'block'; out.style.display = 'none';
        const prompt = `Analise este laudo médico de uma pessoa com ${userProfile.diagnosticoTexto || 'deficiência'} para fins de INSS/BPC: "${texto}". Responda em HTML com <b>Resumo</b>, <b>Pontos Fortes</b> e <b>O que falta</b>.`;
        const rawText = await callGemini(prompt);
        out.innerHTML = formatarTextoIA(rawText);
        load.style.display = 'none'; out.style.display = 'block';
    }

    async function gerarDocumento() {
        const tipo = document.getElementById('tipoDoc').value;
        const ctx = document.getElementById('contextoDoc').value;
        const out = document.getElementById('resultado-doc');
        const load = document.getElementById('loading-doc');
        load.style.display = 'block'; out.style.display = 'none';
        const prompt = `Escreva um documento formal "${tipo}" para ${userProfile.nome}, Diagnóstico: ${userProfile.diagnosticoTexto}. Contexto: ${ctx}. Use linguagem jurídica adequada e cite leis brasileiras.`;
        const rawText = await callGemini(prompt);
        out.innerHTML = formatarTextoIA(rawText);
        load.style.display = 'none'; out.style.display = 'block';
    }

    async function gerarCurriculo() {
        const skills = document.getElementById('habilidadesInput').value;
        const out = document.getElementById('resultado-cv');
        const load = document.getElementById('loading-cv');
        if (!userProfile.nome) return alert('Preencha seu nome no Perfil primeiro.');
        load.style.display = 'block'; out.style.display = 'none';
        document.getElementById('btnDownloadDocx').style.display = 'none';
        const prompt = `Crie um "Currículo Simplificado" para uma pessoa neurodivergente (${userProfile.diagnosticoTexto}). Nome: ${userProfile.nome}. Habilidades: ${skills}. Cidade: ${userProfile.cidade}. Foque nas potências do diagnóstico e adaptações necessárias.`;
        const textoGerado = await callGemini(prompt);
        out.innerHTML = formatarTextoIA(textoGerado);
        out.dataset.texto = textoGerado;
        load.style.display = 'none'; out.style.display = 'block';
        document.getElementById('btnDownloadDocx').style.display = 'inline-block';
    }

    async function baixarCurriculoDocx() {
        const texto = document.getElementById('resultado-cv').dataset.texto;
        if (!texto) return alert("Gere o currículo primeiro.");
        const { Document, Packer, Paragraph, TextRun } = docx;
        const paragrafos = texto.split('\n').map(linha => new Paragraph({ children: [new TextRun(linha)], spacing: { after: 200 } }));
        const doc = new Document({ sections: [{ properties: {}, children: paragrafos }] });
        Packer.toBlob(doc).then(blob => { saveAs(blob, `Curriculo_${userProfile.nome.replace(/\s+/g, '_')}.docx`); });
    }
    
    // --- NOVAS FERRAMENTAS ---
    async function traduzirJuridiques() {
        const texto = document.getElementById('juridiquesInput').value;
        const out = document.getElementById('resultado-juridiques');
        const load = document.getElementById('loading-juridiques');
        if (!texto) return alert('Cole o texto primeiro.');
        load.style.display = 'block'; out.style.display = 'none';
        const prompt = `Traduza este texto jurídico/burocrático para uma linguagem extremamente simples e clara: "${texto}". Use Markdown para negrito e listas.`;
        const rawText = await callGemini(prompt);
        out.innerHTML = formatarTextoIA(rawText);
        load.style.display = 'none'; out.style.display = 'block';
    }

    async function gerarRotina() {
        const objetivo = document.getElementById('objetivoRotina').value;
        const out = document.getElementById('resultado-rotina');
        const load = document.getElementById('loading-rotina');
        if (!userProfile.diagnosticoTexto) return alert('Preencha seu perfil primeiro.');
        if (!objetivo) return alert('Digite um objetivo.');
        load.style.display = 'block'; out.style.display = 'none';
        const prompt = `Crie uma rotina para um dia focado em "${objetivo}". Perfil: Pessoa com ${userProfile.diagnosticoTexto}, ${userProfile.idade} anos. Leve em conta necessidades específicas (pausas, sobrecarga). Use Markdown.`;
        const rawText = await callGemini(prompt);
        out.innerHTML = formatarTextoIA(rawText);
        load.style.display = 'none'; out.style.display = 'block';
    }

    async function gerarMensagem() {
        const oque = document.getElementById('comunicacaoOque').value;
        const quem = document.getElementById('comunicacaoQuem').value;
        const out = document.getElementById('resultado-msg');
        const load = document.getElementById('loading-msg');
        if (!oque || !quem) return alert('Preencha o que falar e para quem.');
        load.style.display = 'block'; out.style.display = 'none';
        const prompt = `Escreva uma mensagem (email/whatsapp) educada, firme e clara. Remetente: Pessoa com ${userProfile.diagnosticoTexto}. Destinatário: ${quem}. Objetivo: ${oque}. Estilo assertivo.`;
        const rawText = await callGemini(prompt);
        out.innerHTML = formatarTextoIA(rawText);
        load.style.display = 'none'; out.style.display = 'block';
    }

    // --- SIMULAÇÃO ---
    async function startSimulation() {
        chatHistory = [];
        const chatBox = document.getElementById('chat-messages');
        chatBox.innerHTML = '';
        const diag = userProfile.diagnosticoTexto || "sua condição";
        appendMessage('bot', `Olá. Sou o perito do INSS. Vejo aqui que o motivo do requerimento é <b>${diag}</b>.<br><br>Por favor, me explique: como isso afeta seu dia a dia e impede você de trabalhar?`);
    }

    function appendMessage(sender, text) {
        const chatBox = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        if (!text.includes('<') && (text.includes('*') || text.includes('#'))) { div.innerHTML = formatarTextoIA(text); } else { div.innerHTML = text.replace(/\n/g, '<br>'); }
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        const cleanText = text.replace(/<[^>]*>?/gm, '');
        if(sender === 'user') chatHistory.push(`Usuário: ${cleanText}`);
        if(sender === 'bot') chatHistory.push(`Perito: ${cleanText}`);
    }

    function handleEnter(e) { if(e.key === 'Enter') sendMessage(); }

    async function sendMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value;
        if(!text) return;
        appendMessage('user', text);
        input.value = '';
        document.getElementById('chat-typing').style.display = 'block';
        const context = chatHistory.slice(-6).join('\n');
        const prompt = `Você é um simulador de perícia médica do INSS. O usuário tem ${userProfile.diagnosticoTexto}. Contexto: ${context}. Usuário: "${text}". TAREFA: 1. Feedback (ajuda na prova da incapacidade?). 2. Próxima pergunta técnica.`;
        const rawText = await callGemini(prompt);
        document.getElementById('chat-typing').style.display = 'none';
        const formattedReply = rawText.replace('Feedback:', '<b>💡 Feedback:</b>').replace('Perito:', '<br><br><b>👨‍⚕️ Perito:</b>');
        appendMessage('bot', formatarTextoIA(formattedReply));
    }

    // --- OUTROS ---
    async function encontrarDefensoria() {
        const out = document.getElementById('resultado-defensoria');
        const load = document.getElementById('loading-defensoria');
        const cidade = userProfile.cidade || "sua cidade";
        load.style.display = 'block'; out.style.display = 'none';
        const prompt = `Liste locais da Defensoria Pública em ${cidade}. Formato HTML simples com cards (div style="background: #25252e; padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #333;"). Inclua nome, endereço, telefone, horário e um botão <button class="btn btn-small" style="margin-top: 8px; width: 100%; background: var(--surface-hover); border: 1px solid var(--primary-color);" onclick="agendarDefensoria('Nome da Unidade')">📅 Agendar Atendimento</button>.`;
        const rawHtml = await callGemini(prompt);
        const cleanHtml = rawHtml.replace(/```html/g, '').replace(/```/g, '');
        out.innerHTML = cleanHtml;
        load.style.display = 'none'; out.style.display = 'block';
    }

    async function agendarDefensoria(nomeUnidade) {
        const confirmacao = confirm(`Deseja ser redirecionado para o sistema de agendamento oficial de: ${nomeUnidade}?`);
        if(confirmacao) {
            window.open(`https://www.google.com/search?q=agendamento defensoria publica ${userProfile.cidade || ''}`, '_blank');
        }
    }

    async function gerarDeclaracaoPobreza() {
        const out = document.getElementById('resultado-pobreza');
        const load = document.getElementById('loading-pobreza');
        load.style.display = 'block'; out.style.display = 'none';
        const prompt = `Gere uma Declaração de Hipossuficiência para ${userProfile.nome}.`;
        const rawText = await callGemini(prompt);
        out.innerText = rawText;
        load.style.display = 'none'; out.style.display = 'block';
    }

    // Load JSON Data on Start
    loadData();
    // Load Profile from Storage

    preencherFormulario();

