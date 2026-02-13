class FootballTeamManager {
    constructor() {
        this.players = this.loadData('players') || [];
        this.trainings = this.loadData('trainings') || [];
        this.matches = this.loadData('matches') || [];
        this.attendances = this.loadData('attendances') || {};
        this.matchStats = this.loadData('matchStats') || {};
        this.tactics = this.loadData('tactics') || [];
        this.currentMatchFilter = 'all';
        this.standings = this.loadData('standings') || this.getDefaultStandings();
        this.coaches = ['André', 'Lucas', 'Aristote', 'Patrick'];
        this.coachAssignments = this.loadData('coachAssignments') || {};
        this.matchSheets = this.loadData('matchSheets') || {}; // Feuilles de match avec 4 mi-temps
        this.init();
    }

    init() {
        this.setupNavigation();
        this.renderPlayers();
        this.renderTeams();
        this.renderTrainings();
        this.renderMatches();
        this.renderTactics();
        this.renderStandings();
        this.renderPerformances();
        this.renderUpcomingMatches();
        this.charts = {}; // Stocker les instances des graphiques
    }

    loadData(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Export toutes les données en JSON
    exportAllData() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: {
                players: this.players,
                trainings: this.trainings,
                matches: this.matches,
                attendances: this.attendances,
                matchStats: this.matchStats,
                tactics: this.tactics,
                standings: this.standings
            }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `meyrin-ff14-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        alert('✅ Sauvegarde téléchargée avec succès !');
    }

    // Import des données depuis un fichier JSON
    importAllData(file) {
        if (!file) {
            alert('❌ Aucun fichier sélectionné');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                
                // Vérifier que le contenu n'est pas vide
                if (!content || content.trim() === '') {
                    alert('❌ Le fichier est vide');
                    return;
                }

                // Parser le JSON
                let importData;
                try {
                    importData = JSON.parse(content);
                } catch (parseError) {
                    console.error('Erreur de parsing JSON:', parseError);
                    alert('❌ Fichier invalide : Le fichier n\'est pas au format JSON correct.\n\nDétail : ' + parseError.message);
                    return;
                }
                
                // Vérifier la structure
                if (!importData || typeof importData !== 'object') {
                    alert('❌ Fichier invalide : Le contenu n\'est pas un objet JSON valide');
                    return;
                }

                if (!importData.data) {
                    alert('❌ Fichier invalide : La structure est incorrecte (propriété "data" manquante)');
                    return;
                }

                // Afficher le résumé
                const confirmMessage = `🔄 Confirmer l'importation ?\n\n` +
                    `📅 Date de sauvegarde : ${importData.exportDate ? new Date(importData.exportDate).toLocaleDateString('fr-FR') : 'Inconnue'}\n` +
                    `📦 Version : ${importData.version || 'Non spécifiée'}\n\n` +
                    `Données à importer :\n` +
                    `• ${importData.data.players?.length || 0} joueuses\n` +
                    `• ${importData.data.matches?.length || 0} matchs\n` +
                    `• ${importData.data.trainings?.length || 0} entraînements\n` +
                    `• ${importData.data.tactics?.length || 0} tactiques\n\n` +
                    `⚠️ Cela remplacera TOUTES vos données actuelles !`;

                if (!confirm(confirmMessage)) {
                    return;
                }

                // Importer les données
                this.players = importData.data.players || [];
                this.trainings = importData.data.trainings || [];
                this.matches = importData.data.matches || [];
                this.attendances = importData.data.attendances || {};
                this.matchStats = importData.data.matchStats || {};
                this.tactics = importData.data.tactics || [];
                this.standings = importData.data.standings || this.getDefaultStandings();

                // Sauvegarder dans localStorage
                this.saveData('players', this.players);
                this.saveData('trainings', this.trainings);
                this.saveData('matches', this.matches);
                this.saveData('attendances', this.attendances);
                this.saveData('matchStats', this.matchStats);
                this.saveData('tactics', this.tactics);
                this.saveData('standings', this.standings);

                // Rafraîchir l'affichage
                this.renderPlayers();
                this.renderTeams();
                this.renderTrainings();
                this.renderMatches();
                this.renderTactics();
                this.renderStandings();
                this.renderPerformances();
                this.renderUpcomingMatches();

                alert(`✅ Importation réussie !\n\n` +
                    `${this.players.length} joueuses importées\n` +
                    `${this.matches.length} matchs importés\n` +
                    `${this.trainings.length} entraînements importés\n` +
                    `${this.tactics.length} tactiques importées`);
                
            } catch (error) {
                console.error('Erreur d\'importation:', error);
                alert(`❌ Erreur lors de l'importation\n\nDétail technique : ${error.message}\n\nVérifiez que le fichier n'est pas corrompu.`);
            }
        };

        reader.onerror = (error) => {
            console.error('Erreur de lecture du fichier:', error);
            alert('❌ Impossible de lire le fichier');
        };

        reader.readAsText(file);
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                
                e.target.classList.add('active');
                const viewId = e.target.dataset.view + '-view';
                document.getElementById(viewId).classList.add('active');
            });
        });
    }

    renderPlayers() {
        const container = document.getElementById('players-list');
        
        if (this.players.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚽</div>
                    <div class="empty-state-text">Aucun joueur enregistré. Ajoutez votre premier joueur !</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.players.map(player => `
            <div class="player-card">
                <div class="player-card-header">
                    <div class="player-actions">
                        <button class="btn-icon" onclick="app.editPlayer('${player.id}')" title="Modifier">✏️</button>
                        <button class="btn-icon" onclick="app.deletePlayer('${player.id}')" title="Supprimer">🗑️</button>
                    </div>
                </div>
                <div class="player-name">${player.name}</div>
                <div class="player-position">${player.position}</div>
                <div class="player-info">
                    <div>📅 Née en ${player.birthyear}</div>
                    ${player.phone ? `<div>📞 ${player.phone}</div>` : ''}
                    ${player.notes ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 13px; color: #555; white-space: pre-line;">📝 ${player.notes}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderTeams() {
        const team1Container = document.getElementById('team1-list');
        const team2Container = document.getElementById('team2-list');
        const ff17Container = document.getElementById('ff17-list');

        const existingUnassigned = document.querySelector('#equipes-view .unassigned-section');
        if (existingUnassigned) {
            existingUnassigned.remove();
        }

        if (this.players.length === 0) {
            const emptyMsg = '<p style="color: #999; text-align: center; padding: 40px;">Aucune joueuse disponible</p>';
            team1Container.innerHTML = emptyMsg;
            team2Container.innerHTML = emptyMsg;
            ff17Container.innerHTML = emptyMsg;
            return;
        }

        const team1Players = this.players.filter(p => p.teams && p.teams.includes('team1'));
        const team2Players = this.players.filter(p => p.teams && p.teams.includes('team2'));
        const ff17Players = this.players.filter(p => p.teams && p.teams.includes('ff17'));

        team1Container.innerHTML = team1Players.length === 0 ? 
            '<p style="color: #999; font-style: italic; text-align: center; padding: 20px;">Aucune joueuse assignée</p>' :
            team1Players.map(player => this.renderTeamPlayerItem(player, 'team1')).join('');

        team2Container.innerHTML = team2Players.length === 0 ? 
            '<p style="color: #999; font-style: italic; text-align: center; padding: 20px;">Aucune joueuse assignée</p>' :
            team2Players.map(player => this.renderTeamPlayerItem(player, 'team2')).join('');

        ff17Container.innerHTML = ff17Players.length === 0 ? 
            '<p style="color: #999; font-style: italic; text-align: center; padding: 20px;">Aucune joueuse assignée</p>' :
            ff17Players.map(player => this.renderTeamPlayerItem(player, 'ff17')).join('');

        const unassignedPlayers = this.players.filter(p => !p.teams || p.teams.length === 0);
        if (unassignedPlayers.length > 0) {
            const unassignedHtml = `
                <div class="unassigned-section" style="grid-column: 1 / -1; margin-top: 30px;">
                    <h3 style="color: #333; margin-bottom: 20px;">Joueuses non assignées (${unassignedPlayers.length})</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px;">
                        ${unassignedPlayers.map(player => `
                            <div class="team-player-item">
                                <div class="team-player-info">
                                    <div class="team-player-name">${player.name}</div>
                                    <div class="team-player-position">${player.position}</div>
                                </div>
                                <div class="team-actions" style="flex-wrap: wrap;">
                                    <button class="btn-secondary" style="padding: 6px 10px; font-size: 11px;" 
                                            onclick="app.assignPlayerToTeam('${player.id}', 'team1')">M1</button>
                                    <button class="btn-secondary" style="padding: 6px 10px; font-size: 11px;" 
                                            onclick="app.assignPlayerToTeam('${player.id}', 'team2')">M2</button>
                                    <button class="btn-secondary" style="padding: 6px 10px; font-size: 11px;" 
                                            onclick="app.assignPlayerToTeam('${player.id}', 'ff17')">FF17</button>
                                    <button class="btn-primary" style="padding: 6px 10px; font-size: 11px;" 
                                            onclick="app.assignPlayerToMultipleTeams('${player.id}')">Toutes</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.querySelector('#equipes-view > div').insertAdjacentHTML('beforeend', unassignedHtml);
        }
    }

    renderTeamPlayerItem(player, currentTeam) {
        const teamCount = player.teams ? player.teams.length : 0;
        const teamNames = {
            'team1': 'M1',
            'team2': 'M2',
            'ff17': 'FF17'
        };
        
        let badge = '';
        if (teamCount > 1) {
            const teamLabels = player.teams.map(t => teamNames[t]).join(' + ');
            badge = `<span class="team-badge multiple">${teamLabels}</span>`;
        }
        
        const otherTeams = ['team1', 'team2', 'ff17'].filter(t => t !== currentTeam && (!player.teams || !player.teams.includes(t)));
        
        return `
            <div class="team-player-item">
                <div class="team-player-info">
                    <div class="team-player-name">
                        ${player.name}
                        ${badge}
                    </div>
                    <div class="team-player-position">${player.position}</div>
                </div>
                <div class="team-actions">
                    ${otherTeams.map(team => `
                        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" 
                                onclick="app.addPlayerToSecondTeam('${player.id}', '${team}')">+ ${teamNames[team]}</button>
                    `).join('')}
                    <button class="btn-icon" onclick="app.removePlayerFromTeam('${player.id}', '${currentTeam}')" 
                            title="Retirer de cette équipe">🗑️</button>
                </div>
            </div>
        `;
    }

    assignPlayerToTeam(playerId, team) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        if (!player.teams) {
            player.teams = [];
        }

        if (!player.teams.includes(team)) {
            player.teams.push(team);
        }

        this.saveData('players', this.players);
        this.renderTeams();
    }

    assignPlayerToMultipleTeams(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        player.teams = ['team1', 'team2', 'ff17'];
        this.saveData('players', this.players);
        this.renderTeams();
    }

    addPlayerToSecondTeam(playerId, team) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        if (!player.teams) {
            player.teams = [];
        }

        if (!player.teams.includes(team)) {
            player.teams.push(team);
        }

        this.saveData('players', this.players);
        this.renderTeams();
    }

    removePlayerFromTeam(playerId, team) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        if (player.teams) {
            player.teams = player.teams.filter(t => t !== team);
        }

        this.saveData('players', this.players);
        this.renderTeams();
    }

    renderTrainings() {
        const container = document.getElementById('trainings-list');
        
        if (this.trainings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏃</div>
                    <div class="empty-state-text">Aucun entraînement planifié.</div>
                </div>
            `;
            return;
        }

        const sortedTrainings = [...this.trainings].sort((a, b) => 
            new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
        );

        container.innerHTML = sortedTrainings.map(training => `
            <div class="training-card">
                <div class="card-header">
                    <div>
                        <div class="card-title">Entraînement</div>
                        <div class="card-date">${this.formatDate(training.date)} à ${training.time}</div>
                    </div>
                    <div class="player-actions">
                        <button class="btn-icon" onclick="app.editTraining('${training.id}')" title="Modifier">✏️</button>
                        <button class="btn-icon" onclick="app.deleteTraining('${training.id}')" title="Supprimer">🗑️</button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-info">
                        <div class="card-label">Durée</div>
                        <div class="card-value">${training.duration} minutes</div>
                    </div>
                    <div class="card-info">
                        <div class="card-label">Lieu</div>
                        <div class="card-value">${training.location}</div>
                    </div>
                    ${training.objectives ? `
                        <div class="card-info" style="grid-column: 1 / -1;">
                            <div class="card-label">Objectifs</div>
                            <div class="card-value">${training.objectives}</div>
                        </div>
                    ` : ''}
                </div>
                <button class="btn-primary attendance-btn" onclick="app.manageAttendance('${training.id}')">
                    Gérer les présences (${this.getAttendanceCount(training.id)}/${this.players.length})
                </button>
            </div>
        `).join('');
    }

    renderMatches() {
        const container = document.getElementById('matches-list');
        
        if (this.matches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏆</div>
                    <div class="empty-state-text">Aucun match enregistré.</div>
                </div>
            `;
            return;
        }

        const sortedMatches = [...this.matches]
            .filter(match => this.currentMatchFilter === 'all' || match.team === this.currentMatchFilter)
            .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

        container.innerHTML = sortedMatches.map(match => {
            const stats = this.matchStats[match.id];
            const hasStats = stats && (stats.lineup?.length > 0 || stats.goals?.length > 0 || stats.assists?.length > 0);
            
            const teamNames = {
                'team1': 'Meyrin 1',
                'team2': 'Meyrin 2',
                'ff17': 'FF17'
            };
            const teamName = teamNames[match.team] || 'Non spécifié';
            const teamBadgeClass = match.team || 'default';
            
            // Récupérer les coachs assignés
            const coaches = this.getCoachesForMatch(match.id);
            const coachesDisplay = coaches.length > 0 
                ? `<div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                       <span style="font-weight: 600; color: #666; font-size: 13px;">👨‍🏫 Coachs: </span>
                       <span style="color: #333; font-size: 13px;">${coaches.join(', ')}</span>
                       <button onclick="app.manualAssignCoaches('${match.id}')" class="btn-icon" style="margin-left: 10px;" title="Modifier">✏️</button>
                   </div>`
                : `<div style="margin-top: 10px;">
                       <button onclick="app.manualAssignCoaches('${match.id}')" class="btn-secondary" style="padding: 6px 12px; font-size: 12px;">👨‍🏫 Assigner coachs</button>
                   </div>`;
            
            return `
            <div class="match-card">
                <div class="card-header">
                    <div>
                        <div class="card-title">
                            <span class="team-badge ${teamBadgeClass}" style="margin-right: 10px;">${teamName}</span>
                            vs ${match.opponent}
                        </div>
                        <div class="card-date">${this.formatDate(match.date)} à ${match.time}</div>
                    </div>
                    <div class="player-actions">
                        <button class="btn-icon" onclick="app.editMatch('${match.id}')" title="Modifier">✏️</button>
                        <button class="btn-icon" onclick="app.deleteMatch('${match.id}')" title="Supprimer">🗑️</button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-info">
                        <div class="card-label">Type</div>
                        <div class="card-value">${match.type}</div>
                    </div>
                    <div class="card-info">
                        <div class="card-label">Lieu</div>
                        <div class="card-value">${match.location}</div>
                    </div>
                    ${match.scoreHome !== undefined && match.scoreAway !== undefined ? `
                        <div class="card-info" style="grid-column: 1 / -1;">
                            <div class="card-label">Score</div>
                            <div class="card-value">
                                <span class="match-score">${match.scoreHome} - ${match.scoreAway}</span>
                                ${this.getMatchResult(match.scoreHome, match.scoreAway)}
                            </div>
                        </div>
                    ` : ''}
                </div>
                ${coachesDisplay}
                <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-secondary" onclick="app.generateConvocation('${match.id}')" style="flex: 1; min-width: 140px;">
                        📱 Convoquer
                    </button>
                    <button class="btn-secondary" onclick="app.openMatchSheet('${match.id}')" style="flex: 1; min-width: 140px;">
                        📋 Feuille de match
                    </button>
                    ${match.scoreHome !== undefined ? `
                        <button class="btn-primary" onclick="app.manageMatchStats('${match.id}')" style="flex: 1; min-width: 140px;">
                            ${hasStats ? '📊 Statistiques' : '📊 + Stats'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        }).join('');
    }

    filterMatches(team) {
        this.currentMatchFilter = team;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.renderMatches();
        this.renderUpcomingMatches();
    }

    renderTactics() {
        const container = document.getElementById('tactics-list');
        
        if (this.tactics.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">Aucune tactique créée. Créez votre première tactique !</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tactics.map(tactic => {
            const positionsCount = Object.keys(tactic.positions || {}).length;
            return `
            <div class="training-card">
                <div class="card-header">
                    <div>
                        <div class="card-title">${tactic.name}</div>
                        <div class="card-date">${tactic.formation} • ${positionsCount}/9 joueuses placées</div>
                    </div>
                    <div class="player-actions">
                        <button class="btn-icon" onclick="app.viewTacticDetails('${tactic.id}')" title="Voir détails">👁️</button>
                        <button class="btn-icon" onclick="app.editTactic('${tactic.id}')" title="Modifier">✏️</button>
                        <button class="btn-icon" onclick="app.deleteTactic('${tactic.id}')" title="Supprimer">🗑️</button>
                    </div>
                </div>
                <div class="card-content">
                    ${tactic.notes ? `
                        <div class="card-info" style="grid-column: 1 / -1;">
                            <div class="card-label">Notes</div>
                            <div class="card-value">${tactic.notes}</div>
                        </div>
                    ` : ''}
                </div>
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn-secondary" style="flex: 1; padding: 10px;" onclick="app.assignTacticToMatch('${tactic.id}')">
                        Assigner à un match
                    </button>
                </div>
            </div>
        `;
        }).join('');
    }

    getDefaultStandings() {
        return [
            { position: 1, team: 'FC Aire-le-Lignon 1', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
            { position: 2, team: 'FC Onex 1', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
            { position: 3, team: 'Meyrin FC 1', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, isMyTeam: true },
            { position: 4, team: 'Meyrin FC 2', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0, isMyTeam: true },
            { position: 5, team: 'CS Interstar 1', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
            { position: 6, team: 'FC Champel 1', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
            { position: 7, team: 'FC Veyrier Sports 1', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
            { position: 8, team: 'FC Plan-les-Ouates 1', played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }
        ];
    }

    renderStandings() {
        const container = document.getElementById('standings-container');
        
        const sortedStandings = [...this.standings].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const diffA = a.goalsFor - a.goalsAgainst;
            const diffB = b.goalsFor - b.goalsAgainst;
            if (diffB !== diffA) return diffB - diffA;
            return b.goalsFor - a.goalsFor;
        });

        sortedStandings.forEach((team, index) => {
            team.position = index + 1;
        });

        let html = `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Équipe</th>
                        <th>J</th>
                        <th>V</th>
                        <th>N</th>
                        <th>D</th>
                        <th>BP</th>
                        <th>BC</th>
                        <th>Diff</th>
                        <th>Pts</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedStandings.forEach(team => {
            const goalDiff = team.goalsFor - team.goalsAgainst;
            const diffSign = goalDiff > 0 ? '+' : '';
            const rowClass = team.isMyTeam ? 'my-team' : '';

            html += `
                <tr class="${rowClass}">
                    <td class="position-cell">${team.position}</td>
                    <td>${team.isMyTeam ? '⚽ ' : ''}${team.team}</td>
                    <td>${team.played}</td>
                    <td>${team.wins}</td>
                    <td>${team.draws}</td>
                    <td>${team.losses}</td>
                    <td>${team.goalsFor}</td>
                    <td>${team.goalsAgainst}</td>
                    <td>${diffSign}${goalDiff}</td>
                    <td><strong>${team.points}</strong></td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
            <div class="standings-legend">
                <strong>Légende :</strong> J = Joués, V = Victoires, N = Nuls, D = Défaites, 
                BP = Buts Pour, BC = Buts Contre, Diff = Différence de buts, Pts = Points
            </div>
        `;

        container.innerHTML = html;
    }

    updateStandings() {
        const modal = document.getElementById('player-modal');
        const modalContent = modal.querySelector('.modal-content');

        let html = `
            <span class="close" onclick="closePlayerModal()">&times;</span>
            <h2>Mettre à jour le classement</h2>
            <p style="color: #666; margin-bottom: 20px;">Modifiez les statistiques des équipes</p>
            <div style="max-height: 500px; overflow-y: auto;">
        `;

        this.standings.forEach((team, index) => {
            html += `
                <div style="padding: 15px; margin-bottom: 15px; background: ${team.isMyTeam ? 'rgba(255, 215, 0, 0.1)' : '#f8f9fa'}; border-radius: 8px;">
                    <h4 style="color: #333; margin-bottom: 15px;">${team.isMyTeam ? '⚽ ' : ''}${team.team}</h4>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                        <div>
                            <label style="font-size: 12px; color: #666;">Joués</label>
                            <input type="number" value="${team.played}" min="0" 
                                   onchange="app.updateTeamStat(${index}, 'played', this.value)"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">Victoires</label>
                            <input type="number" value="${team.wins}" min="0" 
                                   onchange="app.updateTeamStat(${index}, 'wins', this.value)"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">Nuls</label>
                            <input type="number" value="${team.draws}" min="0" 
                                   onchange="app.updateTeamStat(${index}, 'draws', this.value)"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">Défaites</label>
                            <input type="number" value="${team.losses}" min="0" 
                                   onchange="app.updateTeamStat(${index}, 'losses', this.value)"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">Buts Pour</label>
                            <input type="number" value="${team.goalsFor}" min="0" 
                                   onchange="app.updateTeamStat(${index}, 'goalsFor', this.value)"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">Buts Contre</label>
                            <input type="number" value="${team.goalsAgainst}" min="0" 
                                   onchange="app.updateTeamStat(${index}, 'goalsAgainst', this.value)"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #666;">Points</label>
                            <input type="number" value="${team.points}" min="0" 
                                   onchange="app.updateTeamStat(${index}, 'points', this.value)"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div style="margin-top: 20px; text-align: right;">
                <button class="btn-primary" onclick="closePlayerModal(); app.renderStandings();">Fermer</button>
            </div>
        `;

        modalContent.innerHTML = html;
        modal.classList.add('active');
    }

    updateTeamStat(teamIndex, stat, value) {
        this.standings[teamIndex][stat] = parseInt(value) || 0;
        this.saveData('standings', this.standings);
    }

    renderPerformances() {
        const container = document.getElementById('performances-container');
        
        if (this.players.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-text">Ajoutez des joueurs pour voir leurs performances.</div>
                </div>
            `;
            return;
        }

        const stats = this.calculateTeamStats();
        
        container.innerHTML = `
            <div class="performance-card">
                <h3>Statistiques de l'équipe</h3>
                <div class="stat-row">
                    <span class="stat-label">Matchs joués</span>
                    <span class="stat-value">${stats.matchesPlayed}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Victoires</span>
                    <span class="stat-value">${stats.wins}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Nuls</span>
                    <span class="stat-value">${stats.draws}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Défaites</span>
                    <span class="stat-value">${stats.losses}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Buts marqués</span>
                    <span class="stat-value">${stats.goalsFor}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Buts encaissés</span>
                    <span class="stat-value">${stats.goalsAgainst}</span>
                </div>
            </div>

            <div class="performance-card">
                <h3>Entraînements</h3>
                <div class="stat-row">
                    <span class="stat-label">Total entraînements</span>
                    <span class="stat-value">${this.trainings.length}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Taux de présence moyen</span>
                    <span class="stat-value">${stats.avgAttendance}%</span>
                </div>
            </div>

            <div class="performance-card">
                <h3>Effectif</h3>
                <div class="stat-row">
                    <span class="stat-label">Total joueurs</span>
                    <span class="stat-value">${this.players.length}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Gardiens</span>
                    <span class="stat-value">${this.countByPosition('Gardien')}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Défenseurs</span>
                    <span class="stat-value">${this.countByPosition('Défenseur')}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Milieux</span>
                    <span class="stat-value">${this.countByPosition('Milieu')}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Attaquants</span>
                    <span class="stat-value">${this.countByPosition('Attaquant')}</span>
                </div>
            </div>
        `;
    }

    renderUpcomingMatches() {
        const container = document.getElementById('upcoming-matches-home');
        
        if (!container) return;

        // Obtenir la date actuelle
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filtrer les matchs à venir de Meyrin 1 et Meyrin 2 (pas encore joués)
        const upcomingMatches = this.matches
            .filter(match => {
                const matchDate = new Date(match.date);
                matchDate.setHours(0, 0, 0, 0);
                // Match à venir (date future) et pas encore joué (pas de score) et Meyrin 1 ou 2
                return matchDate >= today && 
                       match.scoreHome === undefined && 
                       (match.team === 'team1' || match.team === 'team2');
            })
            .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
            .slice(0, 3); // Prendre les 3 prochains

        if (upcomingMatches.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; background: white; border-radius: 12px;">
                    <p style="color: #999; font-size: 16px;">📅 Aucun match à venir</p>
                    <p style="color: #ccc; font-size: 14px; margin-top: 10px;">Les prochains matchs apparaîtront ici</p>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingMatches.map(match => {
            const teamName = match.team === 'team1' ? 'Meyrin 1' : 'Meyrin 2';
            const teamClass = match.team;
            const dateFormatted = this.formatDate(match.date);
            
            // Calculer les jours restants
            const matchDate = new Date(match.date);
            const diffTime = matchDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let daysText = '';
            if (diffDays === 0) {
                daysText = "Aujourd'hui";
            } else if (diffDays === 1) {
                daysText = 'Demain';
            } else if (diffDays <= 7) {
                daysText = `Dans ${diffDays} jours`;
            } else {
                daysText = `Dans ${diffDays} jours`;
            }

            return `
                <div class="upcoming-match-card">
                    <div class="upcoming-match-header">
                        <span class="upcoming-match-team ${teamClass}">${teamName}</span>
                        <span class="upcoming-match-date">${daysText}</span>
                    </div>
                    <div class="upcoming-match-teams">
                        ${match.location === 'Domicile' ? teamName : match.opponent}
                        <span style="color: #FFD700; margin: 0 10px;">VS</span>
                        ${match.location === 'Domicile' ? match.opponent : teamName}
                    </div>
                    <div class="upcoming-match-info">
                        <div class="upcoming-match-info-item">
                            <span class="upcoming-match-info-label">Date</span>
                            <span class="upcoming-match-info-value">${dateFormatted}</span>
                        </div>
                        <div class="upcoming-match-info-item">
                            <span class="upcoming-match-info-label">Heure</span>
                            <span class="upcoming-match-info-value">${match.time}</span>
                        </div>
                        <div class="upcoming-match-info-item">
                            <span class="upcoming-match-info-label">Lieu</span>
                            <span class="upcoming-match-info-value">${match.location === 'Domicile' ? '🏠 Domicile' : '✈️ Extérieur'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    calculateTeamStats() {
        const completedMatches = this.matches.filter(m => m.scoreHome !== undefined && m.scoreAway !== undefined);
        
        const wins = completedMatches.filter(m => m.scoreHome > m.scoreAway).length;
        const draws = completedMatches.filter(m => m.scoreHome === m.scoreAway).length;
        const losses = completedMatches.filter(m => m.scoreHome < m.scoreAway).length;
        
        const goalsFor = completedMatches.reduce((sum, m) => sum + (m.scoreHome || 0), 0);
        const goalsAgainst = completedMatches.reduce((sum, m) => sum + (m.scoreAway || 0), 0);

        let totalAttendanceRate = 0;
        this.trainings.forEach(training => {
            const count = this.getAttendanceCount(training.id);
            if (this.players.length > 0) {
                totalAttendanceRate += (count / this.players.length) * 100;
            }
        });
        const avgAttendance = this.trainings.length > 0 ? 
            Math.round(totalAttendanceRate / this.trainings.length) : 0;

        return {
            matchesPlayed: completedMatches.length,
            wins,
            draws,
            losses,
            goalsFor,
            goalsAgainst,
            avgAttendance
        };
    }

    renderCharts() {
        // Détruire les anciens graphiques
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });

        this.renderResultsChart();
        this.renderGoalsChart();
        this.renderScorersChart();
        this.renderAttendanceChart();
    }

    renderResultsChart() {
        const ctx = document.getElementById('resultsChart');
        if (!ctx) return;

        const completedMatches = this.matches.filter(m => m.scoreHome !== undefined && m.scoreAway !== undefined);
        
        const wins = completedMatches.filter(m => m.scoreHome > m.scoreAway).length;
        const draws = completedMatches.filter(m => m.scoreHome === m.scoreAway).length;
        const losses = completedMatches.filter(m => m.scoreHome < m.scoreAway).length;

        this.charts.results = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Victoires', 'Nuls', 'Défaites'],
                datasets: [{
                    data: [wins, draws, losses],
                    backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 14 }
                        }
                    }
                }
            }
        });
    }

    renderGoalsChart() {
        const ctx = document.getElementById('goalsChart');
        if (!ctx) return;

        const completedMatches = this.matches
            .filter(m => m.scoreHome !== undefined && m.scoreAway !== undefined)
            .slice(-8); // 8 derniers matchs

        const labels = completedMatches.map((m, i) => `J${i + 1}`);
        const goalsFor = completedMatches.map(m => m.scoreHome || 0);
        const goalsAgainst = completedMatches.map(m => m.scoreAway || 0);

        this.charts.goals = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Buts marqués',
                        data: goalsFor,
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Buts encaissés',
                        data: goalsAgainst,
                        borderColor: '#F44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 14 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    renderScorersChart() {
        const ctx = document.getElementById('scorersChart');
        if (!ctx) return;

        // Compter les buts par joueuse
        const scorersMap = {};
        Object.values(this.matchStats).forEach(stats => {
            if (stats.scorers) {
                stats.scorers.forEach(playerId => {
                    scorersMap[playerId] = (scorersMap[playerId] || 0) + 1;
                });
            }
        });

        // Top 5 buteuses
        const topScorers = Object.entries(scorersMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const labels = topScorers.map(([playerId]) => {
            const player = this.players.find(p => p.id === playerId);
            return player ? player.name : 'Inconnue';
        });
        const data = topScorers.map(([, goals]) => goals);

        this.charts.scorers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Buts',
                    data: data,
                    backgroundColor: '#FFD700',
                    borderColor: '#FFA500',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    renderAttendanceChart() {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;

        // Calculer le taux de présence par joueuse
        const attendanceMap = {};
        
        this.players.forEach(player => {
            let present = 0;
            let total = 0;
            
            this.trainings.forEach(training => {
                const attendees = this.attendances[training.id] || [];
                total++;
                if (attendees.includes(player.id)) {
                    present++;
                }
            });
            
            const rate = total > 0 ? Math.round((present / total) * 100) : 0;
            attendanceMap[player.name] = rate;
        });

        // Top 10 joueuses les plus assidues
        const topAttendance = Object.entries(attendanceMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const labels = topAttendance.map(([name]) => name);
        const data = topAttendance.map(([, rate]) => rate);

        this.charts.attendance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Taux de présence (%)',
                    data: data,
                    backgroundColor: '#4CAF50',
                    borderColor: '#388E3C',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    countByPosition(position) {
        return this.players.filter(p => p.position === position).length;
    }

    // Système de rotation des coachs
    autoAssignCoaches() {
        // Récupérer les matchs à venir de Meyrin 1 et Meyrin 2
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingMatches = this.matches
            .filter(match => {
                const matchDate = new Date(match.date);
                matchDate.setHours(0, 0, 0, 0);
                return matchDate >= today && 
                       match.scoreHome === undefined && 
                       (match.team === 'team1' || match.team === 'team2');
            })
            .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

        if (upcomingMatches.length === 0) {
            alert('Aucun match à venir pour assigner les coachs');
            return;
        }

        // Rotations TOUJOURS par 2 (jamais Aristote + Patrick ensemble)
        const rotations = [
            ['André', 'Lucas'],
            ['André', 'Aristote'],
            ['André', 'Patrick'],
            ['Lucas', 'Aristote'],
            ['Lucas', 'Patrick']
            // PAS Aristote + Patrick (les deux adjoints)
        ];

        let rotationIndex = 0;

        upcomingMatches.forEach(match => {
            // Assigner même si déjà assigné (pour forcer la rotation)
            this.coachAssignments[match.id] = rotations[rotationIndex % rotations.length];
            rotationIndex++;
        });

        this.saveData('coachAssignments', this.coachAssignments);
        this.renderMatches();
        this.renderUpcomingMatches();
        
        alert(`✅ Rotation des coachs mise à jour !\n${upcomingMatches.length} matchs assignés automatiquement (toujours par 2).`);
    }

    getCoachesForMatch(matchId) {
        return this.coachAssignments[matchId] || [];
    }

    manualAssignCoaches(matchId) {
        const coaches = this.coachAssignments[matchId] || [];
        const checkboxes = this.coaches.map(coach => {
            const checked = coaches.includes(coach) ? 'checked' : '';
            return `
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" value="${coach}" ${checked}> ${coach}
                </label>
            `;
        }).join('');

        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                <h3 style="margin-bottom: 20px; color: #333;">Assigner les coachs</h3>
                <div id="coach-checkboxes">
                    ${checkboxes}
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="app.saveCoachAssignment('${matchId}')" class="btn-primary" style="flex: 1;">Enregistrer</button>
                    <button onclick="this.closest('div[style*=fixed]').remove()" class="btn-secondary" style="flex: 1;">Annuler</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveCoachAssignment(matchId) {
        const checkboxes = document.querySelectorAll('#coach-checkboxes input[type=checkbox]:checked');
        const selectedCoaches = Array.from(checkboxes).map(cb => cb.value);

        if (selectedCoaches.length === 0) {
            alert('⚠️ Sélectionnez au moins un coach');
            return;
        }

        this.coachAssignments[matchId] = selectedCoaches;
        this.saveData('coachAssignments', this.coachAssignments);
        this.renderMatches();
        this.renderUpcomingMatches();
        
        // Fermer le modal
        document.querySelector('div[style*="position: fixed"]').remove();
    }

    getAttendanceCount(trainingId) {
        return (this.attendances[trainingId] || []).length;
    }

    // Système de convocation par équipe
    generateConvocation(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) return;

        const teamNames = {
            'team1': 'Meyrin 1',
            'team2': 'Meyrin 2',
            'ff17': 'FF17'
        };
        const teamName = teamNames[match.team] || 'l\'équipe';

        // Récupérer les joueuses de l'équipe
        const teamPlayers = this.players.filter(p => p.teams && p.teams.includes(match.team));
        
        // Récupérer les coachs assignés
        const coaches = this.getCoachesForMatch(matchId);
        const coachesText = coaches.length > 0 ? coaches.join(' et ') : 'l\'encadrement';

        // Formater la date
        const matchDate = new Date(match.date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateFormatted = matchDate.toLocaleDateString('fr-FR', options);

        // Générer le message de convocation
        const message = `🔵🟡 Convocation ${teamName} 🟡🔵

📅 ${dateFormatted}
⏰ ${match.time}
🏆 ${match.type}
⚽ ${match.location === 'Domicile' ? '🏠 Match à domicile' : '✈️ Match à l\'extérieur'}
🆚 Adversaire : ${match.opponent}

👨‍🏫 Encadrement : ${coachesText}

👥 Joueuses convoquées :
${teamPlayers.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}

⚠️ Merci de confirmer votre présence !

💛🖤 Allez ${teamName} ! 💛🖤`;

        // Afficher le modal de convocation
        this.showConvocationModal(message, teamPlayers, match);
    }

    showConvocationModal(message, players, match) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; overflow-y: auto;';
        
        // Générer les liens WhatsApp individuels
        const whatsappLinks = players
            .filter(p => p.phone)
            .map(p => {
                const phoneClean = p.phone.replace(/\s/g, '');
                const messageEncoded = encodeURIComponent(message);
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: #f5f5f5; border-radius: 6px; margin-bottom: 8px;">
                        <span style="font-size: 14px; color: #333;">${p.name}</span>
                        <a href="https://wa.me/${phoneClean}?text=${messageEncoded}" target="_blank" class="btn-secondary" style="padding: 6px 12px; font-size: 12px; text-decoration: none;">
                            📱 WhatsApp
                        </a>
                    </div>
                `;
            }).join('');

        const playersWithoutPhone = players.filter(p => !p.phone).length;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h3 style="margin-bottom: 20px; color: #333;">📱 Convocation du match</h3>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; white-space: pre-wrap; font-family: monospace; font-size: 13px; max-height: 300px; overflow-y: auto;">
${message}
                </div>

                <div style="margin-bottom: 20px;">
                    <button onclick="app.copyToClipboard(\`${message.replace(/`/g, '\\`')}\`)" class="btn-primary" style="width: 100%; margin-bottom: 10px;">
                        📋 Copier le message
                    </button>
                </div>

                ${players.filter(p => p.phone).length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #333; margin-bottom: 15px;">Envoyer individuellement :</h4>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${whatsappLinks}
                        </div>
                    </div>
                ` : ''}

                ${playersWithoutPhone > 0 ? `
                    <p style="color: #f44336; font-size: 13px; margin: 15px 0;">
                        ⚠️ ${playersWithoutPhone} joueuse(s) sans numéro de téléphone
                    </p>
                ` : ''}

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="this.closest('div[style*=fixed]').remove()" class="btn-secondary" style="flex: 1;">Fermer</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    copyToClipboard(text) {
        // Créer un élément textarea temporaire
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            alert('✅ Message copié dans le presse-papier !\nVous pouvez maintenant le coller dans WhatsApp ou SMS.');
        } catch (err) {
            alert('❌ Erreur lors de la copie');
        }
        
        document.body.removeChild(textarea);
    }

    // Feuille de match avec 4 mi-temps
    openMatchSheet(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) return;

        // Initialiser la feuille si elle n'existe pas
        if (!this.matchSheets[matchId]) {
            this.matchSheets[matchId] = {
                quarters: [
                    { number: 1, duration: 20, events: [] },
                    { number: 2, duration: 20, events: [] },
                    { number: 3, duration: 20, events: [] },
                    { number: 4, duration: 20, events: [] }
                ],
                lineup: []
            };
        }

        const sheet = this.matchSheets[matchId];
        const teamPlayers = this.players.filter(p => p.teams && p.teams.includes(match.team));

        const modal = document.createElement('div');
        modal.id = 'match-sheet-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; overflow-y: auto; padding: 20px;';
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #333; margin: 0;">📋 Feuille de match</h2>
                    <button onclick="document.getElementById('match-sheet-modal').remove()" class="btn-secondary">✕ Fermer</button>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #333; margin: 0 0 10px 0;">${match.opponent}</h3>
                    <p style="color: #666; margin: 0;">${this.formatDate(match.date)} - ${match.time} - ${match.location}</p>
                </div>

                <!-- Composition -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #333; margin-bottom: 15px;">👥 Composition de départ</h3>
                    <div id="lineup-selection" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                        ${teamPlayers.map(player => {
                            const isInLineup = sheet.lineup.includes(player.id);
                            return `
                                <label style="display: flex; align-items: center; padding: 10px; background: ${isInLineup ? '#e8f5e9' : '#f5f5f5'}; border-radius: 6px; cursor: pointer;">
                                    <input type="checkbox" ${isInLineup ? 'checked' : ''} onchange="app.toggleLineup('${matchId}', '${player.id}')" style="margin-right: 10px;">
                                    <span style="font-size: 14px;">${player.name}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 4 Mi-temps -->
                ${sheet.quarters.map((quarter, qIndex) => `
                    <div style="margin-bottom: 25px; border: 2px solid #e0e0e0; border-radius: 8px; padding: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="color: #333; margin: 0;">⏱️ ${qIndex + 1}ère mi-temps (20 min)</h3>
                            <button onclick="app.addQuarterEvent('${matchId}', ${qIndex})" class="btn-secondary" style="padding: 6px 12px; font-size: 13px;">
                                + Événement
                            </button>
                        </div>
                        
                        <div id="quarter-${qIndex}-events" style="min-height: 50px;">
                            ${quarter.events.length === 0 ? 
                                '<p style="color: #999; font-style: italic; text-align: center;">Aucun événement</p>' : 
                                quarter.events.map((event, eIndex) => `
                                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <span style="font-weight: 600; color: #333;">${event.minute}'</span>
                                            ${event.type === 'goal' ? '⚽' : event.type === 'assist' ? '🎯' : event.type === 'yellow' ? '🟨' : event.type === 'red' ? '🟥' : '🔄'}
                                            <span style="margin-left: 10px;">${teamPlayers.find(p => p.id === event.playerId)?.name || 'Inconnue'}</span>
                                            ${event.assistId ? ` (passeur: ${teamPlayers.find(p => p.id === event.assistId)?.name || 'Inconnue'})` : ''}
                                        </div>
                                        <button onclick="app.removeQuarterEvent('${matchId}', ${qIndex}, ${eIndex})" class="btn-icon" title="Supprimer">🗑️</button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                `).join('')}

                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button onclick="app.saveMatchSheet('${matchId}')" class="btn-primary" style="flex: 1;">💾 Enregistrer</button>
                    <button onclick="app.printMatchSheet('${matchId}')" class="btn-secondary" style="flex: 1;">🖨️ Imprimer</button>
                    <button onclick="document.getElementById('match-sheet-modal').remove()" class="btn-secondary" style="flex: 1;">Annuler</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    toggleLineup(matchId, playerId) {
        const sheet = this.matchSheets[matchId];
        const index = sheet.lineup.indexOf(playerId);
        
        if (index > -1) {
            sheet.lineup.splice(index, 1);
        } else {
            sheet.lineup.push(playerId);
        }
    }

    addQuarterEvent(matchId, quarterIndex) {
        const match = this.matches.find(m => m.id === matchId);
        const sheet = this.matchSheets[matchId];
        const teamPlayers = this.players.filter(p => p.teams && p.teams.includes(match.team));

        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 10001;';
        
        modal.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 12px; max-width: 400px; width: 90%;">
                <h3 style="margin-bottom: 20px; color: #333;">➕ Ajouter un événement</h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Minute (1-20)</label>
                    <input type="number" id="event-minute" min="1" max="20" value="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Type d'événement</label>
                    <select id="event-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="goal">⚽ But</option>
                        <option value="assist">🎯 Passe décisive</option>
                        <option value="yellow">🟨 Carton jaune</option>
                        <option value="red">🟥 Carton rouge</option>
                        <option value="sub">🔄 Remplacement</option>
                    </select>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Joueuse</label>
                    <select id="event-player" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="">-- Sélectionner --</option>
                        ${teamPlayers.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>

                <div id="assist-container" style="margin-bottom: 15px; display: none;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Passeuse (optionnel)</label>
                    <select id="event-assist" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="">-- Aucune --</option>
                        ${teamPlayers.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="app.saveQuarterEvent('${matchId}', ${quarterIndex})" class="btn-primary" style="flex: 1;">Ajouter</button>
                    <button onclick="this.closest('div[style*=fixed]').remove()" class="btn-secondary" style="flex: 1;">Annuler</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Afficher le champ passeur si c'est un but
        document.getElementById('event-type').addEventListener('change', function() {
            document.getElementById('assist-container').style.display = this.value === 'goal' ? 'block' : 'none';
        });
    }

    saveQuarterEvent(matchId, quarterIndex) {
        const minute = parseInt(document.getElementById('event-minute').value);
        const type = document.getElementById('event-type').value;
        const playerId = document.getElementById('event-player').value;
        const assistId = document.getElementById('event-assist')?.value;

        if (!playerId) {
            alert('⚠️ Veuillez sélectionner une joueuse');
            return;
        }

        if (minute < 1 || minute > 20) {
            alert('⚠️ La minute doit être entre 1 et 20');
            return;
        }

        const event = {
            minute,
            type,
            playerId,
            assistId: assistId || null
        };

        this.matchSheets[matchId].quarters[quarterIndex].events.push(event);
        
        // Fermer le modal d'événement
        document.querySelector('div[style*="position: fixed"][style*="10001"]').remove();
        
        // Recharger la feuille
        document.getElementById('match-sheet-modal').remove();
        this.openMatchSheet(matchId);
    }

    removeQuarterEvent(matchId, quarterIndex, eventIndex) {
        if (confirm('Supprimer cet événement ?')) {
            this.matchSheets[matchId].quarters[quarterIndex].events.splice(eventIndex, 1);
            document.getElementById('match-sheet-modal').remove();
            this.openMatchSheet(matchId);
        }
    }

    saveMatchSheet(matchId) {
        this.saveData('matchSheets', this.matchSheets);
        alert('✅ Feuille de match enregistrée !');
        document.getElementById('match-sheet-modal').remove();
    }

    printMatchSheet(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        const sheet = this.matchSheets[matchId];
        const teamPlayers = this.players.filter(p => p.teams && p.teams.includes(match.team));

        // Calculer les statistiques totales
        const goalScorers = {};
        const assisters = {};
        const yellowCards = [];
        const redCards = [];

        sheet.quarters.forEach(quarter => {
            quarter.events.forEach(event => {
                if (event.type === 'goal') {
                    goalScorers[event.playerId] = (goalScorers[event.playerId] || 0) + 1;
                    if (event.assistId) {
                        assisters[event.assistId] = (assisters[event.assistId] || 0) + 1;
                    }
                } else if (event.type === 'yellow') {
                    yellowCards.push(event.playerId);
                } else if (event.type === 'red') {
                    redCards.push(event.playerId);
                }
            });
        });

        const totalGoals = Object.values(goalScorers).reduce((a, b) => a + b, 0);

        // Créer la fenêtre d'impression
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Feuille de match - ${match.opponent}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 11pt;
                        line-height: 1.4;
                        color: #000;
                        background: white;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 3px solid #000;
                    }
                    
                    .header h1 {
                        font-size: 24pt;
                        color: #000;
                        margin-bottom: 5px;
                    }
                    
                    .header .team-name {
                        font-size: 18pt;
                        font-weight: bold;
                        color: #FFD700;
                        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                    }
                    
                    .match-info {
                        background: #f8f8f8;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        border: 1px solid #ddd;
                    }
                    
                    .match-info table {
                        width: 100%;
                    }
                    
                    .match-info td {
                        padding: 5px;
                    }
                    
                    .match-info .label {
                        font-weight: bold;
                        width: 120px;
                    }
                    
                    .section {
                        margin-bottom: 25px;
                        page-break-inside: avoid;
                    }
                    
                    .section-title {
                        font-size: 14pt;
                        font-weight: bold;
                        margin-bottom: 10px;
                        padding: 8px;
                        background: #000;
                        color: #FFD700;
                        border-radius: 4px;
                    }
                    
                    .lineup {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 8px;
                    }
                    
                    .lineup-item {
                        padding: 8px;
                        background: #f8f8f8;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 10pt;
                    }
                    
                    .quarter {
                        margin-bottom: 15px;
                        border: 2px solid #ddd;
                        border-radius: 6px;
                        padding: 12px;
                        page-break-inside: avoid;
                    }
                    
                    .quarter-title {
                        font-size: 12pt;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #333;
                    }
                    
                    .event {
                        padding: 6px 10px;
                        margin-bottom: 6px;
                        background: #f8f8f8;
                        border-left: 3px solid #000;
                        font-size: 10pt;
                    }
                    
                    .event-minute {
                        font-weight: bold;
                        display: inline-block;
                        width: 30px;
                    }
                    
                    .no-events {
                        color: #999;
                        font-style: italic;
                        text-align: center;
                        padding: 10px;
                    }
                    
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                    }
                    
                    .stat-box {
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        padding: 12px;
                        background: #f8f8f8;
                    }
                    
                    .stat-box h4 {
                        margin-bottom: 10px;
                        color: #333;
                        font-size: 11pt;
                    }
                    
                    .stat-item {
                        padding: 5px 0;
                        border-bottom: 1px solid #e0e0e0;
                        font-size: 10pt;
                    }
                    
                    .stat-item:last-child {
                        border-bottom: none;
                    }
                    
                    .total-goals {
                        font-size: 24pt;
                        font-weight: bold;
                        text-align: center;
                        color: #FFD700;
                        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                        padding: 20px;
                        background: #000;
                        border-radius: 8px;
                        margin-top: 20px;
                    }
                    
                    @media print {
                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                        
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="team-name">MEYRIN FF14</div>
                    <h1>📋 FEUILLE DE MATCH</h1>
                </div>
                
                <div class="match-info">
                    <table>
                        <tr>
                            <td class="label">🆚 Adversaire:</td>
                            <td><strong>${match.opponent}</strong></td>
                            <td class="label">📅 Date:</td>
                            <td>${this.formatDate(match.date)}</td>
                        </tr>
                        <tr>
                            <td class="label">⏰ Heure:</td>
                            <td>${match.time}</td>
                            <td class="label">📍 Lieu:</td>
                            <td>${match.location}</td>
                        </tr>
                        <tr>
                            <td class="label">⚽ Équipe:</td>
                            <td colspan="3"><strong>${match.team}</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div class="section">
                    <div class="section-title">👥 COMPOSITION DE DÉPART</div>
                    <div class="lineup">
                        ${sheet.lineup.length === 0 ? 
                            '<div style="grid-column: 1 / -1; text-align: center; color: #999; font-style: italic;">Aucune joueuse sélectionnée</div>' :
                            sheet.lineup.map(playerId => {
                                const player = teamPlayers.find(p => p.id === playerId);
                                return `<div class="lineup-item">${player ? player.name : 'Inconnue'}</div>`;
                            }).join('')
                        }
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">⏱️ CHRONOLOGIE DU MATCH (4 × 20 minutes)</div>
                    ${sheet.quarters.map((quarter, qIndex) => `
                        <div class="quarter">
                            <div class="quarter-title">${qIndex + 1}ère mi-temps</div>
                            ${quarter.events.length === 0 ? 
                                '<div class="no-events">Aucun événement</div>' :
                                quarter.events.sort((a, b) => a.minute - b.minute).map(event => {
                                    const player = teamPlayers.find(p => p.id === event.playerId);
                                    const assister = event.assistId ? teamPlayers.find(p => p.id === event.assistId) : null;
                                    const icon = event.type === 'goal' ? '⚽' : 
                                                event.type === 'assist' ? '🎯' : 
                                                event.type === 'yellow' ? '🟨' : 
                                                event.type === 'red' ? '🟥' : '🔄';
                                    return `
                                        <div class="event">
                                            <span class="event-minute">${event.minute}'</span>
                                            ${icon} ${player ? player.name : 'Inconnue'}
                                            ${assister ? ` (passeur: ${assister.name})` : ''}
                                        </div>
                                    `;
                                }).join('')
                            }
                        </div>
                    `).join('')}
                </div>
                
                <div class="section">
                    <div class="section-title">📊 STATISTIQUES DU MATCH</div>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <h4>⚽ Buteuses</h4>
                            ${Object.keys(goalScorers).length === 0 ? 
                                '<div style="color: #999; font-style: italic;">Aucun but</div>' :
                                Object.entries(goalScorers)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([playerId, goals]) => {
                                        const player = teamPlayers.find(p => p.id === playerId);
                                        return `<div class="stat-item">${player ? player.name : 'Inconnue'}: <strong>${goals} but${goals > 1 ? 's' : ''}</strong></div>`;
                                    }).join('')
                            }
                        </div>
                        
                        <div class="stat-box">
                            <h4>🎯 Passes décisives</h4>
                            ${Object.keys(assisters).length === 0 ? 
                                '<div style="color: #999; font-style: italic;">Aucune passe</div>' :
                                Object.entries(assisters)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([playerId, assists]) => {
                                        const player = teamPlayers.find(p => p.id === playerId);
                                        return `<div class="stat-item">${player ? player.name : 'Inconnue'}: <strong>${assists} passe${assists > 1 ? 's' : ''}</strong></div>`;
                                    }).join('')
                            }
                        </div>
                        
                        <div class="stat-box">
                            <h4>🟨 Cartons jaunes</h4>
                            ${yellowCards.length === 0 ? 
                                '<div style="color: #999; font-style: italic;">Aucun carton</div>' :
                                yellowCards.map(playerId => {
                                    const player = teamPlayers.find(p => p.id === playerId);
                                    return `<div class="stat-item">${player ? player.name : 'Inconnue'}</div>`;
                                }).join('')
                            }
                        </div>
                        
                        <div class="stat-box">
                            <h4>🟥 Cartons rouges</h4>
                            ${redCards.length === 0 ? 
                                '<div style="color: #999; font-style: italic;">Aucun carton</div>' :
                                redCards.map(playerId => {
                                    const player = teamPlayers.find(p => p.id === playerId);
                                    return `<div class="stat-item">${player ? player.name : 'Inconnue'}</div>`;
                                }).join('')
                            }
                        </div>
                    </div>
                </div>
                
                ${totalGoals > 0 ? `
                    <div class="total-goals">
                        SCORE MEYRIN: ${totalGoals}
                    </div>
                ` : ''}
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    generateTeamReportPDF() {
        // Calculer les statistiques de présence pour chaque joueuse
        const playerStats = this.players.map(player => {
            const totalTrainings = this.trainings.length;
            let presentCount = 0;
            
            this.trainings.forEach(training => {
                const attendance = this.attendances[training.id] || [];
                if (attendance.includes(player.id)) {
                    presentCount++;
                }
            });
            
            const attendanceRate = totalTrainings > 0 ? Math.round((presentCount / totalTrainings) * 100) : 0;
            
            return {
                ...player,
                presentCount,
                totalTrainings,
                attendanceRate
            };
        });

        // Trier par taux de présence décroissant
        playerStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

        // Statistiques globales
        const totalPlayers = this.players.length;
        const avgAttendance = totalPlayers > 0 
            ? Math.round(playerStats.reduce((sum, p) => sum + p.attendanceRate, 0) / totalPlayers)
            : 0;

        // Statistiques par équipe
        const team1Players = playerStats.filter(p => p.teams && p.teams.includes('team1'));
        const team2Players = playerStats.filter(p => p.teams && p.teams.includes('team2'));
        const ff17Players = playerStats.filter(p => p.teams && p.teams.includes('ff17'));

        const avgTeam1 = team1Players.length > 0 
            ? Math.round(team1Players.reduce((sum, p) => sum + p.attendanceRate, 0) / team1Players.length)
            : 0;
        const avgTeam2 = team2Players.length > 0 
            ? Math.round(team2Players.reduce((sum, p) => sum + p.attendanceRate, 0) / team2Players.length)
            : 0;
        const avgFF17 = ff17Players.length > 0 
            ? Math.round(ff17Players.reduce((sum, p) => sum + p.attendanceRate, 0) / ff17Players.length)
            : 0;

        // Date du jour
        const today = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Créer la fenêtre d'impression
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Rapport Équipe - Meyrin FF14</title>
                <style>
                    @page {
                        size: A4;
                        margin: 1.5cm;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 10pt;
                        line-height: 1.4;
                        color: #000;
                        background: white;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 25px;
                        padding-bottom: 20px;
                        border-bottom: 3px solid #000;
                    }
                    
                    .header .team-name {
                        font-size: 22pt;
                        font-weight: bold;
                        color: #FFD700;
                        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                        margin-bottom: 5px;
                    }
                    
                    .header h1 {
                        font-size: 18pt;
                        color: #000;
                        margin-bottom: 8px;
                    }
                    
                    .header .date {
                        font-size: 10pt;
                        color: #666;
                    }
                    
                    .summary-box {
                        background: #f8f8f8;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 25px;
                        border: 1px solid #ddd;
                    }
                    
                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin-top: 12px;
                    }
                    
                    .summary-item {
                        text-align: center;
                    }
                    
                    .summary-label {
                        font-size: 9pt;
                        color: #666;
                        margin-bottom: 5px;
                    }
                    
                    .summary-value {
                        font-size: 16pt;
                        font-weight: bold;
                        color: #000;
                    }
                    
                    .section {
                        margin-bottom: 25px;
                        page-break-inside: avoid;
                    }
                    
                    .section-title {
                        font-size: 13pt;
                        font-weight: bold;
                        margin-bottom: 12px;
                        padding: 8px 12px;
                        background: #000;
                        color: #FFD700;
                        border-radius: 4px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    
                    thead {
                        background: #333;
                        color: #FFD700;
                    }
                    
                    th {
                        padding: 10px 8px;
                        text-align: left;
                        font-size: 9pt;
                        font-weight: bold;
                        border: 1px solid #ddd;
                    }
                    
                    td {
                        padding: 8px;
                        border: 1px solid #ddd;
                        font-size: 9pt;
                    }
                    
                    tbody tr:nth-child(even) {
                        background: #f8f8f8;
                    }
                    
                    tbody tr:hover {
                        background: #e8f5e9;
                    }
                    
                    .rate-excellent {
                        color: #2e7d32;
                        font-weight: bold;
                    }
                    
                    .rate-good {
                        color: #558b2f;
                    }
                    
                    .rate-average {
                        color: #f57c00;
                    }
                    
                    .rate-poor {
                        color: #c62828;
                        font-weight: bold;
                    }
                    
                    .notes-cell {
                        font-size: 8pt;
                        color: #555;
                        max-width: 200px;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    
                    .team-badge {
                        display: inline-block;
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 7pt;
                        font-weight: bold;
                        margin-right: 3px;
                        background: #FFD700;
                        color: #000;
                    }
                    
                    @media print {
                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="team-name">MEYRIN FF14</div>
                    <h1>📊 RAPPORT D'ÉQUIPE</h1>
                    <div class="date">Généré le ${today}</div>
                </div>
                
                <div class="summary-box">
                    <h3 style="margin-bottom: 10px; color: #333;">📈 Vue d'ensemble</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">Joueuses</div>
                            <div class="summary-value">${totalPlayers}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Entraînements</div>
                            <div class="summary-value">${this.trainings.length}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Taux moyen</div>
                            <div class="summary-value">${avgAttendance}%</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Matchs joués</div>
                            <div class="summary-value">${this.matches.filter(m => m.scoreHome !== undefined).length}</div>
                        </div>
                    </div>
                </div>
                
                ${team1Players.length > 0 || team2Players.length > 0 || ff17Players.length > 0 ? `
                <div class="summary-box" style="margin-bottom: 25px;">
                    <h3 style="margin-bottom: 10px; color: #333;">🎯 Statistiques par équipe</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 10px;">
                        <div style="text-align: center;">
                            <div style="font-size: 9pt; color: #666; margin-bottom: 5px;">Meyrin 1</div>
                            <div style="font-size: 14pt; font-weight: bold;">${team1Players.length} joueuses</div>
                            <div style="font-size: 12pt; color: #555;">${avgTeam1}% présence</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 9pt; color: #666; margin-bottom: 5px;">Meyrin 2</div>
                            <div style="font-size: 14pt; font-weight: bold;">${team2Players.length} joueuses</div>
                            <div style="font-size: 12pt; color: #555;">${avgTeam2}% présence</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 9pt; color: #666; margin-bottom: 5px;">FF17</div>
                            <div style="font-size: 14pt; font-weight: bold;">${ff17Players.length} joueuses</div>
                            <div style="font-size: 12pt; color: #555;">${avgFF17}% présence</div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="section">
                    <div class="section-title">👥 DÉTAIL PAR JOUEUSE</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 20%;">Nom</th>
                                <th style="width: 12%;">Position</th>
                                <th style="width: 8%;">Année</th>
                                <th style="width: 12%;">Équipe(s)</th>
                                <th style="width: 10%;">Présences</th>
                                <th style="width: 8%;">Taux</th>
                                <th style="width: 30%;">Notes des coachs</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${playerStats.map(player => {
                                let rateClass = 'rate-poor';
                                if (player.attendanceRate >= 80) rateClass = 'rate-excellent';
                                else if (player.attendanceRate >= 60) rateClass = 'rate-good';
                                else if (player.attendanceRate >= 40) rateClass = 'rate-average';
                                
                                const teams = [];
                                if (player.teams) {
                                    if (player.teams.includes('team1')) teams.push('M1');
                                    if (player.teams.includes('team2')) teams.push('M2');
                                    if (player.teams.includes('ff17')) teams.push('FF17');
                                }
                                
                                return `
                                    <tr>
                                        <td><strong>${player.name}</strong></td>
                                        <td>${player.position}</td>
                                        <td>${player.birthyear}</td>
                                        <td>
                                            ${teams.map(t => `<span class="team-badge">${t}</span>`).join('')}
                                            ${teams.length === 0 ? '<span style="color: #999; font-style: italic;">Non assignée</span>' : ''}
                                        </td>
                                        <td>${player.presentCount} / ${player.totalTrainings}</td>
                                        <td class="${rateClass}">${player.attendanceRate}%</td>
                                        <td class="notes-cell">${player.notes ? player.notes : '<span style="color: #999; font-style: italic;">Aucune note</span>'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 8pt; color: #999; text-align: center;">
                    <p>Document généré automatiquement par l'application Meyrin FF14</p>
                    <p>Pour toute question, contactez l'équipe des coachs : André, Lucas, Aristote, Patrick</p>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    generateAttendanceGridPDF() {
        if (this.trainings.length === 0) {
            alert('❌ Aucun entraînement enregistré. Ajoutez des entraînements d\'abord.');
            return;
        }

        if (this.players.length === 0) {
            alert('❌ Aucune joueuse enregistrée. Ajoutez des joueuses d\'abord.');
            return;
        }

        // Trier les entraînements par date
        const sortedTrainings = [...this.trainings].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Date du jour
        const today = new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Fonction pour formater une date courte
        const formatShortDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit'
            });
        };

        // Calculer statistiques globales
        const totalTrainings = sortedTrainings.length;
        let totalPresences = 0;
        sortedTrainings.forEach(training => {
            const attendance = this.attendances[training.id] || [];
            totalPresences += attendance.length;
        });
        const avgPresencePerTraining = Math.round(totalPresences / totalTrainings);

        // Orientation paysage si beaucoup d'entraînements
        const isLandscape = sortedTrainings.length > 10;
        const orientation = isLandscape ? 'landscape' : 'portrait';

        // Créer la fenêtre d'impression
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Grille de Présences - Meyrin FF14</title>
                <style>
                    @page {
                        size: A4 ${orientation};
                        margin: 1cm;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 8pt;
                        line-height: 1.3;
                        color: #000;
                        background: white;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 15px;
                        padding-bottom: 12px;
                        border-bottom: 3px solid #000;
                    }
                    
                    .header .team-name {
                        font-size: 18pt;
                        font-weight: bold;
                        color: #FFD700;
                        text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                        margin-bottom: 3px;
                    }
                    
                    .header h1 {
                        font-size: 14pt;
                        color: #000;
                        margin-bottom: 5px;
                    }
                    
                    .header .date {
                        font-size: 8pt;
                        color: #666;
                    }
                    
                    .summary {
                        background: #f8f8f8;
                        padding: 8px 12px;
                        border-radius: 6px;
                        margin-bottom: 15px;
                        display: flex;
                        justify-content: space-around;
                        border: 1px solid #ddd;
                    }
                    
                    .summary-item {
                        text-align: center;
                    }
                    
                    .summary-label {
                        font-size: 7pt;
                        color: #666;
                    }
                    
                    .summary-value {
                        font-size: 11pt;
                        font-weight: bold;
                        color: #000;
                    }
                    
                    .grid-container {
                        width: 100%;
                        overflow-x: auto;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 7pt;
                    }
                    
                    thead {
                        background: #333;
                        color: #FFD700;
                    }
                    
                    th {
                        padding: 6px 4px;
                        text-align: center;
                        font-weight: bold;
                        border: 1px solid #000;
                        position: sticky;
                        top: 0;
                    }
                    
                    th.player-col {
                        text-align: left;
                        min-width: 120px;
                        max-width: 150px;
                    }
                    
                    th.date-col {
                        writing-mode: vertical-rl;
                        text-orientation: mixed;
                        min-width: 22px;
                        max-width: 25px;
                        padding: 8px 4px;
                        white-space: nowrap;
                    }
                    
                    th.total-col {
                        min-width: 40px;
                        background: #FFD700;
                        color: #000;
                    }
                    
                    td {
                        padding: 5px 4px;
                        border: 1px solid #ddd;
                        text-align: center;
                    }
                    
                    td.player-name {
                        text-align: left;
                        font-weight: bold;
                        background: #f8f8f8;
                    }
                    
                    td.total-cell {
                        background: #FFF9E6;
                        font-weight: bold;
                        font-size: 8pt;
                    }
                    
                    .present {
                        background: #c8e6c9;
                        font-weight: bold;
                        color: #1b5e20;
                    }
                    
                    .absent {
                        background: #ffcdd2;
                        color: #c62828;
                    }
                    
                    tbody tr:hover {
                        background: #e3f2fd;
                    }
                    
                    .legend {
                        margin-top: 15px;
                        padding: 10px;
                        background: #f8f8f8;
                        border-radius: 6px;
                        font-size: 7pt;
                    }
                    
                    .legend-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    
                    .legend-items {
                        display: flex;
                        gap: 15px;
                    }
                    
                    .legend-item {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }
                    
                    .legend-box {
                        width: 15px;
                        height: 15px;
                        border: 1px solid #999;
                        border-radius: 2px;
                    }
                    
                    @media print {
                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="team-name">MEYRIN FF14</div>
                    <h1>📅 GRILLE DE PRÉSENCES AUX ENTRAÎNEMENTS</h1>
                    <div class="date">Généré le ${today}</div>
                </div>
                
                <div class="summary">
                    <div class="summary-item">
                        <div class="summary-label">Joueuses</div>
                        <div class="summary-value">${this.players.length}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Entraînements</div>
                        <div class="summary-value">${totalTrainings}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Présences totales</div>
                        <div class="summary-value">${totalPresences}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Moyenne/entraînement</div>
                        <div class="summary-value">${avgPresencePerTraining}</div>
                    </div>
                </div>
                
                <div class="grid-container">
                    <table>
                        <thead>
                            <tr>
                                <th class="player-col">Joueuse</th>
                                ${sortedTrainings.map(training => 
                                    `<th class="date-col" title="${this.formatDate(training.date)}">${formatShortDate(training.date)}</th>`
                                ).join('')}
                                <th class="total-col">Total</th>
                                <th class="total-col">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.players.map(player => {
                                let presenceCount = 0;
                                const row = sortedTrainings.map(training => {
                                    const attendance = this.attendances[training.id] || [];
                                    const isPresent = attendance.includes(player.id);
                                    if (isPresent) presenceCount++;
                                    return `<td class="${isPresent ? 'present' : 'absent'}">${isPresent ? '✓' : '✗'}</td>`;
                                }).join('');
                                
                                const rate = Math.round((presenceCount / totalTrainings) * 100);
                                
                                return `
                                    <tr>
                                        <td class="player-name">${player.name}</td>
                                        ${row}
                                        <td class="total-cell">${presenceCount}</td>
                                        <td class="total-cell">${rate}%</td>
                                    </tr>
                                `;
                            }).join('')}
                            
                            <tr style="background: #e0e0e0; font-weight: bold;">
                                <td class="player-name">TOTAL PAR DATE</td>
                                ${sortedTrainings.map(training => {
                                    const attendance = this.attendances[training.id] || [];
                                    return `<td style="background: #FFD700; font-weight: bold;">${attendance.length}</td>`;
                                }).join('')}
                                <td class="total-cell">${totalPresences}</td>
                                <td class="total-cell">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="legend">
                    <div class="legend-title">Légende :</div>
                    <div class="legend-items">
                        <div class="legend-item">
                            <div class="legend-box" style="background: #c8e6c9;"></div>
                            <span>✓ = Présente</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box" style="background: #ffcdd2;"></div>
                            <span>✗ = Absente</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box" style="background: #FFF9E6;"></div>
                            <span>Total et % = Taux de présence global</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 7pt; color: #999; text-align: center;">
                    <p>Document généré automatiquement par l'application Meyrin FF14</p>
                </div>
                
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    getMatchResult(scoreHome, scoreAway) {
        if (scoreHome > scoreAway) {
            return '<span class="match-result win">Victoire</span>';
        } else if (scoreHome === scoreAway) {
            return '<span class="match-result draw">Nul</span>';
        } else {
            return '<span class="match-result loss">Défaite</span>';
        }
    }

    calculateAge(birthdate) {
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    editPlayer(id) {
        const player = this.players.find(p => p.id === id);
        if (!player) return;

        document.getElementById('player-id').value = player.id;
        document.getElementById('player-name').value = player.name;
        document.getElementById('player-position').value = player.position;
        document.getElementById('player-birthyear').value = player.birthyear;
        document.getElementById('player-phone').value = player.phone || '';
        document.getElementById('player-notes').value = player.notes || '';
        document.getElementById('player-modal-title').textContent = 'Modifier le joueur';
        
        openPlayerModal();
    }

    deletePlayer(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')) {
            this.players = this.players.filter(p => p.id !== id);
            this.saveData('players', this.players);
            this.renderPlayers();
            this.renderPerformances();
        }
    }

    editTraining(id) {
        const training = this.trainings.find(t => t.id === id);
        if (!training) return;

        document.getElementById('training-id').value = training.id;
        document.getElementById('training-date').value = training.date;
        document.getElementById('training-time').value = training.time;
        document.getElementById('training-duration').value = training.duration;
        document.getElementById('training-location').value = training.location;
        document.getElementById('training-objectives').value = training.objectives || '';
        document.getElementById('training-modal-title').textContent = 'Modifier l\'entraînement';
        
        openTrainingModal();
    }

    deleteTraining(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet entraînement ?')) {
            this.trainings = this.trainings.filter(t => t.id !== id);
            delete this.attendances[id];
            this.saveData('trainings', this.trainings);
            this.saveData('attendances', this.attendances);
            this.renderTrainings();
            this.renderPerformances();
        }
    }

    editMatch(id) {
        const match = this.matches.find(m => m.id === id);
        if (!match) return;

        document.getElementById('match-id').value = match.id;
        document.getElementById('match-team').value = match.team || '';
        document.getElementById('match-date').value = match.date;
        document.getElementById('match-time').value = match.time;
        document.getElementById('match-opponent').value = match.opponent;
        document.getElementById('match-location').value = match.location;
        document.getElementById('match-type').value = match.type;
        document.getElementById('match-score-home').value = match.scoreHome !== undefined ? match.scoreHome : '';
        document.getElementById('match-score-away').value = match.scoreAway !== undefined ? match.scoreAway : '';
        document.getElementById('match-modal-title').textContent = 'Modifier le match';
        
        openMatchModal();
    }

    deleteMatch(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) {
            this.matches = this.matches.filter(m => m.id !== id);
            this.saveData('matches', this.matches);
            this.renderMatches();
            this.renderPerformances();
        }
    }

    manageAttendance(trainingId) {
        const training = this.trainings.find(t => t.id === trainingId);
        if (!training) return;

        const currentAttendance = this.attendances[trainingId] || [];
        
        let html = `<div style="max-height: 400px; overflow-y: auto;">`;
        this.players.forEach(player => {
            const isPresent = currentAttendance.includes(player.id);
            html += `
                <label class="checkbox-label">
                    <input type="checkbox" ${isPresent ? 'checked' : ''} 
                           onchange="app.toggleAttendance('${trainingId}', '${player.id}')">
                    <span class="checkbox-label-text">${player.name}</span>
                    <span class="checkbox-label-badge">${player.position}</span>
                </label>
            `;
        });
        html += `</div>`;

        const modal = document.getElementById('player-modal');
        const modalContent = modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <span class="close" onclick="closePlayerModal(); app.renderTrainings();">&times;</span>
            <h2>Présences - ${this.formatDate(training.date)}</h2>
            <p style="color: #666; margin-bottom: 20px;">Cochez les joueurs présents à cet entraînement</p>
            ${html}
            <div style="margin-top: 20px; text-align: right;">
                <button class="btn-primary" onclick="closePlayerModal(); app.renderTrainings();">Fermer</button>
            </div>
        `;
        modal.classList.add('active');
    }

    toggleAttendance(trainingId, playerId) {
        if (!this.attendances[trainingId]) {
            this.attendances[trainingId] = [];
        }

        const index = this.attendances[trainingId].indexOf(playerId);
        if (index > -1) {
            this.attendances[trainingId].splice(index, 1);
        } else {
            this.attendances[trainingId].push(playerId);
        }

        this.saveData('attendances', this.attendances);
        this.renderPerformances();
    }

    showAttendanceHistory() {
        const modal = document.getElementById('attendance-history-modal');
        const content = document.getElementById('attendance-history-content');

        if (this.trainings.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">Aucun entraînement enregistré</div>
                </div>
            `;
            modal.classList.add('active');
            return;
        }

        const sortedTrainings = [...this.trainings].sort((a, b) => 
            new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
        );

        let html = `
            <table class="attendance-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Lieu</th>
                        <th>Présents</th>
                        <th>Taux de présence</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedTrainings.forEach(training => {
            const presentCount = this.getAttendanceCount(training.id);
            const totalPlayers = this.players.length;
            const rate = totalPlayers > 0 ? Math.round((presentCount / totalPlayers) * 100) : 0;
            
            let rateClass = 'low';
            if (rate >= 80) rateClass = 'high';
            else if (rate >= 50) rateClass = 'medium';

            html += `
                <tr>
                    <td><strong>${this.formatDate(training.date)}</strong><br><small>${training.time}</small></td>
                    <td>${training.location}</td>
                    <td>${presentCount} / ${totalPlayers}</td>
                    <td><span class="attendance-rate ${rateClass}">${rate}%</span></td>
                    <td>
                        <button class="btn-secondary" style="padding: 8px 16px; font-size: 14px;" 
                                onclick="app.viewAttendanceDetails('${training.id}')">
                            Voir détails
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        const playerStats = this.calculatePlayerAttendanceStats();
        if (playerStats.length > 0) {
            html += `
                <h3 style="margin-top: 40px; margin-bottom: 20px; color: #333;">Présences par joueur</h3>
                <div class="player-attendance-list">
            `;

            playerStats.forEach(stat => {
                const rate = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
                let rateClass = 'low';
                if (rate >= 80) rateClass = 'high';
                else if (rate >= 50) rateClass = 'medium';

                html += `
                    <div class="player-attendance-card">
                        <h4>${stat.player.name}</h4>
                        <div style="color: #FFA500; font-size: 14px; margin-bottom: 8px;">
                            ${stat.player.position}
                        </div>
                        <div class="attendance-summary">
                            <span class="attendance-count">${stat.present} / ${stat.total} entraînements</span>
                            <span class="attendance-rate ${rateClass}">${rate}%</span>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        content.innerHTML = html;
        modal.classList.add('active');
    }

    viewAttendanceDetails(trainingId) {
        const training = this.trainings.find(t => t.id === trainingId);
        if (!training) return;

        const attendance = this.attendances[trainingId] || [];
        const presentPlayers = this.players.filter(p => attendance.includes(p.id));
        const absentPlayers = this.players.filter(p => !attendance.includes(p.id));

        const modal = document.getElementById('player-modal');
        const modalContent = modal.querySelector('.modal-content');

        let html = `
            <span class="close" onclick="closePlayerModal(); app.showAttendanceHistory();">&times;</span>
            <h2>Détails - ${this.formatDate(training.date)}</h2>
            <p style="color: #666; margin-bottom: 20px;">
                ${training.location} à ${training.time}
                ${training.objectives ? `<br><strong>Objectifs:</strong> ${training.objectives}` : ''}
            </p>
        `;

        if (presentPlayers.length > 0) {
            html += `
                <h3 style="color: #155724; margin-top: 20px; margin-bottom: 10px;">
                    ✓ Présents (${presentPlayers.length})
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
            `;
            presentPlayers.forEach(player => {
                html += `
                    <div style="padding: 10px; background: #d4edda; border-radius: 6px; display: flex; justify-content: space-between;">
                        <span>${player.name}</span>
                        <span style="color: #155724; font-weight: 600;">${player.position}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        if (absentPlayers.length > 0) {
            html += `
                <h3 style="color: #721c24; margin-top: 20px; margin-bottom: 10px;">
                    ✗ Absents (${absentPlayers.length})
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
            `;
            absentPlayers.forEach(player => {
                html += `
                    <div style="padding: 10px; background: #f8d7da; border-radius: 6px; display: flex; justify-content: space-between;">
                        <span>${player.name}</span>
                        <span style="color: #721c24; font-weight: 600;">${player.position}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `
            <div style="margin-top: 30px; text-align: right;">
                <button class="btn-secondary" onclick="closePlayerModal(); app.showAttendanceHistory();" style="margin-right: 10px;">Retour</button>
                <button class="btn-primary" onclick="closePlayerModal(); app.manageAttendance('${trainingId}');">Modifier les présences</button>
            </div>
        `;

        modalContent.innerHTML = html;
        modal.classList.add('active');
    }

    calculatePlayerAttendanceStats() {
        return this.players.map(player => {
            const total = this.trainings.length;
            const present = this.trainings.filter(training => {
                const attendance = this.attendances[training.id] || [];
                return attendance.includes(player.id);
            }).length;

            return {
                player,
                total,
                present
            };
        }).sort((a, b) => {
            const rateA = a.total > 0 ? a.present / a.total : 0;
            const rateB = b.total > 0 ? b.present / b.total : 0;
            return rateB - rateA;
        });
    }

    manageMatchStats(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) return;

        const stats = this.matchStats[matchId] || { lineup: [], goals: [], assists: [] };
        
        const modal = document.getElementById('match-stats-modal');
        const content = document.getElementById('match-stats-content');
        document.getElementById('match-stats-title').textContent = `Statistiques - ${match.opponent}`;

        let html = `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #333; margin-bottom: 15px;">🏃 Composition de l'équipe</h3>
                <p style="color: #666; margin-bottom: 15px;">Sélectionnez les joueuses qui ont participé au match</p>
                <div style="max-height: 300px; overflow-y: auto; border: 2px solid #e0e0e0; border-radius: 8px;">
        `;

        this.players.forEach(player => {
            const isInLineup = stats.lineup.includes(player.id);
            html += `
                <label class="checkbox-label">
                    <input type="checkbox" ${isInLineup ? 'checked' : ''} 
                           onchange="app.toggleMatchLineup('${matchId}', '${player.id}')">
                    <span class="checkbox-label-text">${player.name}</span>
                    <span class="checkbox-label-badge">${player.position}</span>
                </label>
            `;
        });

        html += `</div></div>`;

        html += `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #333; margin-bottom: 15px;">⚽ Buteuses</h3>
                <div id="goals-list-${matchId}" style="margin-bottom: 15px;">
        `;

        if (stats.goals && stats.goals.length > 0) {
            stats.goals.forEach((goal, index) => {
                const player = this.players.find(p => p.id === goal.playerId);
                html += `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 10px;">
                        <span style="flex: 1; font-weight: 500;">${player ? player.name : 'Inconnue'}</span>
                        <input type="number" value="${goal.count}" min="1" max="10" 
                               onchange="app.updateGoalCount('${matchId}', ${index}, this.value)"
                               style="width: 60px; padding: 5px; border: 2px solid #e0e0e0; border-radius: 4px;">
                        <span style="color: #666;">but(s)</span>
                        <button onclick="app.removeGoal('${matchId}', ${index})" 
                                style="background: #f8d7da; color: #721c24; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
                    </div>
                `;
            });
        } else {
            html += `<p style="color: #999; font-style: italic;">Aucune buteuse enregistrée</p>`;
        }

        html += `</div>`;

        html += `
                <select id="goal-player-${matchId}" style="flex: 1; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    <option value="">Sélectionner une joueuse...</option>
        `;
        
        this.players.forEach(player => {
            if (stats.lineup.includes(player.id)) {
                html += `<option value="${player.id}">${player.name}</option>`;
            }
        });

        html += `
                </select>
                <button onclick="app.addGoal('${matchId}')" class="btn-primary" style="padding: 10px 20px;">Ajouter un but</button>
            </div>
        `;

        html += `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #333; margin-bottom: 15px;">🎯 Passes décisives</h3>
                <div id="assists-list-${matchId}" style="margin-bottom: 15px;">
        `;

        if (stats.assists && stats.assists.length > 0) {
            stats.assists.forEach((assist, index) => {
                const player = this.players.find(p => p.id === assist.playerId);
                html += `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 10px;">
                        <span style="flex: 1; font-weight: 500;">${player ? player.name : 'Inconnue'}</span>
                        <input type="number" value="${assist.count}" min="1" max="10" 
                               onchange="app.updateAssistCount('${matchId}', ${index}, this.value)"
                               style="width: 60px; padding: 5px; border: 2px solid #e0e0e0; border-radius: 4px;">
                        <span style="color: #666;">passe(s)</span>
                        <button onclick="app.removeAssist('${matchId}', ${index})" 
                                style="background: #f8d7da; color: #721c24; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
                    </div>
                `;
            });
        } else {
            html += `<p style="color: #999; font-style: italic;">Aucune passe décisive enregistrée</p>`;
        }

        html += `</div>`;

        html += `
                <select id="assist-player-${matchId}" style="flex: 1; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    <option value="">Sélectionner une joueuse...</option>
        `;
        
        this.players.forEach(player => {
            if (stats.lineup.includes(player.id)) {
                html += `<option value="${player.id}">${player.name}</option>`;
            }
        });

        html += `
                </select>
                <button onclick="app.addAssist('${matchId}')" class="btn-primary" style="padding: 10px 20px;">Ajouter une passe décisive</button>
            </div>
        `;

        html += `
            <div style="margin-top: 30px; text-align: right;">
                <button class="btn-primary" onclick="closeMatchStatsModal(); app.renderMatches();">Fermer</button>
            </div>
        `;

        content.innerHTML = html;
        modal.classList.add('active');
    }

    toggleMatchLineup(matchId, playerId) {
        if (!this.matchStats[matchId]) {
            this.matchStats[matchId] = { lineup: [], goals: [], assists: [] };
        }

        const lineup = this.matchStats[matchId].lineup;
        const index = lineup.indexOf(playerId);
        
        if (index > -1) {
            lineup.splice(index, 1);
            this.matchStats[matchId].goals = this.matchStats[matchId].goals.filter(g => g.playerId !== playerId);
            this.matchStats[matchId].assists = this.matchStats[matchId].assists.filter(a => a.playerId !== playerId);
        } else {
            lineup.push(playerId);
        }

        this.saveData('matchStats', this.matchStats);
        this.manageMatchStats(matchId);
    }

    addGoal(matchId) {
        const select = document.getElementById(`goal-player-${matchId}`);
        const playerId = select.value;
        
        if (!playerId) {
            alert('Veuillez sélectionner une joueuse');
            return;
        }

        if (!this.matchStats[matchId]) {
            this.matchStats[matchId] = { lineup: [], goals: [], assists: [] };
        }

        const existingGoal = this.matchStats[matchId].goals.find(g => g.playerId === playerId);
        if (existingGoal) {
            existingGoal.count++;
        } else {
            this.matchStats[matchId].goals.push({ playerId, count: 1 });
        }

        this.saveData('matchStats', this.matchStats);
        this.manageMatchStats(matchId);
    }

    removeGoal(matchId, index) {
        this.matchStats[matchId].goals.splice(index, 1);
        this.saveData('matchStats', this.matchStats);
        this.manageMatchStats(matchId);
    }

    updateGoalCount(matchId, index, count) {
        this.matchStats[matchId].goals[index].count = parseInt(count);
        this.saveData('matchStats', this.matchStats);
    }

    addAssist(matchId) {
        const select = document.getElementById(`assist-player-${matchId}`);
        const playerId = select.value;
        
        if (!playerId) {
            alert('Veuillez sélectionner une joueuse');
            return;
        }

        if (!this.matchStats[matchId]) {
            this.matchStats[matchId] = { lineup: [], goals: [], assists: [] };
        }

        const existingAssist = this.matchStats[matchId].assists.find(a => a.playerId === playerId);
        if (existingAssist) {
            existingAssist.count++;
        } else {
            this.matchStats[matchId].assists.push({ playerId, count: 1 });
        }

        this.saveData('matchStats', this.matchStats);
        this.manageMatchStats(matchId);
    }

    removeAssist(matchId, index) {
        this.matchStats[matchId].assists.splice(index, 1);
        this.saveData('matchStats', this.matchStats);
        this.manageMatchStats(matchId);
    }

    updateAssistCount(matchId, index, count) {
        this.matchStats[matchId].assists[index].count = parseInt(count);
        this.saveData('matchStats', this.matchStats);
    }

    viewTacticDetails(id) {
        const tactic = this.tactics.find(t => t.id === id);
        if (!tactic) return;

        const modal = document.getElementById('tactic-modal');
        document.getElementById('tactic-modal-title').textContent = `Tactique: ${tactic.name}`;
        
        document.getElementById('tactic-name').value = tactic.name;
        document.getElementById('tactic-formation').value = tactic.formation;
        document.getElementById('tactic-notes').value = tactic.notes || '';
        
        document.getElementById('tactic-name').disabled = true;
        document.getElementById('tactic-formation').disabled = true;
        document.getElementById('tactic-notes').disabled = true;
        
        this.currentTacticPositions = tactic.positions || {};
        this.loadFormationTemplate(tactic.formation);
        
        Object.entries(tactic.positions || {}).forEach(([positionId, playerId]) => {
            const player = this.players.find(p => p.id === playerId);
            const slot = document.querySelector(`[data-position="${positionId}"]`);
            if (player && slot) {
                slot.classList.add('filled');
                slot.innerHTML = `
                    <span class="position-label">${slot.querySelector('.position-label').textContent}</span>
                    <span class="player-name">${player.name}</span>
                `;
            }
        });
        
        const submitBtn = document.querySelector('#tactic-form button[type="submit"]');
        submitBtn.style.display = 'none';
        
        const closeBtn = document.querySelector('#tactic-form .btn-secondary');
        closeBtn.textContent = 'Fermer';
        closeBtn.onclick = function() {
            document.getElementById('tactic-name').disabled = false;
            document.getElementById('tactic-formation').disabled = false;
            document.getElementById('tactic-notes').disabled = false;
            submitBtn.style.display = 'block';
            closeBtn.textContent = 'Annuler';
            closeBtn.onclick = null;
            closeTacticModal();
        };
        
        modal.classList.add('active');
    }

    editTactic(id) {
        const tactic = this.tactics.find(t => t.id === id);
        if (!tactic) return;

        document.getElementById('tactic-id').value = tactic.id;
        document.getElementById('tactic-name').value = tactic.name;
        document.getElementById('tactic-formation').value = tactic.formation;
        document.getElementById('tactic-notes').value = tactic.notes || '';
        document.getElementById('tactic-modal-title').textContent = 'Modifier la tactique';
        
        this.currentTacticPositions = tactic.positions || {};
        this.loadFormationTemplate(tactic.formation);
        
        Object.entries(tactic.positions || {}).forEach(([positionId, playerId]) => {
            const player = this.players.find(p => p.id === playerId);
            const slot = document.querySelector(`[data-position="${positionId}"]`);
            if (player && slot) {
                slot.classList.add('filled');
                slot.innerHTML = `
                    <span class="position-label">${slot.querySelector('.position-label').textContent}</span>
                    <span class="player-name">${player.name}</span>
                    <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('${positionId}')">✕</span>
                `;
            }
        });
        
        openTacticModal();
    }

    deleteTactic(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tactique ?')) {
            this.tactics = this.tactics.filter(t => t.id !== id);
            this.saveData('tactics', this.tactics);
            this.renderTactics();
        }
    }

    assignTacticToMatch(tacticId) {
        const tactic = this.tactics.find(t => t.id === tacticId);
        if (!tactic) return;

        const modal = document.getElementById('player-modal');
        const modalContent = modal.querySelector('.modal-content');

        let html = `
            <span class="close" onclick="closePlayerModal()">&times;</span>
            <h2>Assigner "${tactic.name}" à un match</h2>
            <p style="color: #666; margin: 20px 0;">Sélectionnez le match auquel vous voulez appliquer cette tactique :</p>
        `;

        if (this.matches.length === 0) {
            html += `<p style="color: #999; font-style: italic; text-align: center;">Aucun match disponible</p>`;
        } else {
            const upcomingMatches = this.matches.filter(m => new Date(m.date) >= new Date().setHours(0,0,0,0));
            
            if (upcomingMatches.length === 0) {
                html += `<p style="color: #999; font-style: italic; text-align: center;">Aucun match à venir</p>`;
            } else {
                upcomingMatches.forEach(match => {
                    const matchTactic = match.tacticId ? this.tactics.find(t => t.id === match.tacticId) : null;
                    html += `
                        <div style="padding: 15px; border: 2px solid #e0e0e0; border-radius: 8px; margin-bottom: 10px; cursor: pointer;" 
                             onclick="app.setMatchTactic('${match.id}', '${tacticId}')">
                            <div style="font-weight: 600; color: #333;">${this.formatDate(match.date)} - vs ${match.opponent}</div>
                            <div style="color: #666; font-size: 14px; margin-top: 5px;">
                                ${match.location} à ${match.time}
                                ${matchTactic ? `<br><strong>Tactique actuelle:</strong> ${matchTactic.name}` : ''}
                            </div>
                        </div>
                    `;
                });
            }
        }

        html += `
            <div style="margin-top: 30px; text-align: right;">
                <button class="btn-secondary" onclick="closePlayerModal()">Annuler</button>
            </div>
        `;

        modalContent.innerHTML = html;
        modal.classList.add('active');
    }

    setMatchTactic(matchId, tacticId) {
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
            match.tacticId = tacticId;
            this.saveData('matches', this.matches);
            closePlayerModal();
            alert('Tactique assignée au match avec succès !');
            this.renderMatches();
        }
    }

    assignTacticToTraining(tacticId) {
        const tactic = this.tactics.find(t => t.id === tacticId);
        if (!tactic) return;

        alert(`La tactique "${tactic.name}" a été notée pour le prochain entraînement.\nVous pourrez la travailler lors de la prochaine séance.`);
    }

    loadFormationTemplate(formation) {
        const formations = {
            '3-3-2': {
                goalkeeper: 1,
                defense: 3,
                midfield: 3,
                attack: 2
            },
            '3-2-3': {
                goalkeeper: 1,
                defense: 3,
                midfield: 2,
                attack: 3
            },
            '2-4-2': {
                goalkeeper: 1,
                defense: 2,
                midfield: 4,
                attack: 2
            },
            '2-3-3': {
                goalkeeper: 1,
                defense: 2,
                midfield: 3,
                attack: 3
            },
            '3-4-1': {
                goalkeeper: 1,
                defense: 3,
                midfield: 4,
                attack: 1
            },
            '4-2-2': {
                goalkeeper: 1,
                defense: 4,
                midfield: 2,
                attack: 2
            },
            '2-2-4': {
                goalkeeper: 1,
                defense: 2,
                midfield: 2,
                attack: 4
            }
        };

        const template = formations[formation];
        if (!template) return;

        this.currentTacticPositions = {};
        this.renderFootballField(template);
        this.renderPlayersList();
    }

    renderFootballField(template) {
        const field = document.getElementById('football-field');
        
        let html = '';
        
        // Attaque
        for (let i = 0; i < template.attack; i++) {
            const spacing = 100 / (template.attack + 1);
            const leftPos = spacing * (i + 1);
            html += `
                <div class="position-slot draggable-position" 
                     data-position="attack-${i}" 
                     draggable="true"
                     onclick="app.selectPosition('attack-${i}')"
                     style="left: ${leftPos}%; top: 15%;">
                    <span class="position-label">ATT ${i + 1}</span>
                    <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('attack-${i}')">✕</span>
                </div>
            `;
        }
        
        // Milieu
        for (let i = 0; i < template.midfield; i++) {
            const spacing = 100 / (template.midfield + 1);
            const leftPos = spacing * (i + 1);
            html += `
                <div class="position-slot draggable-position" 
                     data-position="midfield-${i}" 
                     draggable="true"
                     onclick="app.selectPosition('midfield-${i}')"
                     style="left: ${leftPos}%; top: 40%;">
                    <span class="position-label">MIL ${i + 1}</span>
                    <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('midfield-${i}')">✕</span>
                </div>
            `;
        }
        
        // Défense
        for (let i = 0; i < template.defense; i++) {
            const spacing = 100 / (template.defense + 1);
            const leftPos = spacing * (i + 1);
            html += `
                <div class="position-slot draggable-position" 
                     data-position="defense-${i}" 
                     draggable="true"
                     onclick="app.selectPosition('defense-${i}')"
                     style="left: ${leftPos}%; top: 70%;">
                    <span class="position-label">DÉF ${i + 1}</span>
                    <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('defense-${i}')">✕</span>
                </div>
            `;
        }
        
        // Gardienne
        html += `
            <div class="position-slot draggable-position" 
                 data-position="goalkeeper-0" 
                 draggable="true"
                 onclick="app.selectPosition('goalkeeper-0')"
                 style="left: 50%; top: 90%;">
                <span class="position-label">GB</span>
                <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('goalkeeper-0')">✕</span>
            </div>
        `;
        
        field.innerHTML = html;
        
        // Activer le drag & drop après avoir créé les éléments
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const field = document.getElementById('football-field');
        const positions = document.querySelectorAll('.draggable-position');
        let draggedElement = null;
        let startX = 0;
        let startY = 0;
        let isDragging = false;

        positions.forEach(position => {
            // Mouse events pour PC
            position.addEventListener('mousedown', (e) => {
                // Ignorer si c'est un clic sur le bouton remove
                if (e.target.classList.contains('remove-player')) return;
                
                draggedElement = position;
                isDragging = false;
                startX = e.clientX;
                startY = e.clientY;
                
                e.preventDefault();
            });

            // Touch events pour mobile
            position.addEventListener('touchstart', (e) => {
                if (e.target.classList.contains('remove-player')) return;
                
                draggedElement = position;
                isDragging = false;
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;
                
                e.preventDefault();
            });
        });

        // Mouse move
        document.addEventListener('mousemove', (e) => {
            if (!draggedElement) return;
            
            const moveX = Math.abs(e.clientX - startX);
            const moveY = Math.abs(e.clientY - startY);
            
            // Si le mouvement est supérieur à 5px, c'est un drag
            if (moveX > 5 || moveY > 5) {
                isDragging = true;
                draggedElement.style.opacity = '0.7';
                
                const fieldRect = field.getBoundingClientRect();
                const x = ((e.clientX - fieldRect.left) / fieldRect.width) * 100;
                const y = ((e.clientY - fieldRect.top) / fieldRect.height) * 100;
                
                const clampedX = Math.max(5, Math.min(95, x));
                const clampedY = Math.max(5, Math.min(95, y));
                
                draggedElement.style.left = `${clampedX}%`;
                draggedElement.style.top = `${clampedY}%`;
            }
        });

        // Touch move
        document.addEventListener('touchmove', (e) => {
            if (!draggedElement) return;
            
            const touch = e.touches[0];
            const moveX = Math.abs(touch.clientX - startX);
            const moveY = Math.abs(touch.clientY - startY);
            
            if (moveX > 5 || moveY > 5) {
                isDragging = true;
                draggedElement.style.opacity = '0.7';
                
                const fieldRect = field.getBoundingClientRect();
                const x = ((touch.clientX - fieldRect.left) / fieldRect.width) * 100;
                const y = ((touch.clientY - fieldRect.top) / fieldRect.height) * 100;
                
                const clampedX = Math.max(5, Math.min(95, x));
                const clampedY = Math.max(5, Math.min(95, y));
                
                draggedElement.style.left = `${clampedX}%`;
                draggedElement.style.top = `${clampedY}%`;
            }
            
            e.preventDefault();
        });

        // Mouse up
        document.addEventListener('mouseup', (e) => {
            if (draggedElement) {
                draggedElement.style.opacity = '1';
                
                // Si ce n'était pas un drag, traiter comme un clic
                if (!isDragging && !e.target.classList.contains('remove-player')) {
                    const positionId = draggedElement.getAttribute('data-position');
                    this.selectPosition(positionId);
                }
                
                draggedElement = null;
                isDragging = false;
            }
        });

        // Touch end
        document.addEventListener('touchend', (e) => {
            if (draggedElement) {
                draggedElement.style.opacity = '1';
                
                if (!isDragging) {
                    const positionId = draggedElement.getAttribute('data-position');
                    this.selectPosition(positionId);
                }
                
                draggedElement = null;
                isDragging = false;
            }
        });
    }

    renderPlayersList() {
        const container = document.getElementById('players-available-list');
        
        if (this.players.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Aucune joueuse disponible</p>';
            return;
        }

        const assignedPlayers = Object.values(this.currentTacticPositions || {});
        
        container.innerHTML = this.players.map(player => {
            const isAssigned = assignedPlayers.includes(player.id);
            return `
                <div class="player-item ${isAssigned ? 'assigned' : ''}" 
                     data-player-id="${player.id}"
                     onclick="${isAssigned ? '' : `app.assignPlayerToSelectedPosition('${player.id}')`}">
                    <span>${player.name}</span>
                    <span class="player-position-badge">${player.position}</span>
                </div>
            `;
        }).join('');
    }

    selectPosition(positionId) {
        document.querySelectorAll('.position-slot').forEach(slot => {
            slot.style.boxShadow = 'none';
        });
        
        const slot = document.querySelector(`[data-position="${positionId}"]`);
        if (slot && !slot.classList.contains('filled')) {
            slot.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
            this.selectedPosition = positionId;
        }
    }

    assignPlayerToSelectedPosition(playerId) {
        if (!this.selectedPosition) {
            alert('Veuillez d\'abord sélectionner une position sur le terrain');
            return;
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        if (!this.currentTacticPositions) {
            this.currentTacticPositions = {};
        }

        this.currentTacticPositions[this.selectedPosition] = playerId;

        const slot = document.querySelector(`[data-position="${this.selectedPosition}"]`);
        if (slot) {
            slot.classList.add('filled');
            slot.innerHTML = `
                <span class="position-label">${slot.querySelector('.position-label').textContent}</span>
                <span class="player-name">${player.name}</span>
                <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('${this.selectedPosition}')">✕</span>
            `;
            slot.style.boxShadow = 'none';
        }

        this.selectedPosition = null;
        this.renderPlayersList();
    }

    removePlayerFromPosition(positionId) {
        if (this.currentTacticPositions && this.currentTacticPositions[positionId]) {
            delete this.currentTacticPositions[positionId];
            
            const slot = document.querySelector(`[data-position="${positionId}"]`);
            if (slot) {
                slot.classList.remove('filled');
                const label = slot.querySelector('.position-label').textContent;
                slot.innerHTML = `
                    <span class="position-label">${label}</span>
                    <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('${positionId}')">✕</span>
                `;
            }
            
            this.renderPlayersList();
        }
    }
}

function openPlayerModal() {
    document.getElementById('player-modal').classList.add('active');
}

function closePlayerModal() {
    document.getElementById('player-modal').classList.remove('active');
    document.getElementById('player-form').reset();
    document.getElementById('player-id').value = '';
    document.getElementById('player-modal-title').textContent = 'Ajouter un joueur';
}

function savePlayer(event) {
    event.preventDefault();

    const id = document.getElementById('player-id').value || Date.now().toString();
    const player = {
        id,
        name: document.getElementById('player-name').value,
        position: document.getElementById('player-position').value,
        birthyear: parseInt(document.getElementById('player-birthyear').value),
        phone: document.getElementById('player-phone').value,
        notes: document.getElementById('player-notes').value
    };

    const existingIndex = app.players.findIndex(p => p.id === id);
    if (existingIndex > -1) {
        app.players[existingIndex] = player;
    } else {
        app.players.push(player);
    }

    app.saveData('players', app.players);
    app.renderPlayers();
    app.renderPerformances();
    closePlayerModal();
}

function openTrainingModal() {
    document.getElementById('training-modal').classList.add('active');
}

function closeTrainingModal() {
    document.getElementById('training-modal').classList.remove('active');
    document.getElementById('training-form').reset();
    document.getElementById('training-id').value = '';
    document.getElementById('training-modal-title').textContent = 'Planifier un entraînement';
}

function saveTraining(event) {
    event.preventDefault();

    const id = document.getElementById('training-id').value || Date.now().toString();
    const training = {
        id,
        date: document.getElementById('training-date').value,
        time: document.getElementById('training-time').value,
        duration: parseInt(document.getElementById('training-duration').value),
        location: document.getElementById('training-location').value,
        objectives: document.getElementById('training-objectives').value
    };

    const existingIndex = app.trainings.findIndex(t => t.id === id);
    if (existingIndex > -1) {
        app.trainings[existingIndex] = training;
    } else {
        app.trainings.push(training);
    }

    app.saveData('trainings', app.trainings);
    app.renderTrainings();
    app.renderPerformances();
    closeTrainingModal();
}

function openMatchModal() {
    document.getElementById('match-modal').classList.add('active');
}

function closeMatchModal() {
    document.getElementById('match-modal').classList.remove('active');
    document.getElementById('match-form').reset();
    document.getElementById('match-id').value = '';
    document.getElementById('match-modal-title').textContent = 'Ajouter un match';
}

function saveMatch(event) {
    event.preventDefault();

    const id = document.getElementById('match-id').value || Date.now().toString();
    const scoreHome = document.getElementById('match-score-home').value;
    const scoreAway = document.getElementById('match-score-away').value;

    const match = {
        id,
        team: document.getElementById('match-team').value,
        date: document.getElementById('match-date').value,
        time: document.getElementById('match-time').value,
        opponent: document.getElementById('match-opponent').value,
        location: document.getElementById('match-location').value,
        type: document.getElementById('match-type').value,
        scoreHome: scoreHome !== '' ? parseInt(scoreHome) : undefined,
        scoreAway: scoreAway !== '' ? parseInt(scoreAway) : undefined
    };

    const existingIndex = app.matches.findIndex(m => m.id === id);
    if (existingIndex > -1) {
        app.matches[existingIndex] = match;
    } else {
        app.matches.push(match);
    }

    app.saveData('matches', app.matches);
    app.renderMatches();
    app.renderPerformances();
    closeMatchModal();
}

function closeAttendanceHistoryModal() {
    document.getElementById('attendance-history-modal').classList.remove('active');
}

function closeMatchStatsModal() {
    document.getElementById('match-stats-modal').classList.remove('active');
}

function openTacticModal() {
    document.getElementById('tactic-modal').classList.add('active');
}

function closeTacticModal() {
    document.getElementById('tactic-modal').classList.remove('active');
    document.getElementById('tactic-form').reset();
    document.getElementById('tactic-id').value = '';
    document.getElementById('tactic-modal-title').textContent = 'Créer une tactique';
    document.getElementById('football-field').innerHTML = '';
    app.currentTacticPositions = {};
    app.selectedPosition = null;
}

function saveTactic(event) {
    event.preventDefault();

    const formation = document.getElementById('tactic-formation').value;
    if (!formation) {
        alert('Veuillez sélectionner une formation');
        return;
    }

    const id = document.getElementById('tactic-id').value || Date.now().toString();
    const tactic = {
        id,
        name: document.getElementById('tactic-name').value,
        formation: formation,
        notes: document.getElementById('tactic-notes').value,
        positions: app.currentTacticPositions || {},
        createdAt: new Date().toISOString()
    };

    const existingIndex = app.tactics.findIndex(t => t.id === id);
    if (existingIndex > -1) {
        app.tactics[existingIndex] = tactic;
    } else {
        app.tactics.push(tactic);
    }

    app.saveData('tactics', app.tactics);
    app.renderTactics();
    closeTacticModal();
}

const app = new FootballTeamManager();

// Navigation entre les vues
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const mainNav = document.getElementById('main-nav');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.getAttribute('data-view');
            app.navigateToView(viewName);
        });
    });

    // Fonction globale de navigation
    app.navigateToView = function(viewName) {
        // Afficher la navigation si on quitte l'accueil
        if (viewName !== 'accueil') {
            mainNav.style.display = 'flex';
        } else {
            mainNav.style.display = 'none';
        }

        // Cacher toutes les vues
        views.forEach(view => view.classList.remove('active'));
        
        // Afficher la vue demandée
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }

        // Mettre à jour les boutons actifs
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === viewName) {
                btn.classList.add('active');
            }
        });

        // Générer les graphiques si on accède aux statistiques
        if (viewName === 'statistiques') {
            setTimeout(() => app.renderCharts(), 100);
        }
    };
});
