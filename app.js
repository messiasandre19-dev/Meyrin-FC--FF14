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
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Vérifier la structure
                if (!importData.data) {
                    alert('❌ Fichier invalide : structure incorrecte');
                    return;
                }

                const confirmMessage = `🔄 Confirmer l'importation ?\n\n` +
                    `📅 Date de sauvegarde : ${new Date(importData.exportDate).toLocaleDateString('fr-FR')}\n\n` +
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

                alert('✅ Importation réussie ! Toutes vos données ont été restaurées.');
                
            } catch (error) {
                console.error('Erreur d\'importation:', error);
                alert('❌ Erreur lors de l\'importation : fichier corrompu ou format invalide');
            }
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
            .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

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
                ${match.scoreHome !== undefined ? `
                    <button class="btn-primary attendance-btn" onclick="app.manageMatchStats('${match.id}')">
                        ${hasStats ? '📊 Voir/Modifier les statistiques' : '📊 Ajouter les statistiques du match'}
                    </button>
                ` : ''}
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

    countByPosition(position) {
        return this.players.filter(p => p.position === position).length;
    }

    getAttendanceCount(trainingId) {
        return (this.attendances[trainingId] || []).length;
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
        
        let html = `
            <!-- Attaque -->
            <div class="field-section attack">
        `;
        
        for (let i = 0; i < template.attack; i++) {
            html += `
                <div class="position-slot" data-position="attack-${i}" onclick="app.selectPosition('attack-${i}')">
                    <span class="position-label">ATT ${i + 1}</span>
                    <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('attack-${i}')">✕</span>
                </div>
            `;
        }
        
        html += `
            </div>
            <!-- Milieu -->
            <div class="field-section midfield">
        `;
        
        for (let i = 0; i < template.midfield; i++) {
            html += `
                <div class="position-slot" data-position="midfield-${i}" onclick="app.selectPosition('midfield-${i}')">
                    <span class="position-label">MIL ${i + 1}</span>
                    <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('midfield-${i}')">✕</span>
                </div>
            `;
        }
        
        html += `
            </div>
            <!-- Défense -->
            <div class="field-section defense">
        `;
        
        for (let i = 0; i < template.defense; i++) {
            html += `
                <div class="position-slot" data-position="defense-${i}" onclick="app.selectPosition('defense-${i}')">
                    <span class="position-label">DÉF ${i + 1}</span>
                    <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('defense-${i}')">✕</span>
                </div>
            `;
        }
        
        html += `
            </div>
            <!-- Gardienne -->
            <div class="field-section goalkeeper">
                <div class="position-slot" data-position="goalkeeper-0" onclick="app.selectPosition('goalkeeper-0')">
                    <span class="position-label">GB</span>
                    <span class="remove-player" onclick="event.stopPropagation(); app.removePlayerFromPosition('goalkeeper-0')">✕</span>
                </div>
            </div>
        `;
        
        field.innerHTML = html;
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
        phone: document.getElementById('player-phone').value
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
