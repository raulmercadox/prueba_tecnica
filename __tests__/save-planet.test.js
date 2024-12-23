const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const awsMock = require('aws-sdk-mock');
const fetchMock = require('jest-fetch-mock');
const { handler } = require('../functions/save-planet');

fetchMock.enableMocks();

describe('save-planet Lambda', () => {
    beforeAll(() => {
        // Configurar variables de entorno
        process.env.PLANET_TABLE = 'TestPlanetTable';
        process.env.SWAPI_URL = 'https://swapi.py4e.com/api';
        process.env.AWS_REGION = 'us-east-1'; // Configura la región aquí

        awsMock.setSDKInstance(AWS);
        AWS.config.update({ region: 'us-east-1' });
    });

    beforeEach(() => {
        awsMock.restore();
        fetchMock.resetMocks();
    });

    it('should return 403 if planet already exists', async () => {
        awsMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            expect(params.TableName).toBe('TestPlanetTable');
            callback(null, { Item: { id: '1', name: 'Tatooine' } });
        });

        const event = { pathParameters: { id: '1' } };
        const result = await handler(event);

        expect(result.statusCode).toBe(403);
    });

    it('should save a new planet if it does not exist', async () => {
        awsMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            expect(params.TableName).toBe('TestPlanetTable');
            callback(null, {});
        });

        fetchMock.mockResponseOnce(JSON.stringify({ name: 'Dagobah' }));

        awsMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
            expect(params.TableName).toBe('TestPlanetTable');
            callback(null, {});
        });

        const event = { pathParameters: { id: '2' } };
        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toBe('Planeta guardado satisfactoriamente');
    });

    it('should return 404 if planet is not found in SWAPI', async () => {
        awsMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            expect(params.TableName).toBe('TestPlanetTable');
            callback(null, {});
        });

        fetchMock.mockResponseOnce(null, { status: 404 });

        const event = { pathParameters: { id: '3' } };
        const result = await handler(event);

        expect(result.statusCode).toBe(404);
    });

    it('should handle errors gracefully', async () => {
        awsMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            expect(params.TableName).toBe('TestPlanetTable');
            callback(new Error('DynamoDB error'));
        });

        const event = { pathParameters: { id: '1' } };
        const result = await handler(event);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).message).toBe('DynamoDB error');
    });
});
