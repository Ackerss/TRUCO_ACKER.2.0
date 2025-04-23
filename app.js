// --- Variáveis Globais ---
let scoreNos = 0, scoreEles = 0;
let prevScoreNos = 0, prevScoreEles = 0;
let isInitialState = true;
const maxScore = 12;
let matchesWonNos = 0, matchesWonEles = 0;
let playerNames = [];
let currentDealerIndex = 0;
let timerIntervalId = null;
let gameStartTime = null;
let matchDurationHistory = [];
let undoState = null;
let teamNameNos = "Nós";
let teamNameEles = "Eles";
let currentTheme = 'dark'; // 'dark' ou 'light'
let wakeLock = null; // Variável para o Wake Lock

// --- Constantes Chaves localStorage ---
const STORAGE_KEYS = {
    SCORE_NOS: 'truco_scoreNos',
    SCORE_ELES: 'truco_scoreEles',
    PREV_SCORE_NOS: 'truco_prevScoreNos',
    PREV_SCORE_ELES: 'truco_prevScoreEles',
    IS_INITIAL: 'truco_isInitial',
    MATCHES_NOS: 'truco_matchesNos',
    MATCHES_ELES: 'truco_matchesEles',
    PLAYER_NAMES: 'truco_playerNames',
    DEALER_INDEX: 'truco_dealerIndex',
    TEAM_NAME_NOS: 'truco_teamNameNos',
    TEAM_NAME_ELES: 'truco_teamNameEles',
    DURATION_HISTORY: 'truco_durationHistory',
    THEME: 'truco_theme'
    // Não salvamos undoState, timerIntervalId, gameStartTime
};

// --- Elementos do DOM ---
const scoreNosElement = document.getElementById('score-nos');
const scoreElesElement = document.getElementById('score-eles');
const prevScoreNosElement = document.getElementById('prev-score-nos');
const prevScoreElesElement = document.getElementById('prev-score-eles');
const matchWinsNosElement = document.getElementById('match-wins-nos');
const matchWinsElesElement = document.getElementById('match-wins-eles');
const dealerNameElement = document.getElementById('current-dealer-name');
const currentTimerElement = document.getElementById('current-timer-display');
const durationHistoryListElement = document.getElementById('duration-history-list');
const undoButton = document.getElementById('undo-button');
const teamNameNosElement = document.getElementById('team-name-nos');
const teamNameElesElement = document.getElementById('team-name-eles');
const themeToggleButton = document.getElementById('theme-toggle-btn');
const bodyElement = document.body;
const themeMeta = document.getElementById('theme-color-meta');

// --- Funções de Armazenamento Local (localStorage) ---

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Erro ao salvar dados no localStorage:", key, e);
    }
}

function loadData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", key, e);
        return defaultValue;
    }
}

function saveGameState() {
    saveData(STORAGE_KEYS.SCORE_NOS, scoreNos);
    saveData(STORAGE_KEYS.SCORE_ELES, scoreEles);
    saveData(STORAGE_KEYS.PREV_SCORE_NOS, prevScoreNos);
    saveData(STORAGE_KEYS.PREV_SCORE_ELES, prevScoreEles);
    saveData(STORAGE_KEYS.IS_INITIAL, isInitialState);
    saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos);
    saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames);
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex);
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos);
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles);
    saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory);
    // Não salva undoState intencionalmente
}

function loadGameState() {
    scoreNos = loadData(STORAGE_KEYS.SCORE_NOS, 0);
    scoreEles = loadData(STORAGE_KEYS.SCORE_ELES, 0);
    prevScoreNos = loadData(STORAGE_KEYS.PREV_SCORE_NOS, 0);
    prevScoreEles = loadData(STORAGE_KEYS.PREV_SCORE_ELES, 0);
    isInitialState = loadData(STORAGE_KEYS.IS_INITIAL, true);
    matchesWonNos = loadData(STORAGE_KEYS.MATCHES_NOS, 0);
    matchesWonEles = loadData(STORAGE_KEYS.MATCHES_ELES, 0);
    playerNames = loadData(STORAGE_KEYS.PLAYER_NAMES, []);
    currentDealerIndex = loadData(STORAGE_KEYS.DEALER_INDEX, 0);
    teamNameNos = loadData(STORAGE_KEYS.TEAM_NAME_NOS, "Nós");
    teamNameEles = loadData(STORAGE_KEYS.TEAM_NAME_ELES, "Eles");
    matchDurationHistory = loadData(STORAGE_KEYS.DURATION_HISTORY, []);
    // Carrega tema salvo ou detecta preferência do sistema
    const savedTheme = loadData(STORAGE_KEYS.THEME);
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Detecta preferência do sistema se não houver nada salvo
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            setTheme('light');
        } else {
            setTheme('dark'); // Padrão é escuro
        }
    }
}

function clearSavedGame() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    // Não limpa o tema salvo aqui, apenas dados do jogo
}

// --- Funções de Display ---
function updateCurrentGameDisplay() { scoreNosElement.textContent = scoreNos; scoreElesElement.textContent = scoreEles; prevScoreNosElement.textContent = isInitialState ? '-' : prevScoreNos; prevScoreElesElement.textContent = isInitialState ? '-' : prevScoreEles; }
function updateMatchWinsDisplay() { matchWinsNosElement.textContent = matchesWonNos; matchWinsElesElement.textContent = matchesWonEles; }
function updateDealerDisplay() { if (playerNames.length === 4) { dealerNameElement.textContent = playerNames[currentDealerIndex]; } else { dealerNameElement.textContent = "-- Digite os nomes --"; } }
function updateDurationHistoryDisplay() { durationHistoryListElement.innerHTML = ''; if (matchDurationHistory.length === 0) { durationHistoryListElement.innerHTML = '<li>Nenhuma partida concluída ainda.</li>'; durationHistoryListElement.style.textAlign = 'center'; durationHistoryListElement.style.color = 'var(--text-color-muted)'; return; } durationHistoryListElement.style.textAlign = 'left'; durationHistoryListElement.style.color = 'var(--text-color-light)'; for (let i = matchDurationHistory.length - 1; i >= 0; i--) { const durationMs = matchDurationHistory[i]; const formattedTime = formatTime(durationMs); const listItem = document.createElement('li'); listItem.textContent = `Partida ${i + 1}: ${formattedTime}`; durationHistoryListElement.appendChild(listItem); } }
function updateTeamNameDisplay() { teamNameNosElement.textContent = teamNameNos; teamNameElesElement.textContent = teamNameEles; }

// --- Função de Síntese de Voz ---
function speakText(text, cancelPrevious = true) {
    if ('speechSynthesis' in window) {
        if (cancelPrevious) { window.speechSynthesis.cancel(); }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    } else { console.warn("Navegador não suporta Síntese de Voz."); }
}

 // --- Funções do Cronômetro ---
 function formatTime(ms) { if (ms === null || ms < 0) return "--:--"; let tS = Math.floor(ms / 1000); let h = Math.floor(tS / 3600); let m = Math.floor((tS % 3600) / 60); let s = tS % 60; m = String(m).padStart(2, '0'); s = String(s).padStart(2, '0'); if (h > 0) { h = String(h).padStart(2, '0'); return `${h}:${m}:${s}`; } else { return `${m}:${s}`; } }
 function startTimer() {
     if (timerIntervalId) { clearInterval(timerIntervalId); }
     gameStartTime = Date.now();
     currentTimerElement.textContent = "00:00";
     timerIntervalId = setInterval(() => {
         if (gameStartTime) { currentTimerElement.textContent = formatTime(Date.now() - gameStartTime); }
         else { clearInterval(timerIntervalId); timerIntervalId = null; }
     }, 1000);
     requestWakeLock(); // Tenta manter a tela acesa ao iniciar o timer
 }
 function stopTimer() {
     if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; }
     let dMs = null; if (gameStartTime) { dMs = Date.now() - gameStartTime; }
     gameStartTime = null;
     releaseWakeLock(); // Libera o bloqueio de tela ao parar o timer
     return dMs;
 }
 function resetCurrentTimerDisplay() { if (timerIntervalId) { clearInterval(timerIntervalId); timerIntervalId = null; } gameStartTime = null; currentTimerElement.textContent = "00:00"; releaseWakeLock(); }

 // --- Funções Wake Lock API ---
 async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock foi liberado.');
                wakeLock = null; // Garante que a variável seja resetada
            });
            console.log('Wake Lock está ativo.');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
            wakeLock = null; // Garante que wakeLock seja null se falhar
        }
    } else {
        console.warn('Wake Lock API não suportada.');
    }
 }

 function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release()
            .then(() => {
                wakeLock = null;
            })
            .catch((err) => {
                 console.error("Erro ao liberar Wake Lock:", err);
                 // Mesmo com erro, consideramos liberado
                 wakeLock = null;
            });
    }
 }
 // Listener para liberar o Wake Lock se a aba ficar inativa
 document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'hidden') {
        console.log('Aba inativa, liberando Wake Lock temporariamente.');
        await releaseWakeLock();
    } else if (document.visibilityState === 'visible' && gameStartTime) {
        // Se a aba voltar e o jogo estiver rodando (timer ativo), tenta readquirir
        console.log('Aba ativa novamente, tentando readquirir Wake Lock.');
        await requestWakeLock();
    }
 });


 // --- Função para pegar Nomes dos Jogadores ---
 function getPlayerNames() {
    playerNames = [];
    alert("Vamos definir os jogadores. O primeiro nome será o primeiro a embaralhar.");
    for (let i = 1; i <= 4; i++) {
        let name = prompt(`Digite o nome do Jogador ${i}:`);
        while (!name || name.trim() === "") {
             alert("Nome inválido. Por favor, digite um nome.");
             name = prompt(`Digite o nome do Jogador ${i}:`);
        }
        playerNames.push(name.trim());
     }
    currentDealerIndex = 0;
    saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames); // Salva nomes
    saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex); // Salva índice inicial
    updateDealerDisplay();
    speakText(`Iniciando. Embaralhador: ${playerNames[0]}`);
    startTimer(); // Inicia timer após pegar nomes
 }

 // --- Função para Editar Nomes das Equipes ---
 function editTeamNames() {
    let newNameNos = prompt("Nome Equipe 1:", teamNameNos);
    if (newNameNos && newNameNos.trim() !== "") { teamNameNos = newNameNos.trim(); }
    let newNameEles = prompt("Nome Equipe 2:", teamNameEles);
    if (newNameEles && newNameEles.trim() !== "") { teamNameEles = newNameEles.trim(); }
    saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos); // Salva nome
    saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles); // Salva nome
    updateTeamNameDisplay();
    speakText("Nomes das equipes atualizados.");
 }

 // --- Função para Avançar o Embaralhador ---
 function advanceDealer(speakAnnounce = false) {
     if (playerNames.length !== 4) {
         if(speakAnnounce) alert("Defina os nomes dos 4 jogadores primeiro.");
         return false;
     }
     currentDealerIndex = (currentDealerIndex + 1) % 4;
     saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex); // Salva novo índice
     updateDealerDisplay();
     if (speakAnnounce) { speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true); }
     return true;
 }

// --- Lógica Principal de Pontuação ---
function changeScore(team, amount, speakTextParam = null) {
    let currentScore = (team === 'nos') ? scoreNos : scoreEles;
    let scoreChanged = false;
    if (amount > 0 && currentScore < maxScore) scoreChanged = true;
    else if (amount < 0 && currentScore > 0) scoreChanged = true;
    if (!scoreChanged) return false;

    // Guarda estado para desfazer ANTES de mudar
    undoState = { sN: scoreNos, sE: scoreEles, psN: prevScoreNos, psE: prevScoreEles, dI: currentDealerIndex, isI: isInitialState };

    prevScoreNos = scoreNos; prevScoreEles = scoreEles; isInitialState = false;
    let winner = null;

    // Atualiza placar
    if (team === 'nos') { scoreNos += amount; if (scoreNos >= maxScore) { scoreNos = maxScore; winner = 'nos'; } else if (scoreNos < 0) { scoreNos = 0; } }
    else { scoreEles += amount; if (scoreEles >= maxScore) { scoreEles = maxScore; winner = 'eles'; } else if (scoreEles < 0) { scoreEles = 0; } }

    updateCurrentGameDisplay();
    const dealerAdvanced = advanceDealer(false); // Avança dealer silenciosamente

    // Fala nome do novo dealer APÓS delay (se avançou e nomes existem)
    if (dealerAdvanced && playerNames.length === 4) {
         setTimeout(() => { speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true); }, 750);
    }

    if (winner) { processMatchEnd(winner); }

    saveGameState(); // Salva o estado após a mudança
    undoButton.disabled = false; // Habilita desfazer
    return true; // Indica que a pontuação mudou
}

// --- Função Desfazer ---
function undoLastAction() {
    if (undoState) {
         scoreNos = undoState.sN; scoreEles = undoState.sE;
         prevScoreNos = undoState.psN; prevScoreEles = undoState.psE;
         currentDealerIndex = undoState.dI; isInitialState = undoState.isI;

         updateCurrentGameDisplay(); updateDealerDisplay();
         saveGameState(); // Salva o estado revertido
         speakText("Ação desfeita");
         undoState = null; undoButton.disabled = true;
    } else {
         speakText("Nada para desfazer"); alert("Nenhuma ação recente...");
    }
}

// Processa Fim de Partida
function processMatchEnd(winnerTeam) {
    const finishedGameDurationMs = stopTimer(); // Para timer e pega duração
    if (finishedGameDurationMs !== null) {
        matchDurationHistory.push(finishedGameDurationMs);
        saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory); // Salva histórico
        updateDurationHistoryDisplay();
    }
    undoState = null; undoButton.disabled = true; // Não pode desfazer fim de partida
    updateCurrentGameDisplay();

    setTimeout(() => {
        let winnerName = (winnerTeam === 'nos') ? teamNameNos : teamNameEles;
        let winMsg = ""; const durationString = formatTime(finishedGameDurationMs);
         if (winnerTeam === 'nos') {
             matchesWonNos++;
             winMsg = `${teamNameNos} Ganhamos!\nDuração: ${durationString}\nPartidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`;
         } else {
             matchesWonEles++;
             winMsg = `${teamNameEles} Ganharam!\nDuração: ${durationString}\nPartidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`;
         }
         saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos); // Salva partidas ganhas
         saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles); // Salva partidas ganhas
         speakText( `${winnerName}` + (winnerTeam === 'nos' ? " ganhamos" : " ganharam") + " a partida", false);
         alert(winMsg);
        updateMatchWinsDisplay();
        prepareNextGame(); // Prepara para o próximo jogo (reseta placar, inicia timer, salva estado)
    }, 300);
}

// Prepara Próximo Jogo
function prepareNextGame() {
    scoreNos = 0; scoreEles = 0; prevScoreNos = 0; prevScoreEles = 0; isInitialState = true;
    undoState = null; undoButton.disabled = true;
    updateCurrentGameDisplay();
    saveGameState(); // Salva o estado zerado do novo jogo
    if (playerNames.length === 4) { startTimer(); } // Inicia timer se nomes existem
    else { resetCurrentTimerDisplay(); }
}

// --- Funções de Reset ---
function resetCurrentGame() {
    if (confirm("Reiniciar apenas o jogo atual (0 a 12)?")) {
       undoState = null; undoButton.disabled = true;
       prepareNextGame(); // Reseta placar 0-12, inicia timer e salva
       speakText("Jogo atual reiniciado");
    }
}
function resetAllScores() {
    if (confirm("!!! ZERAR TODO o placar (Partidas, jogo, NOMES, TEMPOS)?")) {
        clearSavedGame(); // Limpa localStorage
        // Reseta variáveis locais
        matchesWonNos = 0; matchesWonEles = 0;
        playerNames = []; currentDealerIndex = 0;
        stopTimer(); matchDurationHistory = [];
        teamNameNos = "Nós"; teamNameEles = "Eles";
        undoState = null; undoButton.disabled = true;

        // Atualiza displays
        updateMatchWinsDisplay(); updateDealerDisplay();
        updateDurationHistoryDisplay(); resetCurrentTimerDisplay();
        updateTeamNameDisplay();

        getPlayerNames(); // Pede nomes JOGADORES, inicia timer e salva nomes/dealer
        prepareNextGame(); // Garante reset do placar 0-12 (timer já iniciado)
        speakText("Placar geral e nomes zerados");
    }
}

// --- Lógica de Tema ---
function setTheme(themeName) { // themeName = 'light' ou 'dark'
    bodyElement.className = themeName + '-theme'; // Aplica classe ao body
    currentTheme = themeName;
    saveData(STORAGE_KEYS.THEME, themeName); // Salva preferência
    // Atualiza ícone do botão
    themeToggleButton.textContent = themeName === 'dark' ? '☀️' : '🌙';
    // Atualiza meta tag theme-color (opcional)
    themeMeta.content = themeName === 'dark' ? '#1f1f1f' : '#f0f0f0';
}

function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// --- Adiciona Event Listeners ---
function addEventListeners() {
    // Botões de controle de pontos (usando delegação de eventos)
    const teamsDiv = document.querySelector('.teams');
    if (teamsDiv) {
        teamsDiv.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.dataset.amount) {
                const team = event.target.dataset.team;
                const amount = parseInt(event.target.dataset.amount, 10);
                const speak = event.target.dataset.speak; // Pega o texto a falar

                if (changeScore(team, amount)) { // Se a pontuação mudou...
                    if (speak) { // ...e há texto para falar...
                        speakText(speak); // ...fala o ponto/truco
                    }
                }
            }
        });
    }

    // Outros botões
    document.getElementById('next-dealer-btn')?.addEventListener('click', () => advanceDealer(true));
    document.getElementById('undo-button')?.addEventListener('click', undoLastAction);
    document.getElementById('edit-teams-btn')?.addEventListener('click', editTeamNames);
    document.getElementById('reset-game-btn')?.addEventListener('click', resetCurrentGame);
    document.getElementById('reset-all-btn')?.addEventListener('click', resetAllScores);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
}

// --- Inicialização da Aplicação ---
function initializeApp() {
    loadGameState(); // Carrega dados salvos PRIMEIRO

    // Atualiza todos os displays com dados carregados ou padrão
    updateCurrentGameDisplay();
    updateMatchWinsDisplay();
    updateTeamNameDisplay();
    updateDealerDisplay();
    updateDurationHistoryDisplay();
    undoButton.disabled = true; // Desfazer sempre começa desabilitado

    addEventListeners(); // Adiciona listeners aos botões

    // Pede nomes se não existirem, senão inicia/continua timer
    if (playerNames.length !== 4) {
        // Usar setTimeout para evitar prompts bloqueando renderização inicial
         setTimeout(getPlayerNames, 300);
    } else {
        // Se já tem nomes, verifica se um jogo estava em andamento (gameStartTime não é null)
        // Isso requer salvar/carregar gameStartTime, o que complica.
        // Por ora, vamos apenas iniciar o timer se nomes existem, assumindo novo jogo ou continuação.
        // Se quisermos restaurar o timer exato, precisaríamos salvar/carregar gameStartTime.
        // Vamos simplificar e apenas iniciar um novo timer se a página recarregar.
        resetCurrentTimerDisplay(); // Garante que começa em 00:00 ao carregar
        startTimer(); // Inicia timer
    }

    // Tenta adquirir Wake Lock inicial se o jogo está ativo
    if (gameStartTime) { // Se tivéssemos carregado gameStartTime
         requestWakeLock();
    }
}

// Chama a inicialização quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);

</script>

</body>
</html>