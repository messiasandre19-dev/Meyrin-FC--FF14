const championshipCalendar = [
    // Journée 1 - 07.03.2026
    { date: "2026-03-07", time: "08:30", home: "FC Veyrier Sports 1", away: "Meyrin FC 2", matchNumber: "212581", team: "team2" },
    { date: "2026-03-07", time: "09:00", home: "FC Onex 1", away: "FC Plan-les-Ouates 1", matchNumber: "212578" },
    { date: "2026-03-07", time: "11:00", home: "Meyrin FC 1", away: "FC Aïre-le-Lignon 1", matchNumber: "212580", team: "team1" },
    { date: "2026-03-07", time: "12:30", home: "FC Champel 1", away: "CS Interstar 1", matchNumber: "212579" },
    
    // Journée 2 - 14.03.2026
    { date: "2026-03-14", time: "09:00", home: "FC Onex 1", away: "FC Champel 1", matchNumber: "212585" },
    { date: "2026-03-14", time: "09:00", home: "CS Interstar 1", away: "Meyrin FC 1", matchNumber: "212584", team: "team1" },
    { date: "2026-03-14", time: "11:30", home: "FC Plan-les-Ouates 1", away: "Meyrin FC 2", matchNumber: "212582", team: "team2" },
    { date: "2026-03-14", time: "12:30", home: "FC Aïre-le-Lignon 1", away: "FC Veyrier Sports 1", matchNumber: "212583" },
    
    // Journée 3 - 21.03.2026
    { date: "2026-03-21", time: "08:30", home: "FC Veyrier Sports 1", away: "CS Interstar 1", matchNumber: "212588" },
    { date: "2026-03-21", time: "10:30", home: "FC Champel 1", away: "FC Plan-les-Ouates 1", matchNumber: "212586" },
    { date: "2026-03-21", time: "12:30", home: "Meyrin FC 1", away: "FC Onex 1", matchNumber: "212587", team: "team1" },
    { date: "2026-03-21", time: "12:30", home: "Meyrin FC 2", away: "FC Aïre-le-Lignon 1", matchNumber: "212589", team: "team2" },
    
    // Journée 4 - 28.03.2026
    { date: "2026-03-28", time: "09:00", home: "FC Onex 1", away: "FC Veyrier Sports 1", matchNumber: "212592" },
    { date: "2026-03-28", time: "11:30", home: "FC Plan-les-Ouates 1", away: "FC Aïre-le-Lignon 1", matchNumber: "212590" },
    { date: "2026-03-28", time: "13:00", home: "CS Interstar 1", away: "Meyrin FC 2", matchNumber: "212591", team: "team2" },
    
    // Journée 4 bis - 29.03.2026
    { date: "2026-03-29", time: "10:30", home: "FC Champel 1", away: "Meyrin FC 1", matchNumber: "212593", team: "team1" },
    
    // Journée 5 - 18.04.2026
    { date: "2026-04-18", time: "10:00", home: "Meyrin FC 1", away: "FC Plan-les-Ouates 1", matchNumber: "212594", team: "team1" },
    { date: "2026-04-18", time: "10:00", home: "Meyrin FC 2", away: "FC Onex 1", matchNumber: "212596", team: "team2" },
    { date: "2026-04-18", time: "11:15", home: "FC Veyrier Sports 1", away: "FC Champel 1", matchNumber: "212595" },
    { date: "2026-04-18", time: "12:30", home: "FC Aïre-le-Lignon 1", away: "CS Interstar 1", matchNumber: "212597" },
    
    // Journée 6 - 25.04.2026
    { date: "2026-04-25", time: "09:00", home: "FC Onex 1", away: "FC Aïre-le-Lignon 1", matchNumber: "212599" },
    { date: "2026-04-25", time: "10:00", home: "Meyrin FC 1", away: "FC Veyrier Sports 1", matchNumber: "212601", team: "team1" },
    { date: "2026-04-25", time: "10:30", home: "FC Champel 1", away: "Meyrin FC 2", matchNumber: "212600", team: "team2" },
    { date: "2026-04-25", time: "11:30", home: "FC Plan-les-Ouates 1", away: "CS Interstar 1", matchNumber: "212598" },
    
    // Journée 7 - 02.05.2026
    { date: "2026-05-02", time: "09:00", home: "CS Interstar 1", away: "FC Onex 1", matchNumber: "212605" },
    { date: "2026-05-02", time: "10:00", home: "Meyrin FC 2", away: "Meyrin FC 1", matchNumber: "212603", team: "both" },
    { date: "2026-05-02", time: "11:15", home: "FC Veyrier Sports 1", away: "FC Plan-les-Ouates 1", matchNumber: "212602" },
    { date: "2026-05-02", time: "12:30", home: "FC Aïre-le-Lignon 1", away: "FC Champel 1", matchNumber: "212604" },
    
    // Journée 8 - 09.05.2026
    { date: "2026-05-09", time: "09:30", home: "Meyrin FC 2", away: "FC Veyrier Sports 1", matchNumber: "212609", team: "team2" },
    { date: "2026-05-09", time: "11:00", home: "CS Interstar 1", away: "FC Champel 1", matchNumber: "212607" },
    { date: "2026-05-09", time: "11:30", home: "FC Plan-les-Ouates 1", away: "FC Onex 1", matchNumber: "212606" },
    { date: "2026-05-09", time: "12:30", home: "FC Aïre-le-Lignon 1", away: "Meyrin FC 1", matchNumber: "212608", team: "team1" },
    
    // Journée 9 - 16.05.2026
    { date: "2026-05-16", time: "00:00", home: "FC Veyrier Sports 1", away: "FC Aïre-le-Lignon 1", matchNumber: "212611" },
    { date: "2026-05-16", time: "10:00", home: "Meyrin FC 2", away: "FC Plan-les-Ouates 1", matchNumber: "212610", team: "team2" },
    { date: "2026-05-16", time: "10:00", home: "Meyrin FC 1", away: "CS Interstar 1", matchNumber: "212612", team: "team1" },
    { date: "2026-05-16", time: "10:00", home: "FC Champel 1", away: "FC Onex 1", matchNumber: "212613" },
    
    // Journée 10 - 23.05.2026
    { date: "2026-05-23", time: "11:00", home: "CS Interstar 1", away: "FC Veyrier Sports 1", matchNumber: "212616" },
    { date: "2026-05-23", time: "11:30", home: "FC Plan-les-Ouates 1", away: "FC Champel 1", matchNumber: "212614" },
    { date: "2026-05-23", time: "12:30", home: "FC Aïre-le-Lignon 1", away: "Meyrin FC 2", matchNumber: "212617", team: "team2" },
    { date: "2026-05-23", time: "13:00", home: "FC Onex 1", away: "Meyrin FC 1", matchNumber: "212615", team: "team1" },
    
    // Journée 11 - 30.05.2026
    { date: "2026-05-30", time: "00:00", home: "FC Veyrier Sports 1", away: "FC Onex 1", matchNumber: "212620" },
    { date: "2026-05-30", time: "12:00", home: "Meyrin FC 1", away: "FC Champel 1", matchNumber: "212621", team: "team1" },
    { date: "2026-05-30", time: "12:00", home: "Meyrin FC 2", away: "CS Interstar 1", matchNumber: "212619", team: "team2" },
    { date: "2026-05-30", time: "12:30", home: "FC Aïre-le-Lignon 1", away: "FC Plan-les-Ouates 1", matchNumber: "212618" }
];

// Fonction pour importer le calendrier
function importChampionshipCalendar() {
    if (confirm('Voulez-vous importer le calendrier complet du championnat ?\nCela ajoutera ' + championshipCalendar.length + ' matchs.')) {
        const existingMatches = app.matches || [];
        let importedCount = 0;

        championshipCalendar.forEach(match => {
            // Vérifier si le match n'existe pas déjà
            const exists = existingMatches.some(m => m.matchNumber === match.matchNumber);
            
            if (!exists) {
                const newMatch = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    team: match.team || '',
                    date: match.date,
                    time: match.time,
                    opponent: match.home === 'Meyrin FC 1' || match.home === 'Meyrin FC 2' ? match.away : match.home,
                    location: match.home === 'Meyrin FC 1' || match.home === 'Meyrin FC 2' ? 'Domicile' : 'Extérieur',
                    type: 'Championnat',
                    matchNumber: match.matchNumber,
                    homeTeam: match.home,
                    awayTeam: match.away
                };
                app.matches.push(newMatch);
                importedCount++;
            }
        });

        app.saveData('matches', app.matches);
        app.renderMatches();
        alert(importedCount + ' matchs du calendrier ont été importés avec succès !');
    }
}
