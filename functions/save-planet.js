const { SWAPI_URL, PLANET_TABLE } = process.env;
const { translate } = require('./translator');
const aws = require('aws-sdk');
const dynamodb = new aws.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

module.exports.handler = async (event, context) => {
    try {
        // Obtener el id del planeta
        const planetId = event.pathParameters.id

        console.log('PLANET_TABLE:', process.env.PLANET_TABLE);

        // Verificar si ya existe en la tabla PLANET_TABLE
        const params = {
            TableName: process.env.PLANET_TABLE,
            Key: {
                id: planetId
            }
        }

        console.log('DynamoDB Params:', params); // Agrega este log

        const result = await dynamodb.get(params).promise();
        let planet = result.Item;

        if (planet) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: "Planeta ya existe" })
            }
        }

        // llamar a la API de Star Wars
        const response = await fetch(`${SWAPI_URL}/planets/${planetId}`);
        planet = await response.json();

        if (!planet) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Planeta no encontrado" })
            }
        }

        // Traducir los campos
        const planetTranslated = translate(planet);
        planetTranslated.id = planetId;

        // Grabar en DynamoDB
        const paramsInsert = {
            TableName: PLANET_TABLE,
            Item: planetTranslated
        }

        await dynamodb.put(paramsInsert).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({message: "Planeta guardado satisfactoriamente"})
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    }
}