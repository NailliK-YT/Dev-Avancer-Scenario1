// Données générales pour le tableau (utilise l'objet villes de index.js)
// L'objet villes est défini dans index.js et contient les codes communes
const villesData = Object.fromEntries(
	Object.entries(villes).map(([nom, cp]) => [nom, { cp }])
);

// Fonction asynchrone pour remplir le tableau avec les données de l'API
async function fillCityTable() {
	const tbody = document.getElementById('cityTableBody');
	if (!tbody) return;

	// Afficher un spinner de chargement
	tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div></td></tr>';

	// Charger les données pour chaque ville
	const rows = [];
	for (const [nom, cp] of Object.entries(villes)) {
		try {
			// Charger les données en parallèle pour chaque ville
			const [popData, densiteData, diplomesData, prixData] = await Promise.all([
				loadPopulation(cp),
				loadDensitePopulation(cp),
				loadDiplomes(cp),
				loadPrixImmobilier(cp)
			]);

			// Récupérer la population la plus récente
			const pop = popData.length > 0 ? popData.sort((a, b) => b.annee - a.annee)[0].populations : 'N/A';

			// Récupérer la densité
			const dens = densiteData.length > 0 ? Math.round(densiteData[0].densitePopulation) : 'N/A';

			// Calculer le pourcentage d'études supérieures (Bac+2 et plus)
			const totalPop = diplomesData.reduce((sum, d) => sum + d.population, 0);
			const etudesSup = diplomesData
				.filter(d => ['Bac+2 (BTS, DUT)', 'Bac+3/4 (Licence, Master 1)', 'Bac+5 et plus'].includes(d.diplome))
				.reduce((sum, d) => sum + d.population, 0);
			const etudes = totalPop > 0 ? Math.round((etudesSup / totalPop) * 100) : 0;

			// Récupérer le prix au m²
			const prix = prixData.prixMoyenM2 || 'N/A';

			rows.push(`
				<tr>
					<td><strong>${nom}</strong></td>
					<td>${cp}</td>
					<td>${pop.toLocaleString('fr-FR')} hab.</td>
					<td>${dens.toLocaleString('fr-FR')}</td>
					<td>${etudes}%</td>
					<td><span class="badge bg-primary">${prix.toLocaleString('fr-FR')} €/m²</span></td>
				</tr>`);
		} catch (error) {
			console.error(`Erreur pour ${nom}:`, error);
			rows.push(`
				<tr>
					<td><strong>${nom}</strong></td>
					<td>${cp}</td>
					<td colspan="4" class="text-danger">Erreur de chargement</td>
				</tr>`);
		}
	}

	tbody.innerHTML = rows.join('');
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
				const [birthData, prixData] = await Promise.all([
					loadNaissance(info.cp),
					loadPrixImmobilier(info.cp)
				]);
				const sortedBirths = birthData.sort((a, b) => a.annee - b.annee);
				// On utilise le prix moyen au m² pour chaque année (même valeur car pas d'historique)
				const prixMoyen = prixData.prixMoyenM2 || 0;

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
								data: sortedBirths.map(() => prixMoyen),
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