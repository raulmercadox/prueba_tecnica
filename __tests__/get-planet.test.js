const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const awsMock = require('aws-sdk-mock');
const fetchMock = require('jest-fetch-mock');
const { handler } = require('../functions/get-planet');

fetchMock.enableMocks();

describe('get-planet Lambda', () => {
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

    it('should return a planet from DynamoDB if it exists', async () => {
        // Mock DynamoDB get call
        awsMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            expect(params.TableName).toBe('TestPlanetTable');
            callback(null, { Item: { id: '1', name: 'Tatooine' } });
        });

        const event = { pathParameters: { id: '1' } };
        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(result.body).toBe(JSON.stringify({ id: '1', name: 'Tatooine' }));
    });

    it('should fetch a planet from SWAPI if not in DynamoDB', async () => {
        // Mock DynamoDB get call
        awsMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            expect(params.TableName).toBe('TestPlanetTable');
            callback(null, {});
        });

        // Mock SWAPI fetch call
        fetchMock.mockResponseOnce(JSON.stringify({ name: 'Dagobah' }));

        const event = { pathParameters: { id: '2' } };
        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).name).toBe('Dagobah');
    });

    it('should return 404 if planet is not found in SWAPI', async () => {
        // Mock DynamoDB get call
        awsMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
            expect(params.TableName).toBe('TestPlanetTable');
            callback(null, {});
        });

        // Mock SWAPI fetch call
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
