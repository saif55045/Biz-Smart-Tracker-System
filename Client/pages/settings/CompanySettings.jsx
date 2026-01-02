/**
 * Company Settings Page
 * 
 * Allows admins to configure:
 * - Currency (PKR, INR, USD)
 * - Absence deduction amount
 * - Half-day deduction amount
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../src/config';
import { useCurrency } from '../../context/CurrencyContext';
import './CompanySettings.css';

const CompanySettings = () => {
    const { refreshSettings } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [settings, setSettings] = useState({
        currency: 'USD',
        absenceDeduction: 0,
        halfDayDeduction: 0,
        lateDeduction: 0
    });

    const currencies = [
        { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs.' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'USD', name: 'US Dollar', symbol: '$' }
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${config.API_URL}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                setSettings({
                    currency: response.data.currency || 'USD',
                    absenceDeduction: response.data.absenceDeduction || 0,
                    halfDayDeduction: response.data.halfDayDeduction || 0,
                    lateDeduction: response.data.lateDeduction || 0
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            const token = localStorage.getItem('token');

            await axios.put(`${config.API_URL}/settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            refreshSettings(); // Update context
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: field === 'currency' ? value : Math.max(0, Number(value) || 0)
        }));
    };

    const selectedCurrency = currencies.find(c => c.code === settings.currency) || currencies[2];

    if (loading) {
        return (
            <div className="settings-loading">
                <div className="spinner"></div>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="company-settings-container">
            <div className="settings-header">
                <h1>Company Settings</h1>
                <p>Configure currency and employee deduction rules</p>
            </div>

            {message.text && (
                <div className={`settings-message ${message.type}`}>
                    <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                    {message.text}
                </div>
            )}

            <div className="settings-grid">
                {/* Currency Section */}
                <div className="settings-card">
                    <div className="card-header">
                        <i className="fas fa-coins"></i>
                        <h2>Currency</h2>
                    </div>
                    <p className="card-description">
                        Select the currency used throughout the system for prices, salaries, and reports.
                    </p>

                    <div className="currency-options">
                        {currencies.map(curr => (
                            <div
                                key={curr.code}
                                className={`currency-option ${settings.currency === curr.code ? 'selected' : ''}`}
                                onClick={() => handleChange('currency', curr.code)}
                            >
                                <span className="currency-symbol">{curr.symbol}</span>
                                <span className="currency-code">{curr.code}</span>
                                <span className="currency-name">{curr.name}</span>
                                {settings.currency === curr.code && (
                                    <i className="fas fa-check selected-icon"></i>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="preview-box">
                        <span className="preview-label">Preview:</span>
                        <span className="preview-value">{selectedCurrency.symbol}10,000</span>
                    </div>
                </div>

                {/* Deduction Section */}
                <div className="settings-card">
                    <div className="card-header">
                        <i className="fas fa-user-minus"></i>
                        <h2>Absence Deductions</h2>
                    </div>
                    <p className="card-description">
                        Configure how much to deduct from employee salary for absences.
                    </p>

                    <div className="deduction-inputs">
                        <div className="input-group">
                            <label>
                                <i className="fas fa-calendar-times"></i>
                                Full Day Absence
                            </label>
                            <div className="input-with-symbol">
                                <span className="symbol">{selectedCurrency.symbol}</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.absenceDeduction}
                                    onChange={(e) => handleChange('absenceDeduction', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <span className="input-hint">Deducted per full day absent</span>
                        </div>

                        <div className="input-group">
                            <label>
                                <i className="fas fa-clock"></i>
                                Half Day Absence
                            </label>
                            <div className="input-with-symbol">
                                <span className="symbol">{selectedCurrency.symbol}</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.halfDayDeduction}
                                    onChange={(e) => handleChange('halfDayDeduction', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <span className="input-hint">Deducted per half day absent</span>
                        </div>

                        <div className="input-group">
                            <label>
                                <i className="fas fa-hourglass-half"></i>
                                Late Arrival
                            </label>
                            <div className="input-with-symbol">
                                <span className="symbol">{selectedCurrency.symbol}</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.lateDeduction}
                                    onChange={(e) => handleChange('lateDeduction', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <span className="input-hint">Deducted per late arrival</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-actions">
                <button
                    className="save-btn"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Saving...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-save"></i>
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CompanySettings;
