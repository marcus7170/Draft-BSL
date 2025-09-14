document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // ESTADO E CONFIGURAÇÕES GLOBAIS
    // ==========================================================================
    const AppState = {
        screens: {
            initial: document.getElementById('initial-screen'),
            captainSetup: document.getElementById('captain-setup-container'),
            lottery: document.getElementById('lottery-container'),
            draft: document.getElementById('draft-container'),
        },
        showScreen(screenName) {
            Object.values(this.screens).forEach(screen => screen.classList.add('hidden'));
            if (this.screens[screenName]) this.screens[screenName].classList.remove('hidden');
        }
    };

    let draftState = {
        teams: [], pickOrder: [], fullPickOrder: [], currentPickIndex: 0,
        totalRounds: 11, allPlayers: [], selectedCaptainPlayer: null,
        isPickingPosition: false, playerBeingPlaced: null, draftPhase: null,
        pickHistory: [],
    };

    const draftConfig = {
        playerIdentifier: 'id_jogo', playerDisplayName: 'id_jogo', proVipKey: 'destaque', proVipClass: 'pro-player',
        positions: {
            slots: ["GK", "ZAG", "ZAG", "ZAG", "VOL", "VOL", "ALA", "ALA", "MEI", "ST", "ST"],
            filters: ["GK", "ZAG", "VOL", "ALA", "MEI", "ST", "CAP", "TODAS"],
            captainFilters: ["CAP", "TODAS"]
        }
    };

    // ==========================================================================
    // ELEMENTOS DO DOM
    // ==========================================================================
    const btnStartMd3Draft = document.getElementById('btn-start-md3-draft');
    const md3RegistrationModalOverlay = document.getElementById('md3-registration-modal-overlay');
    const md3PlayerListInput = document.getElementById('md3-player-list-input');
    const md3RegisterSubmitBtn = document.getElementById('md3-register-submit-btn');
    const md3RegisterCancelBtn = document.getElementById('md3-register-cancel-btn');
    const btnConfirmarTimes = document.getElementById('btn-confirmar-times');
    const btnIniciarSorteio = document.getElementById('btn-iniciar-sorteio');
    const inputNumeroTimes = document.getElementById('numero-times');
    const btnRefreshStats = document.getElementById('btn-refresh-stats');
    const btnVerTimes = document.getElementById('btn-ver-times');
    const btnVerJogadores = document.getElementById('btn-ver-jogadores');
    const areaEscolha = document.getElementById('area-escolha');
    const areaVisualizacaoTimes = document.getElementById('area-visualizacao-times');
    const draftOrderBar = document.getElementById('draft-order-bar');
    const toggleOrderBtn = document.getElementById('toggle-order-btn');
    const playerPlacementInfo = document.getElementById('player-placement-info');
    const btnAutofillCaptains = document.getElementById('btn-autofill-captains');
    const captainActionsControls = document.getElementById('captain-actions-controls');
    const btnReverterEscolha = document.getElementById('btn-reverter-escolha');
    const btnPularEscolha = document.getElementById('btn-pular-escolha');
    const btnFinalizarDraft = document.getElementById('btn-finalizar-draft');
    const btnResetarDraft = document.getElementById('btn-resetar-draft');
    const btnAtualizarLista = document.getElementById('btn-atualizar-lista');

    // ==========================================================================
    // FUNÇÕES DE LÓGICA
    // ==========================================================================
    window.toggleEditMode = (button) => {
        const isEditing = button.textContent === '✅';
        const elementToEdit = button.previousElementSibling;

        if (isEditing) {
            elementToEdit.contentEditable = 'false';
            elementToEdit.classList.remove('editing-text');
            button.textContent = '✏️';
        } else {
            elementToEdit.contentEditable = 'true';
            elementToEdit.classList.add('editing-text');
            elementToEdit.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(elementToEdit);
            selection.removeAllRanges();
            selection.addRange(range);
            button.textContent = '✅';
        }
    };

    function showMd3RegistrationModal() { md3RegistrationModalOverlay.classList.remove('hidden'); }
    function hideMd3RegistrationModal() { md3RegistrationModalOverlay.classList.add('hidden'); }

    function parseAndRegisterPlayersLocally() {
        const playerListText = md3PlayerListInput.value;
        if (!playerListText.trim()) {
            alert("Por favor, cole a lista de jogadores.");
            return;
        }
        const playersData = new Map();
        const lines = playerListText.trim().split('\n');
        lines.forEach(line => {
            line = line.trim();
            const match = line.match(/([A-Z]+)\d*:\s*(\*)?\s*(.+)/i);
            if (!match) return;
            const [, pos_raw, is_destaque, id_jogo_raw] = match;
            const id_jogo = id_jogo_raw.trim();
            const pos = pos_raw.toUpperCase();
            if (!playersData.has(id_jogo)) {
                playersData.set(id_jogo, { positions: new Set(), destaque: 0 });
            }
            const playerData = playersData.get(id_jogo);
            playerData.positions.add(pos);
            if (is_destaque) playerData.destaque = 1;
        });
        draftState.allPlayers = [];
        playersData.forEach((data, id_jogo) => {
            const sorted_positions = Array.from(data.positions).sort((a) => (a === 'CAP' ? -1 : 1));
            draftState.allPlayers.push({
                id_jogo: id_jogo, posicao: sorted_positions.join(','),
                destaque: data.destaque, escolhido: 0, time_atual: 'N/A', imagem_url: null
            });
        });
        alert(`${draftState.allPlayers.length} jogadores foram processados com sucesso!`);
        hideMd3RegistrationModal();
        AppState.showScreen('captainSetup');
        setupCaptainSelection();
    }

    function updateStats() {
        const statsDisplay = document.getElementById('stats-display');
        statsDisplay.innerHTML = '';
        const total_on = draftState.allPlayers.length;
        const total_pro = draftState.allPlayers.filter(p => p.destaque === 1).length;
        const pos_count = {};
        draftState.allPlayers.forEach(player => {
            player.posicao.split(',').forEach(pos => {
                const p = pos.trim();
                pos_count[p] = (pos_count[p] || 0) + 1;
            });
        });
        const posicoesString = Object.entries(pos_count).sort(([a], [b]) => a.localeCompare(b)).map(([pos, count]) => `${pos}: ${count}`).join(' | ');
        statsDisplay.innerHTML = `
            <div class="stat-item"><strong>Jogadores:</strong> ${total_on}</div>
            <div class="stat-item"><strong>Destaques:</strong> ${total_pro}</div>
            <div class="stat-item positions"><strong>Posições:</strong> ${posicoesString || 'N/A'}</div>`;
    }

    function setupCaptainSelection() {
        updateStats();
        const filters = draftConfig.positions.captainFilters;
        const filtersDiv = document.getElementById('captain-filters');
        filtersDiv.innerHTML = '';
        filters.forEach(filter => {
            const btn = document.createElement('button');
            btn.textContent = filter;
            btn.addEventListener('click', () => {
                document.querySelectorAll('#captain-filters button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderAllPlayersForCaptaincySelection(filter);
            });
            filtersDiv.appendChild(btn);
        });
        filtersDiv.querySelector('button')?.click();
    }
    
    function renderAllPlayersForCaptaincySelection(posicao = 'CAP') {
        let playersToRender = draftState.allPlayers;
        if (posicao.toUpperCase() !== 'TODAS') {
            playersToRender = draftState.allPlayers.filter(p => p.posicao.includes(posicao));
        }
        renderAllPlayersForCaptaincyUI(playersToRender);
    }
    
    function renderAllPlayersForCaptaincyUI(players) {
        const playerListDiv = document.querySelector('#lista-jogadores-geral .player-list');
        playerListDiv.innerHTML = '';
        if (!players || players.length === 0) {
            playerListDiv.innerHTML = '<p>Nenhum jogador encontrado.</p>';
            return;
        }
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `<span>${player[draftConfig.playerDisplayName]}</span>`;
            playerDiv.dataset.playerId = player[draftConfig.playerIdentifier];
            if (player[draftConfig.proVipKey]) playerDiv.classList.add(draftConfig.proVipClass);
            if (draftState.teams.some(t => t.captain && t.captain[draftConfig.playerIdentifier] === player[draftConfig.playerIdentifier])) {
                playerDiv.classList.add('is-captain');
            } else {
                playerDiv.addEventListener('click', () => {
                    document.querySelectorAll('.player-item.selected').forEach(p => p.classList.remove('selected'));
                    playerDiv.classList.add('selected');
                    draftState.selectedCaptainPlayer = player;
                });
            }
            playerListDiv.appendChild(playerDiv);
        });
    }

    function renderCaptainSlots() {
        const slotsDiv = document.querySelector('#area-capitaes .captain-slots');
        slotsDiv.innerHTML = '';
        draftState.teams.forEach(team => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'captain-slot';
            slotDiv.dataset.teamId = team.id;
            slotDiv.textContent = `Time ${team.id} - Vazio`;
            slotDiv.addEventListener('click', () => assignCaptain(team));
            slotsDiv.appendChild(slotDiv);
        });
    }

    function assignCaptain(team) {
        if (!draftState.selectedCaptainPlayer) { alert("Selecione um jogador da lista primeiro."); return; }
        if (draftState.teams.some(t => t.captain && t.captain[draftConfig.playerIdentifier] === draftState.selectedCaptainPlayer[draftConfig.playerIdentifier])) {
            alert("Este jogador já é capitão de outro time."); return;
        }
        team.captain = draftState.selectedCaptainPlayer;
        const slotDiv = document.querySelector(`.captain-slot[data-team-id='${team.id}']`);
        slotDiv.innerHTML = `Time ${team.id} - <span>${team.captain[draftConfig.playerDisplayName]}</span>`;
        slotDiv.classList.add('filled');
        renderAllPlayersForCaptaincySelection(document.querySelector('#captain-filters button.active')?.textContent || 'CAP');
        draftState.selectedCaptainPlayer = null;
        if (draftState.teams.every(t => t.captain)) btnIniciarSorteio.classList.remove('hidden');
    }

    function autofillCaptains() {
        const teamsToFill = draftState.teams.filter(t => !t.captain);
        if (teamsToFill.length === 0) { alert("Todos os times já têm capitães."); return; }
        const assignedCaptainIds = draftState.teams.filter(t => t.captain).map(t => t.captain[draftConfig.playerIdentifier]);
        let availablePlayers = draftState.allPlayers.filter(p => p.posicao.includes('CAP') && !assignedCaptainIds.includes(p[draftConfig.playerIdentifier]));
        if (availablePlayers.length < teamsToFill.length) { alert(`Não há capitães suficientes (${availablePlayers.length}) para preencher os ${teamsToFill.length} times vagos.`); return; }
        availablePlayers.sort(() => Math.random() - 0.5);
        teamsToFill.forEach((team, index) => {
            team.captain = availablePlayers[index];
            const slotDiv = document.querySelector(`.captain-slot[data-team-id='${team.id}']`);
            if(slotDiv){
                slotDiv.innerHTML = `Time ${team.id} - <span>${team.captain[draftConfig.playerDisplayName]}</span>`;
                slotDiv.classList.add('filled');
            }
        });
        renderAllPlayersForCaptaincySelection(document.querySelector('#captain-filters button.active')?.textContent || 'CAP');
        if (draftState.teams.every(t => t.captain)) btnIniciarSorteio.classList.remove('hidden');
    }

    function iniciarSorteio() {
        const teamIds = draftState.teams.map(t => t.id);
        teamIds.sort(() => Math.random() - 0.5);
        draftState.pickOrder = teamIds;
        let fullOrder = [];
        for (let i = 0; i < draftState.totalRounds; i++) {
            const roundOrder = (i % 2 === 0) ? [...draftState.pickOrder] : [...draftState.pickOrder].reverse();
            fullOrder.push(...roundOrder);
        }
        draftState.fullPickOrder = fullOrder;
        animarSorteio();
    }
    
    function animarSorteio() {
        AppState.showScreen('lottery');
        const resultsDiv = document.getElementById('lottery-results');
        resultsDiv.innerHTML = '<h3>Ordem da 1ª Rodada de Escolhas:</h3><ol id="order-list"></ol>';
        const orderList = document.getElementById('order-list');
        const captainNames = draftState.teams.map(t => t.captain[draftConfig.playerDisplayName]);
        draftState.pickOrder.forEach((teamId, index) => {
            const li = document.createElement('li');
            li.className = 'slot';
            const scroller = document.createElement('div');
            scroller.className = 'slot-scroller';
            const shuffledNames = [...captainNames].sort(() => Math.random() - 0.5);
            shuffledNames.push(...shuffledNames);
            scroller.innerHTML = shuffledNames.join('<br>');
            li.appendChild(scroller);
            orderList.appendChild(li);
            setTimeout(() => {
                const correctCaptainName = draftState.teams.find(t => t.id === teamId).captain[draftConfig.playerDisplayName];
                li.classList.add('revealed');
                li.innerHTML = `<strong>#${index + 1}:</strong> Time do ${correctCaptainName}`;
            }, 2500 + (index * 150));
        });
    
        setTimeout(() => {
            autoPlaceCaptains();
            AppState.showScreen('draft');
            inicializarInterfaceDraft();
        }, 2500 + (draftState.pickOrder.length * 150) + 1500);
    }
    
    function autoPlaceCaptains() {
        draftState.pickOrder.forEach((teamId, index) => {
            const team = draftState.teams.find(t => t.id === teamId);
            const captain = team.captain;
            const captainInMasterList = draftState.allPlayers.find(p => p.id_jogo === captain.id_jogo);
            if (captainInMasterList) captainInMasterList.escolhido = 1;

            const secondaryPositions = captain.posicao.split(',').filter(p => p.trim() !== 'CAP');
            let assignedSlotKey = null;

            for (const pos of secondaryPositions) {
                const emptySlotIndex = draftConfig.positions.slots.findIndex((slotPos, i) => {
                    const slotKey = `${slotPos}-${i}`;
                    return slotPos === pos && !team.players.some(p => p.slotKey === slotKey);
                });
                if (emptySlotIndex !== -1) {
                    assignedSlotKey = `${draftConfig.positions.slots[emptySlotIndex]}-${emptySlotIndex}`;
                    break;
                }
            }

            if (!assignedSlotKey) {
                const firstEmptyIndex = draftConfig.positions.slots.findIndex((slotPos, i) => {
                    const slotKey = `${slotPos}-${i}`;
                    return !team.players.some(p => p.slotKey === slotKey);
                });
                if (firstEmptyIndex !== -1) {
                    assignedSlotKey = `${draftConfig.positions.slots[firstEmptyIndex]}-${firstEmptyIndex}`;
                }
            }

            if (assignedSlotKey) {
                team.players.push({ ...captain, slotKey: assignedSlotKey });
                draftState.pickHistory.push({
                    player: captain, timeId: team.id,
                    slotKey: assignedSlotKey, pickIndex: index
                });
            }
        });
        draftState.currentPickIndex = draftState.teams.length;
    }


    function showTeamsView() {
        areaEscolha.classList.add('hidden');
        areaVisualizacaoTimes.classList.remove('hidden');
        btnVerTimes.classList.add('hidden');
        btnVerJogadores.classList.remove('hidden');
    }

    function showPlayersView() {
        if (draftState.isPickingPosition) exitPositionPickingMode();
        areaEscolha.classList.remove('hidden');
        areaVisualizacaoTimes.classList.add('hidden');
        btnVerTimes.classList.remove('hidden');
        btnVerJogadores.classList.add('hidden');
    }

    function inicializarInterfaceDraft() {
        const filtrosContainer = document.getElementById('filtros-posicao');
        filtrosContainer.innerHTML = '';
        draftConfig.positions.filters.forEach(pos => {
            const button = document.createElement('button');
            button.textContent = pos;
            button.addEventListener('click', () => {
                document.querySelectorAll('#filtros-posicao button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                buscarJogadoresDisponiveis(pos);
            });
            filtrosContainer.appendChild(button);
        });
        
        renderizarListaDisponiveis(draftState.allPlayers);
        renderizarTimes();
        refreshPlayerListVisibility();
        renderDraftOrderBar();
        draftOrderBar.classList.remove('hidden');
        filtrosContainer.querySelector('button:last-child')?.click();
        atualizarInfoTurno();
    }

    function renderizarTimes() {
        const areaTimes = document.getElementById('area-times');
        areaTimes.innerHTML = '';
        draftState.pickOrder.forEach(teamId => {
            const team = draftState.teams.find(t => t.id === teamId);
            if (!team) return;

            const timeDiv = document.createElement('div');
            timeDiv.className = 'time-container';
            timeDiv.id = `time-${team.id}`;
            const captainName = team.captain[draftConfig.playerDisplayName];
            
            timeDiv.innerHTML = `
                <div class="time-header">
                    <h3 data-original-name="Time do ${captainName}">Time do ${captainName}</h3>
                    <button class="edit-btn" onclick="toggleEditMode(this)">✏️</button>
                </div>`;

            const listaJogadoresUl = document.createElement('ul');
            listaJogadoresUl.className = 'lista-jogadores';
            
            draftConfig.positions.slots.forEach((pos, index) => {
                const slotKey = `${pos}-${index}`;
                const jogadorNoSlot = team.players.find(p => p.slotKey === slotKey);
                const slotLi = document.createElement('li');
                slotLi.dataset.slotId = slotKey;
                slotLi.dataset.teamId = team.id;
                
                if (jogadorNoSlot) {
                    const displayName = jogadorNoSlot[draftConfig.playerDisplayName];
                    slotLi.innerHTML = `
                        <span class="posicao">${pos}</span>
                        <div class="player-name-container">
                            <span class="nome-jogador-time" data-original-name="${displayName}">${displayName}</span>
                            <button class="edit-btn" onclick="toggleEditMode(this)">✏️</button>
                        </div>`;
                    slotLi.classList.add('filled-slot');
                    slotLi.dataset.playerId = jogadorNoSlot[draftConfig.playerIdentifier];
                } else {
                    slotLi.innerHTML = `<span class="posicao">${pos}</span><span class="nome-jogador-time">Vazio</span>`;
                    slotLi.classList.add('empty-slot');
                }
                listaJogadoresUl.appendChild(slotLi);
            });
            timeDiv.appendChild(listaJogadoresUl);
            areaTimes.appendChild(timeDiv);
        });
    }
    
    function refreshPlayerListVisibility() {
        const activeFilter = document.querySelector('#filtros-posicao .active');
        const filterText = activeFilter ? activeFilter.textContent : 'TODAS';
        buscarJogadoresDisponiveis(filterText);
    }

    function buscarJogadoresDisponiveis(posicao = 'TODAS') {
        const listaDisponiveis = document.getElementById('lista-disponiveis');
        const todosOsCards = listaDisponiveis.querySelectorAll('.jogador-disponivel');
        const posUpper = posicao.toUpperCase();
        let countVisiveis = 0;

        todosOsCards.forEach(card => {
            const jogador = draftState.allPlayers.find(p => p.id_jogo === card.dataset.playerId);
            
            if (!jogador || jogador.escolhido) {
                card.classList.add('filtered-out');
                return;
            }

            const correspondeAoFiltro = (posUpper === 'TODAS' || jogador.posicao.includes(posUpper));
            
            if (correspondeAoFiltro) {
                card.classList.remove('filtered-out');
                countVisiveis++;
            } else {
                card.classList.add('filtered-out');
            }
        });

        let msgEl = listaDisponiveis.querySelector('.no-players-msg');
        if (countVisiveis === 0) {
            if (!msgEl) {
                msgEl = document.createElement('p');
                msgEl.className = 'no-players-msg';
                msgEl.textContent = 'Nenhum jogador disponível para esta posição.';
                listaDisponiveis.appendChild(msgEl);
            }
        } else if (msgEl) {
            msgEl.remove();
        }
    }

    function renderizarListaDisponiveis(jogadores) {
        const listaDisponiveis = document.getElementById('lista-disponiveis');
        listaDisponiveis.innerHTML = '';
        if (jogadores.length === 0) { return; }
        const fragment = document.createDocumentFragment();
        jogadores.forEach(jogador => {
            const divJogador = document.createElement('div');
            divJogador.className = 'jogador-disponivel';
            divJogador.dataset.playerId = jogador[draftConfig.playerIdentifier];
            if (jogador[draftConfig.proVipKey]) divJogador.classList.add(draftConfig.proVipClass);
            const displayName = jogador[draftConfig.playerDisplayName];
            divJogador.innerHTML = `
                <div class="jogador-texto">
                    <div class="info-principal"><strong class="nome-jogador" title="${displayName}">${displayName}</strong></div>
                    <div class="info-secundaria">
                        <span class="time-jogador">Time: ${jogador.time_atual || 'N/A'}</span>
                        <span class="posicao-jogador">${(jogador.posicao || 'N/A').substring(0, 15)}</span>
                    </div>
                </div>`;
            divJogador.addEventListener('click', () => draftarJogador(jogador));
            fragment.appendChild(divJogador);
        });
        listaDisponiveis.appendChild(fragment);
    }

    function draftarJogador(jogador) {
        if (draftState.draftPhase !== 'NORMAL_DRAFT') return;
        const timeDaVezId = draftState.fullPickOrder[draftState.currentPickIndex];
        const timeDaVez = draftState.teams.find(t => t.id === timeDaVezId);
        const nomeTimeCap = timeDaVez.captain[draftConfig.playerDisplayName];
        if (confirm(`Draftar ${jogador[draftConfig.playerDisplayName]} para o Time do ${nomeTimeCap}?`)) {
            draftState.playerBeingPlaced = jogador;
            enterPositionPickingMode();
        }
    }

    function enterPositionPickingMode() {
        draftState.isPickingPosition = true;
        draftState.draftPhase = 'PICKING_POSITION';
        document.body.classList.add('picking-position-mode');
        const timeDaVezId = draftState.fullPickOrder[draftState.currentPickIndex];
        const teamContainer = document.getElementById(`time-${timeDaVezId}`);
        showTeamsView();
        const jogador = draftState.playerBeingPlaced;
        playerPlacementInfo.classList.remove('hidden');
        playerPlacementInfo.innerHTML = `Escolhendo posição para: <strong>${jogador[draftConfig.playerDisplayName]}</strong> (${jogador.posicao})`;
        teamContainer.classList.add('picking-team');
        teamContainer.querySelectorAll('.empty-slot').forEach(slot => {
            slot.addEventListener('click', handleSlotSelection);
        });
    }
    
    function exitPositionPickingMode() {
        document.body.classList.remove('picking-position-mode');
        playerPlacementInfo.classList.add('hidden');
        document.querySelectorAll('.time-container.picking-team').forEach(container => {
            container.classList.remove('picking-team');
            container.querySelectorAll('.empty-slot').forEach(slot => {
                slot.replaceWith(slot.cloneNode(true));
            });
        });
        draftState.isPickingPosition = false;
        draftState.playerBeingPlaced = null;
    }
    
    function handleSlotSelection(event) {
        const slotElement = event.currentTarget;
        const timeId = parseInt(slotElement.dataset.teamId, 10);
        const slotKey = slotElement.dataset.slotId;
        const newPlayer = draftState.playerBeingPlaced;
        finalizeDraft(newPlayer, timeId, slotKey, slotElement);
    }
    
    function finalizeDraft(jogador, timeId, slotKey, slotElement) {
        const playerInState = draftState.allPlayers.find(p => p.id_jogo === jogador.id_jogo);
        if (playerInState) playerInState.escolhido = 1;
        draftState.pickHistory.push({ player: jogador, timeId: timeId, slotKey: slotKey, pickIndex: draftState.currentPickIndex });
        const team = draftState.teams.find(t => t.id === timeId);
        team.players.push({ ...jogador, slotKey });
        exitPositionPickingMode();
        refreshPlayerListVisibility();
        renderizarTimes();
        showTeamsView();
        setTimeout(() => {
            avancarTurno();
        }, 500);
    }

    function avancarTurno() {
        draftState.currentPickIndex++;
        while (draftState.currentPickIndex < draftState.fullPickOrder.length) {
            const timeDaVezId = draftState.fullPickOrder[draftState.currentPickIndex];
            const team = draftState.teams.find(t => t.id === timeDaVezId);
            if (team && team.players.length < draftState.totalRounds) {
                atualizarInfoTurno();
                return;
            }
            draftState.currentPickIndex++;
        }
        draftState.draftPhase = 'FINISHED';
        atualizarInfoTurno();
    }

    function atualizarInfoTurno() {
        if (draftState.currentPickIndex >= draftState.fullPickOrder.length) {
             draftState.draftPhase = 'FINISHED';
        }
        if (draftState.draftPhase === 'FINISHED') {
            document.getElementById('info-turno').innerHTML = '<h2>DRAFT FINALIZADO!</h2>';
            showTeamsView();
            btnReverterEscolha.disabled = true;
            btnPularEscolha.disabled = true;
            btnFinalizarDraft.disabled = true;
            return;
        }
        btnReverterEscolha.disabled = draftState.pickHistory.length === 0;
        btnPularEscolha.disabled = false;
        btnFinalizarDraft.disabled = false;
        
        const timeDaVezId = draftState.fullPickOrder[draftState.currentPickIndex];
        const team = draftState.teams.find(t => t.id === timeDaVezId);
        if (!team) { avancarTurno(); return; }
        
        const captainName = team.captain[draftConfig.playerDisplayName];
        const rodada = Math.floor(draftState.currentPickIndex / draftState.teams.length) + 1;
        
        draftState.draftPhase = 'NORMAL_DRAFT';
        document.getElementById('info-turno').innerHTML = `<h2>Vez do Time do ${captainName} - Rodada ${rodada}</h2>`;
        showPlayersView();
        updateDraftOrderHighlight();
    }

    function renderDraftOrderBar() {
        const orderContent = document.getElementById('draft-order-content');
        orderContent.innerHTML = '';
        draftState.pickOrder.forEach((teamId, index) => {
            const captainName = draftState.teams.find(t => t.id === teamId).captain[draftConfig.playerDisplayName];
            const item = document.createElement('div');
            item.className = 'pick-order-item';
            item.id = `pick-order-team-${teamId}`;
            item.innerHTML = `<strong>#${index + 1}:</strong> Time ${captainName}`;
            orderContent.appendChild(item);
        });
    }

    function updateDraftOrderHighlight() {
        document.querySelectorAll('.pick-order-item.current-pick').forEach(el => el.classList.remove('current-pick'));
        if (draftState.currentPickIndex < draftState.fullPickOrder.length) {
            const currentTeamId = draftState.fullPickOrder[draftState.currentPickIndex];
            const currentPickElement = document.getElementById(`pick-order-team-${currentTeamId}`);
            if (currentPickElement) {
                currentPickElement.classList.add('current-pick');
                currentPickElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }
    
    function revertLastPick() {
        if (draftState.pickHistory.length === 0) return;
        if (draftState.pickHistory.length <= draftState.teams.length) {
            alert("Não é possível reverter a escolha automática dos capitães.");
            return;
        }
        if (!confirm("Tem certeza que deseja reverter a última escolha?")) return;
        
        const lastPick = draftState.pickHistory.pop();
        const { player, timeId, pickIndex } = lastPick;
        const playerInState = draftState.allPlayers.find(p => p.id_jogo === player.id_jogo);
        if (playerInState) playerInState.escolhido = 0;

        draftState.currentPickIndex = pickIndex;
        const team = draftState.teams.find(t => t.id === timeId);
        team.players = team.players.filter(p => p[draftConfig.playerIdentifier] !== player[draftConfig.playerIdentifier]);
        
        renderizarTimes();
        refreshPlayerListVisibility();
        atualizarInfoTurno();
        alert(`A escolha de ${player[draftConfig.playerDisplayName]} foi revertida.`);
    }
    
    function skipPick() {
        if (draftState.draftPhase !== 'FINISHED' && confirm("Tem certeza que deseja pular esta escolha?")) {
            avancarTurno();
        }
    }

    function finalizarDraftManualmente() {
        if (confirm("Tem certeza que deseja finalizar o draft manualmente?")) {
            draftState.draftPhase = 'FINISHED';
            atualizarInfoTurno();
        }
    }

    // ==========================================================================
    // INICIALIZAÇÃO E EVENT LISTENERS
    // ==========================================================================
    btnStartMd3Draft.addEventListener('click', showMd3RegistrationModal);
    md3RegisterSubmitBtn.addEventListener('click', parseAndRegisterPlayersLocally);
    md3RegisterCancelBtn.addEventListener('click', hideMd3RegistrationModal);
    btnConfirmarTimes.addEventListener('click', () => {
        const numTimes = parseInt(inputNumeroTimes.value, 10);
        if (numTimes < 2) { alert("O número de times deve ser no mínimo 2."); return; }
        draftState.teams = Array.from({ length: numTimes }, (_, i) => ({ id: i + 1, captain: null, players: [] }));
        draftState.totalRounds = draftConfig.positions.slots.length;
        renderCaptainSlots();
        document.querySelector('.setup-controls').classList.add('hidden');
        captainActionsControls.classList.remove('hidden');
    });
    btnIniciarSorteio.addEventListener('click', iniciarSorteio);
    btnRefreshStats.addEventListener('click', updateStats);
    btnAutofillCaptains.addEventListener('click', autofillCaptains);
    btnReverterEscolha.addEventListener('click', revertLastPick);
    btnPularEscolha.addEventListener('click', skipPick);
    btnFinalizarDraft.addEventListener('click', finalizarDraftManualmente);
    btnVerTimes.addEventListener('click', showTeamsView);
    btnVerJogadores.addEventListener('click', showPlayersView);
    toggleOrderBtn.addEventListener('click', () => {
        const content = document.getElementById('draft-order-content');
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'flex' : 'none';
        toggleOrderBtn.textContent = isHidden ? 'Mostrar' : 'Esconder';
    });
    btnResetarDraft.addEventListener('click', () => {
        if (confirm("🚨 TEM CERTEZA? Esta ação irá resetar o draft e recarregar a página.")) {
            location.reload();
        }
    });
    btnAtualizarLista.addEventListener('click', () => {
        refreshPlayerListVisibility();
    });

    AppState.showScreen('initial');
});
