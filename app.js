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
let currentTheme = 'dark'; // Padrão inicial
let wakeLock = null;

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
};

// --- Elementos do DOM ---
// (Obtidos dentro de initializeApp para garantir que o DOM esteja pronto)
let scoreNosElement, scoreElesElement, prevScoreNosElement, prevScoreElesElement,
    matchWinsNosElement, matchWinsElesElement, dealerNameElement, currentTimerElement,
    durationHistoryListElement, undoButton, teamNameNosElement, teamNameElesElement,
    themeToggleButton, bodyElement, themeMeta;

// --- Funções de Armazenamento Local (localStorage) ---
function saveData(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error("Erro ao salvar:", key, e); } }
function loadData(key, defaultValue = null) { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : defaultValue; } catch (e) { console.error("Erro ao carregar:", key, e); return defaultValue; } }
function saveGameState() { /* Salva todas as variáveis relevantes */ Object.keys(STORAGE_KEYS).forEach(key => { if (key !== STORAGE_KEYS.THEME) { const varName = key.split('_')[1]; if (typeof window[varName] !== 'undefined') saveData(key, window[varName]); } }); }
function loadGameState() { /* Carrega todas as variáveis relevantes */ scoreNos = loadData(STORAGE_KEYS.SCORE_NOS, 0); scoreEles = loadData(STORAGE_KEYS.SCORE_ELES, 0); prevScoreNos = loadData(STORAGE_KEYS.PREV_SCORE_NOS, 0); prevScoreEles = loadData(STORAGE_KEYS.PREV_SCORE_ELES, 0); isInitialState = loadData(STORAGE_KEYS.IS_INITIAL, true); matchesWonNos = loadData(STORAGE_KEYS.MATCHES_NOS, 0); matchesWonEles = loadData(STORAGE_KEYS.MATCHES_ELES, 0); playerNames = loadData(STORAGE_KEYS.PLAYER_NAMES, []); currentDealerIndex = loadData(STORAGE_KEYS.DEALER_INDEX, 0); teamNameNos = loadData(STORAGE_KEYS.TEAM_NAME_NOS, "Nós"); teamNameEles = loadData(STORAGE_KEYS.TEAM_NAME_ELES, "Eles"); matchDurationHistory = loadData(STORAGE_KEYS.DURATION_HISTORY, []); const savedTheme = loadData(STORAGE_KEYS.THEME); if (savedTheme) { currentTheme = savedTheme; } else { currentTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'; } }
function clearSavedGame() { Object.values(STORAGE_KEYS).forEach(key => { if (key !== STORAGE_KEYS.THEME) localStorage.removeItem(key); }); }

// --- Funções de Display ---
function updateCurrentGameDisplay() { if(scoreNosElement) scoreNosElement.textContent = scoreNos; if(scoreElesElement) scoreElesElement.textContent = scoreEles; if(prevScoreNosElement) prevScoreNosElement.textContent = isInitialState ? '-' : prevScoreNos; if(prevScoreElesElement) prevScoreElesElement.textContent = isInitialState ? '-' : prevScoreEles; }
function updateMatchWinsDisplay() { if(matchWinsNosElement) matchWinsNosElement.textContent = matchesWonNos; if(matchWinsElesElement) matchWinsElesElement.textContent = matchesWonEles; }
function updateDealerDisplay() { if(dealerNameElement) dealerNameElement.textContent = (playerNames.length === 4) ? playerNames[currentDealerIndex] : "-- Digite os nomes --"; }
function updateDurationHistoryDisplay() { if(!durationHistoryListElement) return; durationHistoryListElement.innerHTML = ''; if (matchDurationHistory.length === 0) { durationHistoryListElement.innerHTML = '<li>Nenhuma partida concluída.</li>'; durationHistoryListElement.style.textAlign = 'center'; durationHistoryListElement.style.color = 'var(--text-color-muted)'; return; } durationHistoryListElement.style.textAlign = 'left'; durationHistoryListElement.style.color = 'var(--text-color-light)'; for (let i = matchDurationHistory.length - 1; i >= 0; i--) { const li = document.createElement('li'); li.textContent = `Partida ${i + 1}: ${formatTime(matchDurationHistory[i])}`; durationHistoryListElement.appendChild(li); } }
function updateTeamNameDisplay() { if(teamNameNosElement) teamNameNosElement.textContent = teamNameNos; if(teamNameElesElement) teamNameElesElement.textContent = teamNameEles; }

// --- Função de Síntese de Voz ---
function speakText(text, cancelPrevious = true) { if ('speechSynthesis' in window) { if (cancelPrevious) window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'pt-BR'; u.rate = 1.0; u.pitch = 1.0; window.speechSynthesis.speak(u); } else console.warn("Síntese de Voz não suportada."); }

 // --- Funções do Cronômetro ---
 function formatTime(ms) { if (ms === null || ms < 0) return "--:--"; let tS = Math.floor(ms / 1000); let h = Math.floor(tS / 3600); let m = Math.floor((tS % 3600) / 60); let s = tS % 60; m = String(m).padStart(2, '0'); s = String(s).padStart(2, '0'); return (h > 0) ? `${String(h).padStart(2, '0')}:${m}:${s}` : `${m}:${s}`; }
 function startTimer() { if (timerIntervalId) clearInterval(timerIntervalId); gameStartTime = Date.now(); if(currentTimerElement) currentTimerElement.textContent = "00:00"; timerIntervalId = setInterval(() => { if (gameStartTime && currentTimerElement) currentTimerElement.textContent = formatTime(Date.now() - gameStartTime); else { clearInterval(timerIntervalId); timerIntervalId = null; } }, 1000); requestWakeLock(); }
 function stopTimer() { if (timerIntervalId) clearInterval(timerIntervalId); timerIntervalId = null; let dMs = null; if (gameStartTime) dMs = Date.now() - gameStartTime; gameStartTime = null; releaseWakeLock(); return dMs; }
 function resetCurrentTimerDisplay() { if (timerIntervalId) clearInterval(timerIntervalId); timerIntervalId = null; gameStartTime = null; if(currentTimerElement) currentTimerElement.textContent = "00:00"; releaseWakeLock(); }

 // --- Funções Wake Lock API ---
 async function requestWakeLock() { if ('wakeLock' in navigator) { try { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { console.log('Wake Lock liberado.'); wakeLock = null; }); console.log('Wake Lock ativo.'); } catch (err) { console.error(`Wake Lock falhou: ${err.name}, ${err.message}`); wakeLock = null; } } else console.warn('Wake Lock API não suportada.'); }
 async function releaseWakeLock() { if (wakeLock !== null) { try { await wakeLock.release(); wakeLock = null; } catch(err) { console.error("Erro ao liberar Wake Lock:", err); wakeLock = null; } } }
 document.addEventListener('visibilitychange', async () => { if (wakeLock !== null && document.visibilityState === 'hidden') { await releaseWakeLock(); } else if (document.visibilityState === 'visible' && gameStartTime) { await requestWakeLock(); } });

 // --- Função para pegar Nomes dos Jogadores ---
 function getPlayerNames() { playerNames = []; alert("Vamos definir os jogadores..."); for (let i = 1; i <= 4; i++) { let n = prompt(`Jogador ${i}:`); while (!n?.trim()) { alert("Nome inválido..."); n = prompt(`Jogador ${i}:`); } playerNames.push(n.trim()); } currentDealerIndex = 0; saveData(STORAGE_KEYS.PLAYER_NAMES, playerNames); saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex); updateDealerDisplay(); speakText(`Iniciando. Embaralhador: ${playerNames[0]}`); startTimer(); }

 // --- Função para Editar Nomes das Equipes ---
 function editTeamNames() { let nN = prompt("Nome Equipe 1:", teamNameNos); if (nN?.trim()) teamNameNos = nN.trim(); let nE = prompt("Nome Equipe 2:", teamNameEles); if (nE?.trim()) teamNameEles = nE.trim(); saveData(STORAGE_KEYS.TEAM_NAME_NOS, teamNameNos); saveData(STORAGE_KEYS.TEAM_NAME_ELES, teamNameEles); updateTeamNameDisplay(); speakText("Nomes das equipes atualizados."); }

 // --- Função para Avançar o Embaralhador ---
 function advanceDealer(speakAnnounce = false) { if (playerNames.length !== 4) { if(speakAnnounce) alert("Defina os nomes..."); return false; } currentDealerIndex = (currentDealerIndex + 1) % 4; saveData(STORAGE_KEYS.DEALER_INDEX, currentDealerIndex); updateDealerDisplay(); if (speakAnnounce) speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true); return true; }

// --- Lógica Principal de Pontuação ---
function changeScore(team, amount) {
    let currentScore = (team === 'nos') ? scoreNos : scoreEles; let scoreChanged = false;
    if (amount > 0 && currentScore < maxScore) scoreChanged = true; else if (amount < 0 && currentScore > 0) scoreChanged = true; if (!scoreChanged) return false;

    undoState = { sN: scoreNos, sE: scoreEles, psN: prevScoreNos, psE: prevScoreEles, dI: currentDealerIndex, isI: isInitialState }; // Captura antes
    prevScoreNos = scoreNos; prevScoreEles = scoreEles; isInitialState = false; let winner = null;

    if (team === 'nos') { scoreNos += amount; if (scoreNos >= maxScore) { scoreNos = maxScore; winner = 'nos'; } else if (scoreNos < 0) { scoreNos = 0; } }
    else { scoreEles += amount; if (scoreEles >= maxScore) { scoreEles = maxScore; winner = 'eles'; } else if (scoreEles < 0) { scoreEles = 0; } }

    updateCurrentGameDisplay();
    const dealerAdvanced = advanceDealer(false); // Avança dealer silenciosamente

    if (dealerAdvanced && playerNames.length === 4) { // Fala nome do novo dealer APÓS delay
         setTimeout(() => { speakText(`Embaralhador: ${playerNames[currentDealerIndex]}`, true); }, 750);
    }
    if (winner) { processMatchEnd(winner); }

    saveGameState(); // Salva estado após mudança
    if (undoButton) undoButton.disabled = false; // Habilita desfazer
    return true; // Necessário para o IF no onclick funcionar
}

// --- Função Desfazer ---
function undoLastAction() { if (undoState) { scoreNos = undoState.sN; scoreEles = undoState.sE; prevScoreNos = undoState.psN; prevScoreEles = undoState.psE; currentDealerIndex = undoState.dI; isInitialState = undoState.isI; updateCurrentGameDisplay(); updateDealerDisplay(); saveGameState(); speakText("Ação desfeita"); undoState = null; if(undoButton) undoButton.disabled = true; } else { speakText("Nada para desfazer"); alert("Nenhuma ação recente..."); } }

// Processa Fim de Partida
function processMatchEnd(winnerTeam) {
    const finishedGameDurationMs = stopTimer();
    if (finishedGameDurationMs !== null) { matchDurationHistory.push(finishedGameDurationMs); saveData(STORAGE_KEYS.DURATION_HISTORY, matchDurationHistory); updateDurationHistoryDisplay(); }
    undoState = null; if(undoButton) undoButton.disabled = true; updateCurrentGameDisplay();

    setTimeout(() => {
        let winnerName = (winnerTeam === 'nos') ? teamNameNos : teamNameEles;
        let winMsg = ""; const durationString = formatTime(finishedGameDurationMs);
         if (winnerTeam === 'nos') { matchesWonNos++; winMsg = `${teamNameNos} Ganhamos!\nDuração: ${durationString}\nPartidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`; }
         else { matchesWonEles++; winMsg = `${teamNameEles} Ganharam!\nDuração: ${durationString}\nPartidas: ${teamNameNos} ${matchesWonNos} x ${matchesWonEles} ${teamNameEles}`; }
         saveData(STORAGE_KEYS.MATCHES_NOS, matchesWonNos); saveData(STORAGE_KEYS.MATCHES_ELES, matchesWonEles);
         speakText( `${winnerName}` + (winnerTeam === 'nos' ? " ganhamos" : " ganharam") + " a partida", false);
         alert(winMsg);
        updateMatchWinsDisplay(); prepareNextGame();
    }, 300);
}

// Prepara Próximo Jogo
function prepareNextGame() { scoreNos = 0; scoreEles = 0; prevScoreNos = 0; prevScoreEles = 0; isInitialState = true; undoState = null; if(undoButton) undoButton.disabled = true; updateCurrentGameDisplay(); saveGameState(); if (playerNames.length === 4) startTimer(); else resetCurrentTimerDisplay(); }

// --- Funções de Reset ---
function resetCurrentGame() { if (confirm("Reiniciar apenas o jogo atual (0 a 12)?")) { undoState = null; if(undoButton) undoButton.disabled = true; prepareNextGame(); speakText("Jogo atual reiniciado"); } }
function resetAllScores() { if (confirm("!!! ZERAR TODO o placar (Partidas, jogo, NOMES, TEMPOS)?")) { clearSavedGame(); matchesWonNos = 0; matchesWonEles = 0; playerNames = []; currentDealerIndex = 0; stopTimer(); matchDurationHistory = []; teamNameNos = "Nós"; teamNameEles = "Eles"; undoState = null; if(undoButton) undoButton.disabled = true; updateMatchWinsDisplay(); updateDealerDisplay(); updateDurationHistoryDisplay(); resetCurrentTimerDisplay(); updateTeamNameDisplay(); getPlayerNames(); speakText("Placar geral e nomes zerados"); } }

// --- Lógica de Tema ---
function setTheme(themeName) { if(!bodyElement || !themeToggleButton || !themeMeta) return; bodyElement.className = themeName + '-theme'; currentTheme = themeName; saveData(STORAGE_KEYS.THEME, themeName); themeToggleButton.textContent = themeName === 'dark' ? '☀️' : '🌙'; themeMeta.content = themeName === 'dark' ? '#1f1f1f' : '#f0f0f0'; }
function toggleTheme() { setTheme(currentTheme === 'dark' ? 'light' : 'dark'); }

// --- Adiciona Event Listeners ---
function addEventListeners() {
    const teamsDiv = document.querySelector('.teams');
    if (teamsDiv) {
        teamsDiv.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.dataset.amount) {
                const team = event.target.dataset.team;
                const amount = parseInt(event.target.dataset.amount, 10);
                const speak = event.target.dataset.speak;
                if (changeScore(team, amount) && speak) { speakText(speak); }
            }
        });
    }
    document.getElementById('next-dealer-btn')?.addEventListener('click', () => advanceDealer(true));
    document.getElementById('undo-button')?.addEventListener('click', undoLastAction);
    document.getElementById('edit-teams-btn')?.addEventListener('click', editTeamNames);
    document.getElementById('reset-game-btn')?.addEventListener('click', resetCurrentGame);
    document.getElementById('reset-all-btn')?.addEventListener('click', resetAllScores);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
}

// --- Inicialização da Aplicação ---
function initializeApp() {
    // Obter referências DOM após o carregamento
    scoreNosElement = document.getElementById('score-nos');
    scoreElesElement = document.getElementById('score-eles');
    prevScoreNosElement = document.getElementById('prev-score-nos');
    prevScoreElesElement = document.getElementById('prev-score-eles');
    matchWinsNosElement = document.getElementById('match-wins-nos');
    matchWinsElesElement = document.getElementById('match-wins-eles');
    dealerNameElement = document.getElementById('current-dealer-name');
    currentTimerElement = document.getElementById('current-timer-display');
    durationHistoryListElement = document.getElementById('duration-history-list');
    undoButton = document.getElementById('undo-button');
    teamNameNosElement = document.getElementById('team-name-nos');
    teamNameElesElement = document.getElementById('team-name-eles');
    themeToggleButton = document.getElementById('theme-toggle-btn');
    bodyElement = document.body;
    themeMeta = document.getElementById('theme-color-meta');

    loadGameState(); // Carrega dados salvos

    // Aplica o tema carregado ou detectado
    setTheme(currentTheme);

    // Atualiza displays
    updateCurrentGameDisplay();
    updateMatchWinsDisplay();
    updateTeamNameDisplay();
    updateDealerDisplay();
    updateDurationHistoryDisplay();
    if (undoButton) undoButton.disabled = true;

    addEventListeners(); // Adiciona listeners

    // Pede nomes ou inicia timer
    if (playerNames.length !== 4) {
         setTimeout(getPlayerNames, 300);
    } else {
        resetCurrentTimerDisplay(); // Sempre reseta timer ao carregar página com nomes
        startTimer();
    }
}

// Chama a inicialização quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);