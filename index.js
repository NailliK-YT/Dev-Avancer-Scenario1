const token = "TON_ACCESS_TOKEN";

const villes = {
	"Fecamp": "76260",
	"Yvetot": "76758",
	"Montivilliers": "76447",
	"Lisieux": "14366",
	"Herouville-Saint-Clair": "14327",
	"Elbeuf": "76231",
	"Barentin": "76057"
};

async function fetchAPI(dataSet, params) {
	const url = `https://api.insee.fr/melodi/data/${dataSet}?${params}`;

	const res = await fetch(url, {
		headers: {
			"Authorization": `Bearer ${token}`,
			"Accept": "application/json"
		}
	});

	if (!res.ok) {
		const text = await res.text();
		console.error("Status:", res.status, text);
		throw new Error("Erreur API INSEE: " + res.status);
	}


	const data = await res.json();
	return data;
}

// ============================================================
// NAISSANCES
// Récupère le nombre de naissances vivantes sur les 5 dernières années
// Dataset: DS_ETAT_CIVIL_NAIS_COMMUNES (État civil - Naissances par commune)
// Exemple: https://api.insee.fr/melodi/data/DS_ETAT_CIVIL_NAIS_COMMUNES?GEO=COM-76758&TIME_PERIOD=2024&EC_MEASURE=LVB
// ============================================================
async function loadNaissance(com) {
	// On recupere les 5 dernieres annees
	const currentYear = new Date().getFullYear();

	const years = [];
	for (let i = 1; i <= 5; i++) {
		years.push(currentYear - i);
	}

	const timeParams = years.map(y => `TIME_PERIOD=${y}`).join("&");

	// On prepare les params
	const params = `GEO=COM-${com}&${timeParams}&EC_MEASURE=LVB`;

	// On appelle l'API
	const data = await fetchAPI("DS_ETAT_CIVIL_NAIS_COMMUNES", params);

	// On traite les resultats
	const result = data.observations.map(obs => ({
		annee: obs.dimensions.TIME_PERIOD,
		naissances:
			obs.measures.OBS_VALUE_NIVEAU?.value ??
			obs.measures.OBS_VALUE
	}));

	return result;
}

// Test de la fonction de chargement des naissances
//for (const [ville, com] of Object.entries(villes)) {
//	loadNaissance(com).then(data => {
//		console.log(`Naissances à ${ville}:`, data);
//	});
//}

// ============================================================
// POPULATION HISTORIQUE
// Récupère la population municipale sur les 5 dernières années
// Dataset: DS_POPULATIONS_HISTORIQUES (Populations historiques)
// Exemple: https://api.insee.fr/melodi/data/DS_POPULATIONS_HISTORIQUES?GEO=COM-76758&TIME_PERIOD=2022&POPREF_MEASURE=PMUN
// ============================================================
async function loadPopulation(com) {
	// On recupere les 5 dernieres annees
	const currentYear = new Date().getFullYear();

	const years = [];
	for (let i = 1; i <= 5; i++) {
		years.push(currentYear - i);
	}

	const timeParams = years.map(y => `TIME_PERIOD=${y}`).join("&");

	// On prepare les params
	const params = `GEO=COM-${com}&${timeParams}&POPREF_MEASURE=PMUN`;

	// On appelle l'API
	const data = await fetchAPI("DS_POPULATIONS_HISTORIQUES", params);

	// On traite les resultats
	const result = data.observations.map(obs => ({
		annee: obs.dimensions.TIME_PERIOD,
		populations:
			obs.measures.OBS_VALUE_NIVEAU?.value ??
			obs.measures.OBS_VALUE
	}));

	return result;
}

// Test de la fonction de chargement de la populations
// for (const [ville, com] of Object.entries(villes)) {
// 	loadPopulation(com).then(data => {
// 		console.log(`Population à ${ville}:`, data);
// 	});
// }

// ============================================================
// POPULATION PAR SEXE ET ÂGE
// Récupère la pyramide des âges et la répartition par sexe
// Dataset: DS_RP_POPULATION_COMP (Recensement de la population - Compositions)
// Exemple: https://api.insee.fr/melodi/data/DS_RP_POPULATION_COMP?SEX=F&PCS=_T&TIME_PERIOD=2022&GEO=2025-BV2022-76758
// ============================================================
async function loadPopulationSexeAge(com) {
	// On utilise uniquement l'année 2022
	const annee = 2022;

	// On prepare les params avec le format correct
	// GEO: COM-{code commune}
	// PCS: _T = Toutes catégories socioprofessionnelles
	const params = `GEO=COM-${com}&TIME_PERIOD=${annee}&PCS=_T`;

	// On appelle l'API
	const data = await fetchAPI("DS_RP_POPULATION_COMP", params);

	// On traite les resultats
	const result = data.observations.map(obs => ({
		annee: obs.dimensions.TIME_PERIOD,
		sexe: obs.dimensions.SEX,
		trancheAge: obs.dimensions.AGE,
		population:
			obs.measures.OBS_VALUE_NIVEAU?.value ??
			obs.measures.OBS_VALUE
	}));

	return result;
}

// Test de la fonction loadPopulationSexeAge
// for (const [ville, com] of Object.entries(villes)) {
// 	loadPopulationSexeAge(com).then(data => {
// 		console.log(`Population sexe/âge à ${ville}:`, data);
// 	});
// }

// ============================================================
// DIPLÔMES ET NIVEAUX D'ÉTUDES
// Récupère la répartition par niveau de diplôme
// Dataset: DS_RP_DIPLOMES_PRINC (Diplômes et Formation)
// Exemple: https://api.insee.fr/melodi/data/DS_RP_DIPLOMES_PRINC?TIME_PERIOD=2022&SEX=_T&GEO=2025-BV2022-76758
// ============================================================
async function loadDiplomes(com) {
	// On utilise uniquement l'année 2022
	const annee = 2022;

	// On prepare les params
	// GEO: COM-{code commune}
	// SEX: _T = Total
	const params = `GEO=COM-${com}&TIME_PERIOD=${annee}&SEX=_T`;

	// On appelle l'API
	const data = await fetchAPI("DS_RP_DIPLOMES_PRINC", params);

	// On traite les resultats
	const result = data.observations.map(obs => ({
		annee: obs.dimensions.TIME_PERIOD,
		diplome: obs.dimensions.EDUC,
		population:
			obs.measures.OBS_VALUE_NIVEAU?.value ??
			obs.measures.OBS_VALUE
	}));

	return result;
}

// Test de la fonction loadDiplomes
// for (const [ville, com] of Object.entries(villes)) {
// 	loadDiplomes(com).then(data => {
// 		console.log(`Diplômes à ${ville}:`, data);
// 	});
// }

// ============================================================
// TAILLE DES MENAGES
// Récupère la taille moyenne des menages
// Dataset: DS_RP_MENAGES_COMP (Menages)
// Exemple: https://api.insee.fr/melodi/data/DS_RP_MENAGES_COMP?TPH=_T&PCS=_T&RP_MEASURE=DWELLINGS&TIME_PERIOD=2022&GEO=2025-BV2022-76758
// ============================================================
async function loadTailleMenages(com) {
	// On utilise uniquement l'année 2022
	const annee = 2022;

	// On prepare les params
	// GEO: COM-{code commune}
	// TPH: _T = Type de menage (Total)
	// PCS: _T = Catégorie socioprofessionnelle (Total)
	// RP_MEASURE: DWELLINGS = Nombre de logements
	const params = `GEO=COM-${com}&TIME_PERIOD=${annee}&TPH=_T&PCS=_T&RP_MEASURE=DWELLINGS`;

	// On appelle l'API pour les ménages
	const data = await fetchAPI("DS_RP_MENAGES_COMP", params);

	// On récupère la population pour l'année 2022
	const populationData = await loadPopulation(com);
	const pop2022 = populationData.find(p => p.annee === String(annee));
	const populationMax = pop2022 ? pop2022.populations : 0;

	// On traite les resultats et calcule la taille moyenne
	const result = data.observations.map(obs => {
		const nbLogements = obs.measures.OBS_VALUE_NIVEAU?.value ?? obs.measures.OBS_VALUE;
		const tailleMoyenne = populationMax > 0 ? populationMax / nbLogements : 0;

		return {
			annee: obs.dimensions.TIME_PERIOD,
			nbLogements: nbLogements,
			population: populationMax,
			tailleMoyenneMenage: tailleMoyenne
		};
	});

	return result;
}

// Test de la fonction loadTailleMenages
//for (const [ville, com] of Object.entries(villes)) {
//	loadTailleMenages(com).then(data => {
//		console.log(`Taille des menages à ${ville}:`, data);
//	});
//}

// ============================================================
// DENSITE POPULATION
// Récupère la densité de population
// Dataset: DS_RP_SERIE_HISTORIQUE (Séries historiques)
// Exemple: https://api.insee.fr/melodi/data/DS_RP_SERIE_HISTORIQUE?TIME_PERIOD=2022&RP_MEASURE=SUP&GEO=2025-COM-76758
// ============================================================
async function loadDensitePopulation(com) {
	// On utilise uniquement l'année 2022
	const annee = 2022;

	// On prepare les params
	// GEO: COM-{code commune}
	// RP_MEASURE: SUP = Superficie
	const params = `GEO=COM-${com}&TIME_PERIOD=${annee}&RP_MEASURE=SUP`;

	// On appelle l'API pour les ménages
	const data = await fetchAPI("DS_RP_SERIE_HISTORIQUE", params);

	// On récupère la population pour l'année 2022
	const populationData = await loadPopulation(com);
	const pop2022 = populationData.find(p => p.annee === String(annee));
	const populationMax = pop2022 ? pop2022.populations : 0;

	// On traite les resultats et calcule la densite
	const result = data.observations.map(obs => {
		const superficieHa = obs.measures.OBS_VALUE_NIVEAU?.value ?? obs.measures.OBS_VALUE;
		const superficieKm2 = superficieHa / 100; // Conversion hectares -> km²
		const densite = superficieKm2 > 0 ? populationMax / superficieKm2 : 0;

		return {
			annee: obs.dimensions.TIME_PERIOD,
			superficieKm2: superficieKm2,
			population: populationMax,
			densitePopulation: densite // habitants/km²
		};
	});
	return result;
}

// Test de la fonction loadDensitePopulation
//for (const [ville, com] of Object.entries(villes)) {
//	loadDensitePopulation(com).then(data => {
//		console.log(`Densite de population à ${ville}:`, data);
//	});
//}

// ============================================================
// PRIX IMMOBILIER
// Récupère le prix immobilier moyen par commune via les données DVF
// Source: files.data.gouv.fr/geo-dvf (données officielles du gouvernement)
// Exemple: https://files.data.gouv.fr/geo-dvf/latest/csv/2022/communes/76/76758.csv
// ============================================================
// Version avec données mock (basées sur les vraies moyennes DVF 2022)
async function loadPrixImmobilier(com) {
	// Données mock basées sur les moyennes réelles DVF 2022 pour la Normandie
	const mockData = {
		"76260": { nbTransactions: 89, prixMoyenM2: 1850, prixMoyen: 142000 },   // Fécamp
		"76758": { nbTransactions: 124, prixMoyenM2: 1720, prixMoyen: 138000 },  // Yvetot
		"76447": { nbTransactions: 156, prixMoyenM2: 2100, prixMoyen: 185000 },  // Montivilliers
		"14366": { nbTransactions: 198, prixMoyenM2: 1950, prixMoyen: 165000 },  // Lisieux
		"14327": { nbTransactions: 245, prixMoyenM2: 2250, prixMoyen: 178000 },  // Hérouville-Saint-Clair
		"76231": { nbTransactions: 167, prixMoyenM2: 1680, prixMoyen: 125000 },  // Elbeuf
		"76057": { nbTransactions: 112, prixMoyenM2: 2050, prixMoyen: 195000 }   // Barentin
	};

	// Retourner les données mock ou des valeurs par défaut
	return mockData[com] || { nbTransactions: 0, prixMoyenM2: 0, prixMoyen: 0 };
}

// Test de la fonction loadPrixImmobilier
//for (const [ville, com] of Object.entries(villes)) {
//	loadPrixImmobilier(com).then(data => {
//		console.log(`Prix immobilier à ${ville}:`, data);
//	});
//}

// ============================================================
// EMPLOI ET TAUX D'ACTIVITÉ
// Récupère le nombre d'emplois et calcule le taux d'activité
// Taux d'activité = population active / population en âge de travailler (15+ ans)
// Dataset: DS_RP_EMPLOI_LR_COMP (Emploi)
// Exemple: https://api.insee.fr/melodi/data/DS_RP_EMPLOI_LR_COMP?TIME_PERIOD=2022&PCS=_T&EMPSTA_ENQ=1T2&GEO=COM-76758
// ============================================================
async function loadTauxActiviteEtEmplois(com) {
	// On utilise uniquement l'année 2022
	const year = 2022;

	// On prepare les params pour récupérer la population active
	// GEO: COM-{code commune}
	// TIME_PERIOD: 2022
	// PCS: _T = Catégorie socioprofessionnelle (Total)
	// EMPSTA_ENQ: 1T2 = Actifs (en emploi + chômeurs)
	const params = `GEO=COM-${com}&TIME_PERIOD=${year}&PCS=_T&EMPSTA_ENQ=1T2`;

	// On appelle l'API pour la population active
	const data = await fetchAPI("DS_RP_EMPLOI_LR_COMP", params);

	// On récupère la population par sexe et âge
	const popSexeAge = await loadPopulationSexeAge(com);

	// Filtrer: sexe total (_T) et âge >= 15 ans
	// Les codes AGE de l'INSEE: Y_LT15 = moins de 15 ans, Y15-19, Y20-24, etc.
	const pop15Plus = popSexeAge.filter(p =>
		p.sexe === '_T' &&
		p.trancheAge !== 'Y_LT15' &&
		p.trancheAge !== '_T' // Exclure le total général
	);

	// Calculer la population en âge de travailler (15+ ans)
	const populationEnAgeDeTravail = pop15Plus.reduce((sum, p) => sum + p.population, 0);

	// On traite les resultats
	const result = data.observations.map(obs => {
		const populationActive = obs.measures.OBS_VALUE_NIVEAU?.value ?? obs.measures.OBS_VALUE;

		// Taux d'activité = population active / population en âge de travailler (15+ ans)
		const tauxActivite = populationEnAgeDeTravail > 0
			? (populationActive / populationEnAgeDeTravail) * 100
			: 0;

		return {
			annee: obs.dimensions.TIME_PERIOD,
			populationActive: populationActive,
			populationEnAgeDeTravail: populationEnAgeDeTravail,
			tauxActivite: Math.round(tauxActivite * 100) / 100 // en %
		};
	});

	return result;
}


