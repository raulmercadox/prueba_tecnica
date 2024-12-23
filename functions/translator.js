const dictionary = {
    'name': 'nombre',
    'rotation_period': 'periodo_rotacion',
    'orbital_period': 'periodo_orbital',
    'diameter': 'diametro',
    'climate': 'clima',
    'gravity': 'gravedad',
    'terrain': 'terreno',
    'surface_water': 'agua_superficial',
    'population': 'poblacion',
    'residents': 'residentes',
    'films': 'peliculas',
    'created': 'creado',
    'edited': 'editado',
    'url': 'url'
}

function translate(an_object) {
    let translated = {}
    for (let key in an_object) {
        if (dictionary[key]) {
            translated[dictionary[key]] = an_object[key]
        }
    }
    return translated
}

module.exports = {translate};