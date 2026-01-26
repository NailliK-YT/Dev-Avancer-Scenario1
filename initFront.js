// Données générales pour le tableau
const villesData = {
	"Fecamp": { cp: "76260", pop: "17 961", dens: "1 110", etudes: "22%" },
	"Yvetot": { cp: "76758", pop: "11 677", dens: "950", etudes: "25%" },
	"Montivilliers": { cp: "76447", pop: "15 671", dens: "820", etudes: "28%" },
	"Lisieux": { cp: "14366", pop: "19 540", dens: "1 050", etudes: "21%" },
	"Herouville-Saint-Clair": { cp: "14327", pop: "22 473", dens: "2 100", etudes: "32%" },
	"Elbeuf": { cp: "76231", pop: "15 774", dens: "1 450", etudes: "19%" },
	"Barentin": { cp: "76057", pop: "12 227", dens: "980", etudes: "20%" }
};

// Données de prix historiques en dur (format identique aux naissances)
const prixHistoriques = {
	"76260": [{ annee: "2021", prix: 1950 }, { annee: "2022", prix: 2050 }, { annee: "2023", prix: 2100 }, { annee: "2024", prix: 2150 }],
	"76758": [{ annee: "2021", prix: 1800 }, { annee: "2022", prix: 1850 }, { annee: "2023", prix: 1950 }, { annee: "2024", prix: 2000 }],
	"76447": [{ annee: "2021", prix: 2200 }, { annee: "2022", prix: 2300 }, { annee: "2023", prix: 2400 }, { annee: "2024", prix: 2450 }],
	"14366": [{ annee: "2021", prix: 1700 }, { annee: "2022", prix: 1750 }, { annee: "2023", prix: 1850 }, { annee: "2024", prix: 1900 }],
	"14327": [{ annee: "2021", prix: 2000 }, { annee: "2022", prix: 2100 }, { annee: "2023", prix: 2200 }, { annee: "2024", prix: 2300 }],
	"76231": [{ annee: "2021", prix: 1450 }, { annee: "2022", prix: 1500 }, { annee: "2023", prix: 1600 }, { annee: "2024", prix: 1650 }],
	"76057": [{ annee: "2021", prix: 1900 }, { annee: "2022", prix: 1980 }, { annee: "2023", prix: 2050 }, { annee: "2024", prix: 2100 }]
};

function fillCityTable() {
	const tbody = document.getElementById('cityTableBody');
	if (!tbody) return;

	tbody.innerHTML = Object.entries(villesData).map(([nom, info]) => {
		// On récupère le dernier prix connu dans notre tableau en dur
		const dernierPrix = prixHistoriques[info.cp].slice(-1)[0].prix;
		return `
        <tr>
            <td><strong>${nom}</strong></td>
            <td>${info.cp}</td>
            <td>${info.pop} hab.</td>
            <td>${info.dens}</td>
            <td>${info.etudes}</td>
            <td><span class="badge bg-primary">${dernierPrix} €/m²</span></td>
        </tr>`;
	}).join('');
}
async function renderCityCharts() {
	const grid = document.getElementById('chartsGrid');
	if (!grid) return;

	for (const [nom, info] of Object.entries(villesData)) {
		// On crée une colonne pour chaque ville dans la grille
		const col = document.createElement('div');
		col.className = 'col-md-6 mb-4';
		col.innerHTML = `
            <div class="city-card">
                <h5 class="mb-3" style="border-left: 5px solid #0d6efd; padding-left: 10px;">${nom}</h5>
                <div style="height: 300px;">
                    <canvas id="chart-${info.cp}"></canvas>
                </div>
            </div>`;
		grid.appendChild(col);

		try {
			const birthData = await loadNaissance(info.cp);
			const sortedBirths = birthData.sort((a, b) => a.annee - b.annee);
			const sortedPrices = prixHistoriques[info.cp].sort((a, b) => a.annee - b.annee);

			const ctx = document.getElementById(`chart-${info.cp}`).getContext('2d');



			new Chart(ctx, {
				type: 'bar',
				data: {
					labels: sortedBirths.map(d => d.annee),
					datasets: [
						{
							label: 'Naissances',
							data: sortedBirths.map(d => d.naissances),
							backgroundColor: 'rgba(13, 110, 253, 0.6)',
							yAxisID: 'y'
						},
						{
							label: 'Prix m²',
							data: sortedPrices.map(p => p.prix),
							type: 'line',
							borderColor: '#ffc107',
							borderWidth: 3,
							tension: 0.3,
							yAxisID: 'y1'
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						y: { beginAtZero: true, position: 'left' },
						y1: { beginAtZero: false, position: 'right', grid: { drawOnChartArea: false } }
					},
					plugins: {
						legend: { position: 'bottom', labels: { boxWidth: 12 } }
					}
				}
			});
		} catch (error) {
			console.error(`Erreur pour ${nom}:`, error);
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	fillCityTable();
	renderCityCharts();
});