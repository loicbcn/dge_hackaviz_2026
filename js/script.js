// import Highcharts from 'https://code.highcharts.com/esm/highcharts.js';
// import annotations from 'https://code.highcharts.com/modules/annotations.js'
//import data from '../donnees/cours_eau_dpt.json' assert { type: 'json' };

const depts_codes = ['08','10','51','52','54','55','57','67','68','88'];

const dept_color = {
'08':'#a6cee3',
'10':'#1f78b4',
'51':'#b2df8a',
'52':'#33a02c',
'54':'#fb9a99',
'55':'#e31a1c',
'57':'#fdbf6f',
'67':'#ff7f00',
'68':'#cab2d6',
'88':'#6a3d9a',
}

const ce_alias = {
'la-meuse':'La Meuse',
'la-moselle':'La Moselle',
'la-marne':'La Marne',
'le-rhin':'Le Rhin',
'la-seine':'La Seine'
};

const depts = {
'08': 'Ardennes',
'10': 'Aube',
'51': 'Marne',
'52': 'Haute-Marne',
'54': 'Meurthe-et-Moselle',
'55': 'Meuse',
'57': 'Moselle',
'67': 'Bas-Rhin',
'68': 'Haut-Rhin',
'88': 'Vosges'
}

let tmpl = [];
for ( let i in depts_codes ) {
    tmpl.push(`<div class="item"><span class="carre" style="color:${dept_color[depts_codes[i]]}">■</span> <span class="txt">${depts[depts_codes[i]]}<small> (${depts_codes[i]})</small></span></div>`);
}

document.getElementById('legend_ce').innerHTML = '<div data-layout="cluster">' + tmpl.join('<div class="item"><span>|</span></div>') + '</div>'


async function getdata(path) {
  try {
    const reponse = await fetch(path);
    if (!reponse.ok) {
      throw new Error(`Erreur réseau : ${reponse.status}`);
    }
    
    return await reponse.json(); 
  } catch (erreur) {
    console.error("Impossible de charger le fichier JSON :", erreur);
    return null; 
  }
}

const coursEauData = await getdata('./donnees/cours_eau_dpt.json');
const sites_hydro = await getdata('./donnees/sites_hydro.json');



for( let d in  coursEauData ) {
    const ce_slug = d;
    const ce = coursEauData[d];
    add_div('cont_' + ce_slug, 'graph_' + ce_slug , "one_graph")
    let one_site_data = [];
    let plotBands = [];

    for ( let k in ce ) {
        let vald = 1;
        let valf = 1;
        if ( ce[k]['cod'] === null ) {
            vald = valf = null;
        } else {
            let plotband = {
                color: dept_color[ce[k]['cod']], 
                from: ce[k]['deb'], to: ce[k]['fin'] 
            };
            if( ce[k]['l'] > 5000 ) {
                plotband.label = {
                    text: ce[k]['cod'],
                    align: "center",
                    y:32,
                    style:{
                        fontWeight: 'bold',
                        textOutline: '1px contrast',
                        fontSize:'11px',
                        // Applique l'ombre portée native en CSS
                        //textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
                    }
                }
            }

            plotBands.push(plotband);


        }

        one_site_data.push([ce[k]['deb'], vald], [ce[k]['fin'], valf]);

        for ( let s in sites_hydro ) {
            if ( sites_hydro[s]['slug_ce'] == ce_slug) {
                one_site_data.push({
                    x: sites_hydro[s]['pos'], 
                    y:1, 
                    props:sites_hydro[s], 
                    dataLabels: { enabled: true, 
                                  format: '🌡️', 
                                  y: 16,
                                  style: {fontSize: '16px'}
                                }});
            }
        }

    }
    
   make_line_chart('graph_' + ce_slug , one_site_data, ce_alias[ce_slug], plotBands)
}


function make_line_chart(container, data, title, plotBands) {
    Highcharts.chart(container, {
        chart: {
            type: 'spline',
            backgroundColor: '#ffffff'
        },
        credits:{
            enabled:false,
        },
        title: {
            text: title,
            floating: true,
            align: 'right',
            className: 'chart_title',
            useHTML:true,
            style: {
                fontSize:'1rem',
                color:'#000',
            }
        },
        legend: {
            enabled: false
        },
        xAxis: {
            type: 'linear', 
            max: 491541,
            minPadding: 0,   
            startOnTick: false,
            title: {
                text: undefined
            },
            labels: {
                style: {
                    color:'#000000'
                },
                formatter: function(){
                    return (this.value / 1000) + ' km';
                }
            }, 
            plotBands: plotBands
        },
        yAxis: {
            visible: false,
            title: {
                text: undefined
            },
            showFirstLabel:false,
        },
        tooltip: {
            //enabled: false,
            //headerFormat: '<b>{series.name}</b><br>',
            //pointFormat: '{point.x} m'
            useHTML:true,
            formatter: function() {
                if ( this.props === undefined ) return false;
                const props = this.props;
                let tmpl = `<h4 style="margin-top:2px">${ce_alias[props.slug_ce]} à ${props.libelle_commune}</h4>`
                tmpl += `Site: <strong>${props.site}</strong><br>`;
                tmpl += `Abscisse: <strong>${Math.round((props.pos)/1000)} km<strong><br>`;
                tmpl += `<table class="tbindic"><tr><th></th><th>min</th><th>max</th></tr>`;
                tmpl += `<tr><th>Débits (m³/s)</th><td>${(props.mindebit/1000).toFixed(2)}</td><td>${(props.maxdebit/1000).toFixed(2)}</td></tr>`;
                tmpl += `<tr><th>Températures (°C)</th><td>${props.mintemp}</td><td>${props.maxtemp}</td></tr>`;
                tmpl += `<tr><th></th><th>moy</th><th>max</th></tr>`
                tmpl += `<tr><th>Pluie (mm)</th><td>${props.avgpluie.toFixed(2)}</td><td>${props.maxpluie.toFixed(2)}</td></tr>`;
                tmpl += `<tr><th>Neige (mm)</th><td>${props.avgneige.toFixed(2)}</td><td>${props.maxneige.toFixed(2)}</td></tr>`;
                tmpl += `</table>`;
                return tmpl;
            }
        },
        series: [{
            lineWidth: 4,

            color: '#00ffcc',
            data: data
        }]
    });
};



function add_div(container_id, div_id, div_class) {
    // 1. Sélectionner le conteneur cible
    const container = document.getElementById(container_id); // ou document.querySelector('.container')

    // 2. Créer l'élément <div>
    const newDiv = document.createElement('div');

    // 3. Ajouter des attributs (classe, id, data-attribute, etc.)
    //newDiv.setAttribute('id', div_id);
    newDiv.id = div_id;
    newDiv.className = 'one_graph';
    //newDiv.classList.add(div_class);

    // 4. Ajouter du contenu texte ou HTML (optionnel)
    //newDiv.textContent = 'Mon texte à l\'intérieur';

    // 5. Insérer le nouveau <div> à l'intérieur du container
    container.prepend(newDiv);
}


function get_ce_long(slug) {
    const one = coursEauData[slug];
    let ltot = 0;
    for ( let d in one ) {
        ltot += one[d]['l'];
    }

    return ltot;
}

function getRandomIntInclusive(min, max) {
  const plafondMinimum = Math.ceil(min);
  const plancherMaximum = Math.floor(max);
  return Math.floor(
    Math.random() * (plancherMaximum - plafondMinimum + 1) + plafondMinimum,
  ); // Le maximum est inclusif et le minimum est inclusif
}
