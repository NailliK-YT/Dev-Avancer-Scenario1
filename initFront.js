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
// Variables pour savoir si les graphiques ont déjà été chargés
let naissancesLoaded = false;
let populationLoaded = false;
let menagesLoaded = false;
let diplomesLoaded = false;
let activeLoaded = false;
let densiteLoaded = false;

// ============================================================
// RENDER NAISSANCES
// ============================================================
async function renderNaissances() {
	const grid = document.getElementById('chartsGrid');
	if (!grid) return;

	// Si les graphiques sont déjà chargés, on ne les recharge pas
	if (naissancesLoaded) return;
	naissancesLoaded = true;

	// Afficher un message de chargement
	grid.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div><p class="mt-2">Chargement des graphiques...</p></div>';

	// Vider le message de chargement avant de commencer
	setTimeout(() => {
		grid.innerHTML = '';
		
		// Créer tous les canvas d'abord
		const canvasElements = [];
		for (const [nom, info] of Object.entries(villesData)) {
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
			canvasElements.push({ nom, info });
		}

		// Ensuite charger les données et créer les graphiques
		canvasElements.forEach(async ({ nom, info }) => {
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
		});
	}, 100);
}

// ============================================================
// RENDER POPULATION SEXE ET ÂGE
// ============================================================
async function renderPopulation() {
	const grid = document.getElementById('chartsGridPopulation');
	if (!grid) return;

	if (populationLoaded) return;
	populationLoaded = true;

	grid.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div><p class="mt-2">Chargement des graphiques...</p></div>';

	setTimeout(() => {
		grid.innerHTML = '';
		
		const canvasElements = [];
		for (const [nom, info] of Object.entries(villesData)) {
			const col = document.createElement('div');
			col.className = 'col-md-6 mb-4';
			col.innerHTML = `
				<div class="city-card">
					<h5 class="mb-3" style="border-left: 5px solid #0d6efd; padding-left: 10px;">${nom}</h5>
					<div style="height: 300px;">
						<canvas id="chart-pop-${info.cp}"></canvas>
					</div>
				</div>`;
			grid.appendChild(col);
			canvasElements.push({ nom, info });
		}

		canvasElements.forEach(async ({ nom, info }) => {
			try {
				const popData = await loadPopulationSexeAge(info.cp);
				const prixData = await loadPrixImmobilier(info.cp);
				
				// Filtrer pour obtenir les données par sexe (Hommes et Femmes uniquement)
				const hommes = popData.filter(p => p.sexe === 'M').reduce((sum, p) => sum + p.population, 0);
				const femmes = popData.filter(p => p.sexe === 'F').reduce((sum, p) => sum + p.population, 0);

				const ctx = document.getElementById(`chart-pop-${info.cp}`).getContext('2d');

				new Chart(ctx, {
					type: 'bar',
					data: {
						labels: ['Hommes', 'Femmes'],
						datasets: [
							{
								label: 'Population',
								data: [hommes, femmes],
								backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
								yAxisID: 'y'
							},
							{
								label: 'Prix m²',
								data: [prixData.prixMoyenM2, prixData.prixMoyenM2],
								type: 'line',
								borderColor: '#ffc107',
								borderWidth: 3,
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
		});
	}, 100);
}

// ============================================================
// RENDER TAILLE DES MÉNAGES
// ============================================================
async function renderMenages() {
	const grid = document.getElementById('chartsGridMenages');
	if (!grid) return;

	if (menagesLoaded) return;
	menagesLoaded = true;

	grid.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div><p class="mt-2">Chargement des graphiques...</p></div>';

	setTimeout(() => {
		grid.innerHTML = '';
		
		const canvasElements = [];
		for (const [nom, info] of Object.entries(villesData)) {
			const col = document.createElement('div');
			col.className = 'col-md-6 mb-4';
			col.innerHTML = `
				<div class="city-card">
					<h5 class="mb-3" style="border-left: 5px solid #0d6efd; padding-left: 10px;">${nom}</h5>
					<div style="height: 300px;">
						<canvas id="chart-menages-${info.cp}"></canvas>
					</div>
				</div>`;
			grid.appendChild(col);
			canvasElements.push({ nom, info });
		}

		canvasElements.forEach(async ({ nom, info }) => {
			try {
				const menagesData = await loadTailleMenages(info.cp);
				const prixData = await loadPrixImmobilier(info.cp);
				
				const tailleMoyenne = menagesData[0]?.tailleMoyenneMenage || 0;

				const ctx = document.getElementById(`chart-menages-${info.cp}`).getContext('2d');

				new Chart(ctx, {
					type: 'bar',
					data: {
						labels: ['Taille Moyenne Ménage'],
						datasets: [
							{
								label: 'Personnes par ménage',
								data: [tailleMoyenne.toFixed(2)],
								backgroundColor: 'rgba(75, 192, 192, 0.6)',
								yAxisID: 'y'
							},
							{
								label: 'Prix m²',
								data: [prixData.prixMoyenM2],
								type: 'line',
								borderColor: '#ffc107',
								borderWidth: 3,
								yAxisID: 'y1',
								pointRadius: 6
							}
						]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							y: { beginAtZero: true, position: 'left', max: 5 },
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
		});
	}, 100);
}

// ============================================================
// RENDER DIPLÔMES
// ============================================================
async function renderDiplomes() {
	const grid = document.getElementById('chartsGridEtude');
	if (!grid) return;

	if (diplomesLoaded) return;
	diplomesLoaded = true;

	grid.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div><p class="mt-2">Chargement des graphiques...</p></div>';

	setTimeout(() => {
		grid.innerHTML = '';
		
		const canvasElements = [];
		for (const [nom, info] of Object.entries(villesData)) {
			const col = document.createElement('div');
			col.className = 'col-md-6 mb-4';
			col.innerHTML = `
				<div class="city-card">
					<h5 class="mb-3" style="border-left: 5px solid #0d6efd; padding-left: 10px;">${nom}</h5>
					<div style="height: 300px;">
						<canvas id="chart-diplomes-${info.cp}"></canvas>
					</div>
				</div>`;
			grid.appendChild(col);
			canvasElements.push({ nom, info });
		}

		canvasElements.forEach(async ({ nom, info }) => {
			try {
				const diplomesData = await loadDiplomes(info.cp);
				const prixData = await loadPrixImmobilier(info.cp);
				
				// Grouper par niveau de diplôme
				const diplomeLabels = [...new Set(diplomesData.map(d => d.diplome))];
				const diplomeValues = diplomeLabels.map(label => 
					diplomesData.filter(d => d.diplome === label).reduce((sum, d) => sum + d.population, 0)
				);

				const ctx = document.getElementById(`chart-diplomes-${info.cp}`).getContext('2d');

				new Chart(ctx, {
					type: 'bar',
					data: {
						labels: diplomeLabels.slice(0, 5), // Limiter à 5 pour la lisibilité
						datasets: [
							{
								label: 'Population',
								data: diplomeValues.slice(0, 5),
								backgroundColor: 'rgba(153, 102, 255, 0.6)',
								yAxisID: 'y'
							},
							{
								label: 'Prix m²',
								data: Array(5).fill(prixData.prixMoyenM2),
								type: 'line',
								borderColor: '#ffc107',
								borderWidth: 3,
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
		});
	}, 100);
}

// ============================================================
// RENDER POPULATION ACTIVE
// ============================================================
async function renderPopulationActive() {
	const grid = document.getElementById('chartsGridActive');
	if (!grid) return;

	if (activeLoaded) return;
	activeLoaded = true;

	grid.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div><p class="mt-2">Chargement des graphiques...</p></div>';

	setTimeout(() => {
		grid.innerHTML = '';
		
		const canvasElements = [];
		for (const [nom, info] of Object.entries(villesData)) {
			const col = document.createElement('div');
			col.className = 'col-md-6 mb-4';
			col.innerHTML = `
				<div class="city-card">
					<h5 class="mb-3" style="border-left: 5px solid #0d6efd; padding-left: 10px;">${nom}</h5>
					<div style="height: 300px;">
						<canvas id="chart-active-${info.cp}"></canvas>
					</div>
				</div>`;
			grid.appendChild(col);
			canvasElements.push({ nom, info });
		}

		canvasElements.forEach(async ({ nom, info }) => {
			try {
				const activeData = await loadTauxActiviteEtEmplois(info.cp);
				const prixData = await loadPrixImmobilier(info.cp);
				
				const tauxActivite = activeData[0]?.tauxActivite || 0;

				const ctx = document.getElementById(`chart-active-${info.cp}`).getContext('2d');

				new Chart(ctx, {
					type: 'bar',
					data: {
						labels: ['Taux d\'activité (%)'],
						datasets: [
							{
								label: 'Taux d\'activité',
								data: [tauxActivite],
								backgroundColor: 'rgba(255, 159, 64, 0.6)',
								yAxisID: 'y'
							},
							{
								label: 'Prix m²',
								data: [prixData.prixMoyenM2],
								type: 'line',
								borderColor: '#ffc107',
								borderWidth: 3,
								yAxisID: 'y1',
								pointRadius: 6
							}
						]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							y: { beginAtZero: true, position: 'left', max: 100 },
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
		});
	}, 100);
}

// ============================================================
// RENDER DENSITÉ
// ============================================================
async function renderDensite() {
	const grid = document.getElementById('chartsGridDensite');
	if (!grid) return;

	if (densiteLoaded) return;
	densiteLoaded = true;

	grid.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div><p class="mt-2">Chargement des graphiques...</p></div>';

	setTimeout(() => {
		grid.innerHTML = '';
		
		const canvasElements = [];
		for (const [nom, info] of Object.entries(villesData)) {
			const col = document.createElement('div');
			col.className = 'col-md-6 mb-4';
			col.innerHTML = `
				<div class="city-card">
					<h5 class="mb-3" style="border-left: 5px solid #0d6efd; padding-left: 10px;">${nom}</h5>
					<div style="height: 300px;">
						<canvas id="chart-densite-${info.cp}"></canvas>
					</div>
				</div>`;
			grid.appendChild(col);
			canvasElements.push({ nom, info });
		}

		canvasElements.forEach(async ({ nom, info }) => {
			try {
				const densiteData = await loadDensitePopulation(info.cp);
				const prixData = await loadPrixImmobilier(info.cp);
				
				const densite = densiteData[0]?.densitePopulation || 0;

				const ctx = document.getElementById(`chart-densite-${info.cp}`).getContext('2d');

				new Chart(ctx, {
					type: 'bar',
					data: {
						labels: ['Densité (hab/km²)'],
						datasets: [
							{
								label: 'Densité',
								data: [densite.toFixed(0)],
								backgroundColor: 'rgba(255, 99, 132, 0.6)',
								yAxisID: 'y'
							},
							{
								label: 'Prix m²',
								data: [prixData.prixMoyenM2],
								type: 'line',
								borderColor: '#ffc107',
								borderWidth: 3,
								yAxisID: 'y1',
								pointRadius: 6
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
		});
	}, 100);
}

document.addEventListener('DOMContentLoaded', () => {
	fillCityTable();
	
	// Écouteurs pour chaque accordéon
	const collapseNaissances = document.getElementById('collapseNaissances');
	if (collapseNaissances) {
		collapseNaissances.addEventListener('shown.bs.collapse', () => {
			renderNaissances();
		});
	}

	const collapsePopulation = document.getElementById('collapsePopulation');
	if (collapsePopulation) {
		collapsePopulation.addEventListener('shown.bs.collapse', () => {
			renderPopulation();
		});
	}

	const collapseMenages = document.getElementById('collapseMenages');
	if (collapseMenages) {
		collapseMenages.addEventListener('shown.bs.collapse', () => {
			renderMenages();
		});
	}

	const collapseEtude = document.getElementById('collapseEtude');
	if (collapseEtude) {
		collapseEtude.addEventListener('shown.bs.collapse', () => {
			renderDiplomes();
		});
	}

	const collapseActive = document.getElementById('collapseActive');
	if (collapseActive) {
		collapseActive.addEventListener('shown.bs.collapse', () => {
			renderPopulationActive();
		});
	}

	const collapseDensite = document.getElementById('collapseDensite');
	if (collapseDensite) {
		collapseDensite.addEventListener('shown.bs.collapse', () => {
			renderDensite();
		});
	}
});