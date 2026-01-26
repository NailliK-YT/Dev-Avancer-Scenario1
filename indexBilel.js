const token = "TON_ACCESS_TOKEN";

const villes = {
	"LeHavre": "76351",
	"Rouen": "76540",
	"Caen": "14118",
	"Nantes": "44109"
}

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

async function loadTailleMenages(com) {
    const annee = 2022;    
    const params = `GEO=COM-${com}&TIME_PERIOD=${annee}`;
    
    try {
        const data = await fetchAPI("DS_RP_MENAGES_PRINC", params);

        return data.observations.map(obs => ({
            annee: obs.dimensions.TIME_PERIOD,
            tailleMoyenne: obs.measures.OBS_VALUE?.value ?? obs.measures.OBS_VALUE
        }));
    } catch (error) {
        console.error("Erreur lors du chargement des ménages :", error);
        return [];
    }
}

Object.entries(villes).forEach(([ville, com]) => {
    loadTailleMenages(com).then(data => {
        console.log(`Résultat pour ${ville}:`, data);
    });
});