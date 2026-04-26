// tests/appState.test.js

const fs = require('fs');
const path = require('path');

const AppState = require('../logic/appState');

describe('AppState', () => {
    let appState;

    beforeEach(() => {
        appState = new AppState();
    });

    it('should initialize with default values', () => {
        expect(appState.activePersona).toBeNull();
        expect(appState.currentStep).toBe(1);
        expect(appState.stepState).toEqual({});
        expect(appState.isAiThinking).toBe(false);
    });

    it('should notify listeners on persona change', () => {
        const listener = jest.fn();
        appState.subscribe(listener);

        appState.setPersona('first-time');

        expect(appState.activePersona).toBe('first-time');
        expect(listener).toHaveBeenCalledWith(appState);
    });

    it('should enforce sequential step progression', () => {
        appState.setStep(2); // Valid (1 -> 2)
        expect(appState.currentStep).toBe(2);

        appState.setStep(4); // Invalid (2 -> 4)
        expect(appState.currentStep).toBe(2); // Should remain 2
        
        appState.setStep(1); // Valid (going back)
        expect(appState.currentStep).toBe(1);
    });

    it('should toggle boolean step state', () => {
        appState.toggleStepState('doc1');
        expect(appState.stepState['doc1']).toBe(true);
        
        appState.toggleStepState('doc1');
        expect(appState.stepState['doc1']).toBe(false);
    });

    it('should update step state with specific value', () => {
        appState.setStepState('testKey', 'testValue');
        expect(appState.stepState['testKey']).toBe('testValue');
    });

    it('should set AI thinking status', () => {
        appState.setAiThinking(true);
        expect(appState.isAiThinking).toBe(true);
        appState.setAiThinking(false);
        expect(appState.isAiThinking).toBe(false);
    });

    it('should update language and notify listeners', () => {
        const listener = jest.fn();
        appState.subscribe(listener);
        appState.setLanguage('hi');
        expect(appState.language).toBe('hi');
        expect(listener).toHaveBeenCalledWith(appState);
    });

    it('should toggle voice enabled and notify listeners', () => {
        const listener = jest.fn();
        appState.subscribe(listener);
        appState.setVoiceEnabled(true);
        expect(appState.voiceEnabled).toBe(true);
        expect(listener).toHaveBeenCalledWith(appState);
    });
});
