// tests/civicService.test.js

const CivicService = require('../services/civicService');

// Mock Config
global.Config = {
    getCivicKey: jest.fn(() => 'test-key')
};

// Mock fetch
global.fetch = jest.fn();
global.AbortSignal = { timeout: jest.fn() };

describe('CivicService', () => {
    let service;

    beforeEach(() => {
        service = new CivicService();
        jest.clearAllMocks();
    });

    describe('getElections', () => {
        it('should return cached data if available', async () => {
            service.cache.set('elections', [{ id: '1', name: 'Test Election' }]);
            const result = await service.getElections();
            expect(result).toEqual([{ id: '1', name: 'Test Election' }]);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should fetch and return elections from API', async () => {
            const mockResponse = { elections: [{ id: '1', name: 'API Election' }] };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockResponse)
            });

            const result = await service.getElections();
            expect(result).toEqual(mockResponse.elections);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://www.googleapis.com/civicinfo/v2/elections?key=test-key',
                expect.any(Object)
            );
        });

        it('should return fallback data on API error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            const result = await service.getElections();
            expect(result[0].isFallback).toBe(true);
        });

        it('should return fallback if no API key', async () => {
            Config.getCivicKey.mockReturnValueOnce('');
            const result = await service.getElections();
            expect(result[0].isFallback).toBe(true);
        });

        it('should return fallback if response is not ok', async () => {
            global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
            const result = await service.getElections();
            expect(result[0].isFallback).toBe(true);
        });
    });

    describe('getVoterInfo', () => {
        it('should return error for invalid address', async () => {
            const result = await service.getVoterInfo('a'); // too short
            expect(result.error).toBe('Please provide a valid address.');
        });

        it('should fetch voter info for valid address', async () => {
            const mockResponse = { normalizedInput: { city: 'Test City' } };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockResponse)
            });

            const result = await service.getVoterInfo('Test Address');
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalled();
        });

        it('should return error if no API key', async () => {
            Config.getCivicKey.mockReturnValueOnce('');
            const result = await service.getVoterInfo('Test Address');
            expect(result.error).toBe('Civic API key not configured.');
        });

        it('should return error if response is not ok', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: jest.fn().mockResolvedValueOnce({ error: { message: 'Bad request' } })
            });
            const result = await service.getVoterInfo('Test Address');
            expect(result.error).toBe('Bad request');
        });

        it('should handle fetch rejection', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network Error'));
            const result = await service.getVoterInfo('Test Address');
            expect(result.error).toBe('Network error fetching voter info.');
        });
    });

    describe('getRepresentatives', () => {
        it('should return error for invalid address', async () => {
            const result = await service.getRepresentatives('a');
            expect(result.error).toBe('Please provide a valid address.');
        });

        it('should return error if no API key', async () => {
            Config.getCivicKey.mockReturnValueOnce('');
            const result = await service.getRepresentatives('Test Address');
            expect(result.error).toBe('Civic API key not configured.');
        });

        it('should fetch representatives for valid address', async () => {
            const mockResponse = { officials: [] };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValueOnce(mockResponse)
            });
            const result = await service.getRepresentatives('Test Address');
            expect(result).toEqual(mockResponse);
        });

        it('should handle fetch error response', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: jest.fn().mockResolvedValueOnce({ error: { message: 'Server error' } })
            });
            const result = await service.getRepresentatives('Test Address');
            expect(result.error).toBe('Server error');
        });

        it('should handle fetch rejection', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            const result = await service.getRepresentatives('Test Address');
            expect(result.error).toBe('Network error fetching representatives.');
        });
    });

    describe('clearCache', () => {
        it('should clear the cache', () => {
            service.cache.set('test', 'value');
            service.clearCache();
            expect(service.cache.size).toBe(0);
        });
    });
});
