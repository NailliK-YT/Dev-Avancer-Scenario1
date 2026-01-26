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
