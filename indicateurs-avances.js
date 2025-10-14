// indicateurs-avances.js
// Module pour les indicateurs avancés de dynamique de la dette

class IndicateursAvances {
    constructor() {
        // Données historiques r-g (taux effectif - croissance nominale)
        this.donneesRG = {
            periodes: ['2020', '2021', '2022', '2023', '2024', '2025'],
            tauxEffectif: [1.4, 1.3, 1.5, 2.1, 2.4, 2.6],  // r : charge d'intérêts / encours moyen
            croissanceNominale: [-2.8, 8.5, 5.8, 5.9, 3.2, 2.8],  // g : croissance réelle + inflation
            get differentiel() {
                return this.periodes.map((_, i) => 
                    this.tauxEffectif[i] - this.croissanceNominale[i]
                );
            }
        };

        // Échéancier de la dette (amortissements MLT en Mds€)
        this.echeancier = {
            annees: ['2025', '2026', '2027', '2028', '2029'],
            oatNominales: [145.8, 152.3, 148.6, 142.1, 138.5],
            oatIndexees: [12.4, 14.2, 15.8, 13.6, 11.9],
            programmeFinancement: 285,  // Milliards € par an (PLF 2025)
            get total() {
                return this.annees.map((_, i) => 
                    this.oatNominales[i] + this.oatIndexees[i]
                );
            }
        };

        // Spread OAT-Bund (optionnel)
        this.spread = {
            actuel: 0.78,  // en points de %
            moyenne5ans: 0.52,
            min5ans: 0.25,
            max5ans: 1.15,
            dateMAJ: '2025-10-14'
        };
    }

    // Créer l'indicateur r-g avec sparkline
    creerIndicateurRG(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const dernierRG = this.donneesRG.differentiel[this.donneesRG.differentiel.length - 1];
        const dernierR = this.donneesRG.tauxEffectif[this.donneesRG.tauxEffectif.length - 1];
        const dernierG = this.donneesRG.croissanceNominale[this.donneesRG.croissanceNominale.length - 1];

        // Déterminer la couleur selon le signe
        const couleurPastille = dernierRG <= 0 ? '#28a745' : '#dc3545';
        const texteStatut = dernierRG <= 0 ? 'Favorable' : 'Défavorable';

        const html = `
            <div class="metric-card">
                <div class="badge-source">APU • T2 2025</div>
                <div class="rg-display">
                    <div class="rg-values">
                        <div class="rg-item">
                            <span class="rg-label">r (taux effectif)</span>
                            <span class="rg-value">${dernierR.toFixed(1)}%</span>
                        </div>
                        <div class="rg-separator">–</div>
                        <div class="rg-item">
                            <span class="rg-label">g (croissance nom.)</span>
                            <span class="rg-value">${dernierG.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="rg-result">
                        <span class="rg-equals">=</span>
                        <span class="rg-differential" style="color: ${couleurPastille}">
                            ${dernierRG > 0 ? '+' : ''}${dernierRG.toFixed(1)}%
                        </span>
                        <span class="status-pill" style="background-color: ${couleurPastille}">
                            ${texteStatut}
                        </span>
                    </div>
                </div>
                <div class="sparkline-container">
                    <canvas id="sparkline-rg" height="50"></canvas>
                </div>
                <div class="metric-label">
                    Différentiel r-g 
                    <span class="tooltip-container">
                        <span class="tooltip-icon">?</span>
                        <span class="tooltip-text">
                            <strong>Dynamique de la dette :</strong><br>
                            Δd ≈ (r-g)×d - s<sub>p</sub><br><br>
                            • r : taux effectif moyen (charge d'intérêts / encours)<br>
                            • g : croissance nominale du PIB<br>
                            • Si r-g < 0 : effet boule de neige maîtrisé<br>
                            • Si r-g > 0 : besoin d'excédent primaire
                        </span>
                    </span>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.dessinerSparklineRG('sparkline-rg');
    }

    // Dessiner la sparkline r-g
    dessinerSparklineRG(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return;

        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.donneesRG.periodes,
                datasets: [{
                    data: this.donneesRG.differentiel,
                    borderColor: '#2d2d2d',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: (context) => `r-g: ${context.parsed.y.toFixed(1)}%`
                        }
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false,
                        suggestedMin: -5,
                        suggestedMax: 5
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Créer le graphique échéancier
    creerEcheancier(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return;

        const ctx = canvas.getContext('2d');

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.echeancier.annees,
                datasets: [
                    {
                        label: 'OAT nominales',
                        data: this.echeancier.oatNominales,
                        backgroundColor: '#2d2d2d',
                        stack: 'Stack 0'
                    },
                    {
                        label: 'OAT indexées',
                        data: this.echeancier.oatIndexees,
                        backgroundColor: '#5a5a5a',
                        stack: 'Stack 0'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Échéancier de remboursement (Mds€)',
                        font: {
                            size: 14,
                            weight: '300'
                        },
                        color: '#2d2d2d',
                        padding: {
                            bottom: 20
                        }
                    },
                    subtitle: {
                        display: true,
                        text: 'État • AFT • Octobre 2025',
                        font: {
                            size: 11,
                            weight: '300'
                        },
                        color: '#8a8a8a'
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            footer: (tooltipItems) => {
                                const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                                return `Total: ${total.toFixed(1)} Mds€\nProgramme annuel: ${this.echeancier.programmeFinancement} Mds€`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: this.echeancier.programmeFinancement,
                                yMax: this.echeancier.programmeFinancement,
                                borderColor: '#dc3545',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: `Programme de financement: ${this.echeancier.programmeFinancement} Mds€`,
                                    enabled: true,
                                    position: 'end',
                                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                    font: {
                                        size: 10
                                    }
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Milliards €',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: '#f0f0f0'
                        }
                    }
                }
            }
        });
    }

    // Créer l'indicateur de spread (optionnel)
    creerIndicateurSpread(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const ecartMoyenne = this.spread.actuel - this.spread.moyenne5ans;
        const couleur = this.spread.actuel > 1.0 ? '#dc3545' : 
                       this.spread.actuel > 0.7 ? '#ffc107' : '#28a745';

        const html = `
            <div class="spread-indicator">
                <div class="spread-title">Spread OAT-Bund 10 ans</div>
                <div class="spread-value" style="color: ${couleur}">
                    ${(this.spread.actuel * 100).toFixed(0)} pb
                </div>
                <div class="spread-gauge">
                    <div class="gauge-bar">
                        <div class="gauge-fill" style="width: ${(this.spread.actuel / this.spread.max5ans * 100)}%; background: ${couleur}"></div>
                    </div>
                    <div class="gauge-labels">
                        <span>${(this.spread.min5ans * 100).toFixed(0)}</span>
                        <span>Moy: ${(this.spread.moyenne5ans * 100).toFixed(0)}</span>
                        <span>${(this.spread.max5ans * 100).toFixed(0)}</span>
                    </div>
                </div>
                <div class="spread-meta">
                    ${ecartMoyenne > 0 ? '+' : ''}${(ecartMoyenne * 100).toFixed(0)} pb vs moyenne 5 ans
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // Générer un fichier CSV des données
    genererCSV() {
        let csv = 'Indicateur,Période,Valeur,Unité,Source\n';
        
        // Données r-g
        this.donneesRG.periodes.forEach((periode, i) => {
            csv += `Taux effectif (r),${periode},${this.donneesRG.tauxEffectif[i]},%,INSEE/DGTrésor\n`;
            csv += `Croissance nominale (g),${periode},${this.donneesRG.croissanceNominale[i]},%,INSEE\n`;
            csv += `Différentiel (r-g),${periode},${this.donneesRG.differentiel[i]},%,Calcul\n`;
        });

        // Échéancier
        this.echeancier.annees.forEach((annee, i) => {
            csv += `OAT nominales,${annee},${this.echeancier.oatNominales[i]},Mds€,AFT\n`;
            csv += `OAT indexées,${annee},${this.echeancier.oatIndexees[i]},Mds€,AFT\n`;
        });

        // Créer le lien de téléchargement
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dette_publique_indicateurs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndicateursAvances;
}
