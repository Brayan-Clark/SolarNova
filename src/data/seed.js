// ============================================================
//  Donnees par defaut (seed) - SolarNova
// ============================================================
//  Servent de contenu initial : affichees telles quelles tant que
//  rien n'est stocke (ni Supabase, ni localStorage). L'admin peut
//  ensuite les modifier (voir src/lib/content.js).
// ------------------------------------------------------------

export const solutionsSeed = [
                        {
                            id: 1,
                            name: "Kit Éclairage Basic",
                            tier: "basic",
                            subtitle: "Éclairage et charges légères",
                            maxWatts: 150,
                            maxDailyWh: 600,
                            components: [
                                "Panneau solaire 100W monocristallin",
                                "Régulateur de charge MPPT 10A",
                                "Batterie gel 12V 45Ah",
                                "Convertisseur 300W pur sinus",
                                "Câblage et protections électriques",
                                "Installation professionnelle comprise",
                            ],
                            priceRange: "1 200 000 - 1 900 000 Ar",
                            icon: "fa-solid fa-lightbulb",
                            color: "from-green-600 to-green-800",
                        },
                        {
                            id: 2,
                            name: "Kit Résidentiel Standard",
                            tier: "standard",
                            subtitle: "Ménage avec électroménager léger",
                            maxWatts: 500,
                            maxDailyWh: 2500,
                            components: [
                                "2× Panneaux solaires 200W monocristallin",
                                "Régulateur MPPT 20A",
                                "Batterie gel 12V 100Ah ×2",
                                "Convertisseur 800W pur sinus",
                                "Tableau électrique DC/AC",
                                "Câblage complet et installation",
                            ],
                            priceRange: "3 400 000 - 5 300 000 Ar",
                            icon: "fa-solid fa-house",
                            color: "from-emerald-600 to-teal-800",
                        },
                        {
                            id: 3,
                            name: "Kit Résidentiel Premium",
                            tier: "premium",
                            subtitle: "Confort complet sans compromis",
                            maxWatts: 1200,
                            maxDailyWh: 5000,
                            components: [
                                "4× Panneaux solaires 300W monocristallin",
                                "Régulateur MPPT 40A",
                                "Batterie lithium 48V 100Ah",
                                "Convertisseur 3000W pur sinus",
                                "Système de monitoring intelligent",
                                "Tableau électrique complet",
                                "Installation et mise en service",
                            ],
                            priceRange: "9 000 000 - 13 700 000 Ar",
                            icon: "fa-solid fa-house-chimney",
                            color: "from-teal-600 to-cyan-800",
                        },
                        {
                            id: 4,
                            name: "Kit Professionnel",
                            tier: "pro",
                            subtitle: "Bureaux, commerces et PME",
                            maxWatts: 2500,
                            maxDailyWh: 10000,
                            components: [
                                "8× Panneaux solaires 400W monocristallin",
                                "Régulateur MPPT 60A",
                                "Batterie lithium 48V 200Ah",
                                "Convertisseur 5000W pur sinus",
                                "Monitoring à distance",
                                "Protection surtensions",
                                "Installation certifiée",
                            ],
                            priceRange: "19 000 000 - 30 000 000 Ar",
                            icon: "fa-solid fa-building",
                            color: "from-cyan-600 to-blue-800",
                        },
                        {
                            id: 5,
                            name: "Kit Industriel",
                            tier: "industriel",
                            subtitle: "Grands besoins énergétiques",
                            maxWatts: 5000,
                            maxDailyWh: 20000,
                            components: [
                                "16× Panneaux solaires 550W monocristallin",
                                "Régulateurs MPPT 80A ×2",
                                "Batterie lithium 48V 400Ah",
                                "Onduleur hybride 8kW",
                                "Système de gestion énergétique",
                                "Monitoring en temps réel",
                                "Installation clé en main",
                            ],
                            priceRange: "Sur devis",
                            icon: "fa-solid fa-industry",
                            color: "from-amber-600 to-orange-800",
                        },
];

export const articlesSeed = [
                        {
                            id: 1,
                            category: "Guide",
                            date: "15 Janvier 2025",
                            readTime: "6 min de lecture",
                            image: "https://picsum.photos/seed/solar-panels-guide/800/400.jpg",
                            title: "Comprendre le Fonctionnement des Panneaux Solaires : Le Guide Complet",
                            excerpt:
                                "Découvrez comment les cellules photovoltaïques transforment la lumière du soleil en électricité utilisable, et ce qui différencie les différents types de panneaux.",
                            content: `<p>Les panneaux solaires photovoltaïques fonctionnent grâce à l'effet photovoltaïque, un phénomène physique découvert en 1839 par Alexandre Edmond Becquerel. Lorsque les photons de la lumière frappent les cellules de silicium, ils transfèrent leur énergie aux électrons du matériau, créant ainsi un courant électrique.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">Les types de panneaux</h3>
        <p>Il existe trois grandes familles de panneaux solaires. Les <strong class="text-sol-300">monocristallins</strong>, reconnaissables à leurs cellules noires uniformes, offrent le meilleur rendement (18-22%). Les <strong class="text-sol-300">polycristallins</strong>, aux cellules bleues avec des motifs visibles, sont légèrement moins performants mais plus abordables. Enfin, les <strong class="text-sol-300">panneaux à couche mince</strong> (amorphes) sont flexibles et adaptés à des surfaces irrégulières, mais leur rendement reste inférieur.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">Le rôle du régulateur et de l'onduleur</h3>
        <p>Le courant produit par les panneaux est continu (DC). Le régulateur de charge contrôle ce flux pour protéger les batteries de la surcharge et de la décharge profonde. L'onduleur, quant à lui, convertit le courant continu en courant alternatif (AC) compatible avec vos appareils ménagers. Les onduleurs "pur sinus" sont recommandés car ils produisent un courant de qualité identique à celui du réseau.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">Le stockage : batteries gel vs lithium</h3>
        <p>Les batteries gel sont économiques et fiables pour des usages modérés, avec une durée de vie de 3 à 5 ans. Les batteries lithium, plus coûteuses, offrent une durée de vie de 10 à 15 ans, supportent plus de cycles de charge/décharge et sont plus légères. Pour les installations résidentielles modernes, le lithium devient le choix privilégié malgré un investissement initial plus élevé.</p>`,
                        },
                        {
                            id: 2,
                            category: "Conseils",
                            date: "28 Décembre 2024",
                            readTime: "5 min de lecture",
                            image: "https://picsum.photos/seed/energy-saving-tips/800/400.jpg",
                            title: "5 Astuces Concrètes pour Réduire Votre Consommation Énergétique",
                            excerpt:
                                "Avant d'investir dans le solaire, optimisez votre consommation. Voici cinq stratégies éprouvées pour diminuer vos besoins sans sacrifier votre confort.",
                            content: `<p>Réduire sa consommation énergétique n'est pas un sacrifice — c'est une optimisation intelligente. Chaque watt économisé est un watt que vous n'avez pas besoin de produire, ce qui réduit directement la taille et le coût de votre installation solaire.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">1. Passez au tout LED</h3>
        <p>Remplacer toutes vos ampoules par des LED peut réduire votre consommation d'éclairage de 70 à 80%. Une ampoule LED de 10W produit autant de lumière qu'une ampoule à incandescence de 60W. Pour un ménage moyen, cela représente une économie de 200 à 400 Wh par jour.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">2. Choisissez des appareils économes</h3>
        <p>Lors de l'achat d'un réfrigérateur, d'un climatiseur ou d'une machine à laver, vérifiez l'étiquette énergétique. Un réfrigérateur de classe A+ consomme moitié moins qu'un modèle standard. Sur 10 ans, la différence de consommation peut représenter le prix de l'appareil lui-même.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">3. Gérez intelligemment vos usages</h3>
        <p>Programmez vos appareils énergivores (machine à laver, bouilloire) pendant les heures de pointe solaire (10h-15h). Utilisez des multiprises avec interrupteur pour couper complètement les appareils en veille, qui consomment jusqu'à 10% de votre électricité totale.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">4. Optimisez l'isolation thermique</h3>
        <p>Un bâtiment bien isolé réduit drastiquement les besoins en climatisation et chauffage. Des rideaux épais, des joints de porte, et si possible une isolation des murs et toiture peuvent réduire votre facture de climatisation de 30 à 50%.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">5. Suivez votre consommation</h3>
        <p>Installez un wattmètre ou un système de monitoring pour identifier les appareils les plus gourmands. La prise de conscience est le premier pas vers l'optimisation. Nos kits Premium et Professionnels incluent un système de monitoring en temps réel.</p>`,
                        },
                        {
                            id: 3,
                            category: "Actualité",
                            date: "10 Décembre 2024",
                            readTime: "7 min de lecture",
                            image: "https://picsum.photos/seed/solar-africa-future/800/400.jpg",
                            title: "L'Avenir de l'Énergie Solaire en Afrique : Opportunités et Défis",
                            excerpt:
                                "Le continent africain possède le plus grand potentiel solaire au monde. Pourtant, des centaines de millions de personnes n'ont toujours pas accès à l'électricité.",
                            content: `<p>L'Afrique reçoit en moyenne 325 jours de soleil par an, avec un ensoleillement pouvant atteindre 2 200 kWh/m² dans le Sahel. Ce potentiel colossal fait du solaire la solution la plus prometteuse pour combler le déficit énergétique du continent, où plus de 600 millions de personnes n'ont toujours pas accès à l'électricité.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">Le solaire décentralisé : une révolution en marche</h3>
        <p>Contrairement au modèle classique des grandes centrales, l'Afrique embrace le solaire décentralisé — des kits résidentiels autonomes aux mini-réseaux (mini-grids) alimentant des villages entiers. Ce modèle évite les coûts prohibitifs d'extension du réseau national et offre une mise en œuvre rapide. Au Mali, au Sénégal et au Nigeria, des milliers de foyers ont déjà fait le choix du solaire hors-réseau.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">La baisse des coûts change la donne</h3>
        <p>Le coût des panneaux solaires a chuté de plus de 90% en 15 ans. Combiné à la baisse des prix des batteries lithium, le solaire est devenu compétitif — et souvent moins cher — que les générateurs diesel, sans compter les coûts de carburant et de maintenance. Pour un ménage malgache dépensant 110 000 à 230 000 Ar par mois en carburant, un kit solaire se rentabilise en 2 à 4 ans.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">Les défis restants</h3>
        <p>Malgré ce potentiel, des obstacles persistent : le manque de financement accessible, les taxes parfois élevées sur les équipements importés, le besoin de formation technique locale, et la nécessité de cadres réglementaires adaptés. Cependant, les gouvernements africains prennent conscience de l'enjeu et multiplient les initiatives pour faciliter l'accès au solaire.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">SolarNova : acteur de cette transition</h3>
        <p>Chez SolarNova, nous nous positionnons comme un acteur concret de cette transformation. Chaque installation que nous réalisons est une contribution directe à l'électrification de notre région, un ménage de plus libéré de la dépendance au réseau ou au carburant, un pas de plus vers un avenir énergétique souverain et durable.</p>`,
                        },
                        {
                            id: 4,
                            category: "Guide",
                            date: "25 Novembre 2024",
                            readTime: "8 min de lecture",
                            image: "https://picsum.photos/seed/choose-solar-kit/800/400.jpg",
                            title: "Comment Choisir le Kit Solaire Adapté à Vos Besoins Réels",
                            excerpt:
                                "Taille de panneaux, capacité batterie, puissance d'onduleur... Découvrez la méthode pas-à-pas pour dimensionner votre installation solaire.",
                            content: `<p>Le dimensionnement d'une installation solaire est l'étape la plus critique. Trop petit, le système ne couvrira pas vos besoins. Trop grand, vous payerez pour une capacité inutilisée. Voici la méthode professionnelle que nous appliquons chez SolarNova pour chaque projet.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">Étape 1 : Inventaire de vos appareils</h3>
        <p>Listez tous les appareils que vous souhaitez alimenter, avec leur puissance en Watts et leur durée d'utilisation quotidienne en heures. Multipliez la puissance par le nombre d'heures pour obtenir la consommation en Wattheures (Wh) par jour. C'est exactement ce que fait notre <strong class="text-sol-300">calculateur d'énergie</strong> pour vous.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">Étape 2 : Déterminer la puissance crête</h3>
        <p>La somme des puissances de tous les appareils susceptibles de fonctionner simultanément détermine la puissance minimale de votre onduleur. Ajoutez une marge de sécurité de 20 à 30% pour les pics de démarrage (notamment pour les réfrigérateurs et pompes).</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">Étape 3 : Dimensionner les batteries</h3>
        <p>Pour 2 jours d'autonomie (recommandé), multipliez votre consommation journalière par 2, puis divisez par la tension du système (12V, 24V ou 48V) pour obtenir la capacité en Ampères-heures (Ah). Pour un système 48V avec 5000 Wh/jour : (5000 × 2) / 48 = 208 Ah minimum.</p>
        <h3 class="font-display font-700 text-xl text-sol-200 mt-6 mb-3">Étape 4 : Calculer le nombre de panneaux</h3>
        <p>Divisez votre consommation journalière par le nombre d'heures d'ensoleillement efficace (environ 5h au Mali) et par le rendement du système (environ 0.75 pour tenir compte des pertes). Pour 5000 Wh/jour : 5000 / (5 × 0.75) = 1333 Wc, soit environ 4 panneaux de 350W.</p>
        <p class="mt-6"><strong class="text-sol-300">Notre conseil :</strong> utilisez notre calculateur pour une première estimation, puis contactez-nous pour une étude détaillée et personnalisée, gratuite et sans engagement.</p>`,
                        },
];

export const reviewsSeed = [
                        {
                            name: "Amadou Diallo",
                            solution: "Kit Résidentiel Standard",
                            rating: 5,
                            comment:
                                "Installation impeccable réalisée en une journée. L'équipe est professionnelle et a pris le temps d'expliquer le fonctionnement du système. Depuis 6 mois, tout fonctionne parfaitement. Mon réfrigérateur tourne 24h/24 sans problème.",
                            date: "15 Nov. 2024",
                        },
                        {
                            name: "Fatoumata Koné",
                            solution: "Kit Éclairage Basic",
                            rating: 4,
                            comment:
                                "Très satisfaite de ce kit d'éclairage. Toute la maison est éclairée, les enfants peuvent étudier le soir. Le seul petit bémol c'est que je ne peux pas alimenter mon téléviseur avec, mais pour le prix c'est un excellent rapport qualité-prix.",
                            date: "22 Oct. 2024",
                        },
                        {
                            name: "Ibrahim Touré",
                            solution: "Kit Professionnel",
                            rating: 5,
                            comment:
                                "Solution parfaite pour mon cybercafé. J'ai 15 ordinateurs, un serveur, des routeurs et l'éclairage — tout fonctionne grâce au kit professionnel. La monitoring à distance est un plus énorme, je peux vérifier la production depuis mon téléphone.",
                            date: "01 Déc. 2024",
                        },
                        {
                            name: "Mariam Coulibaly",
                            solution: "Kit Résidentiel Premium",
                            rating: 5,
                            comment:
                                "Depuis l'installation du kit premium, nous avons quasiment oublié les coupures. Le climatiseur, la machine à laver, le réfrigérateur, tout tourne sans souci. Le système de monitoring est très intuitif. Investissement que je ne regrette absolument pas.",
                            date: "30 Sep. 2024",
                        },
                        {
                            name: "Oumar Sidibé",
                            solution: "Kit Résidentiel Standard",
                            rating: 4,
                            comment:
                                "Bon rapport qualité-prix. L'installation a été faite proprement. Petit souci avec le régulateur au bout de 3 mois, mais le SAV est intervenu sous 48h et a remplacé la pièce sous garantie. C'est rassurant.",
                            date: "18 Août 2024",
                        },
                        {
                            name: "Aïssata Traoré",
                            solution: "Kit Éclairage Basic",
                            rating: 5,
                            comment:
                                "J'ai offert ce kit à ma mère au village. Elle est ravie ! Plus besoin de lampes à pétrole, la maison est bien éclairée et les téléphones se chargent. Un vrai changement de vie pour pas grand-chose.",
                            date: "05 Juil. 2024",
                        },
];
