import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCurrency } from '../../context/CurrencyContext';
import config from '../../src/config';
import Button from '../../components/Button';
import './InvoiceView.css';

const InvoiceView = () => {
    const { invoiceId } = useParams();
    const navigate = useNavigate();
    const { formatMoney } = useCurrency();
    const [invoice, setInvoice] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [company, setCompany] = useState(null);
    const printRef = useRef();

    useEffect(() => {
        if (invoiceId) fetchData();
    }, [invoiceId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            const res = await axios.get(`${config.API_URL}/sales/${invoiceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvoice(res.data);

            if (res.data.customerId) {
                const custId = typeof res.data.customerId === 'object' ? res.data.customerId._id : res.data.customerId;
                const custRes = await axios.get(`${config.API_URL}/customers/${custId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCustomer(custRes.data);
            }

            const userRes = await axios.get(`${config.API_URL}/user/current-user`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompany({
                name: userRes.data.company_name,
                address: userRes.data.address || '',
                phone: userRes.data.phone_number || '',
                email: userRes.data.email || ''
            });

            setError('');
        } catch (err) {
            setError('Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
        if (parseFloat(paymentAmount) > invoice.remainingAmount) return;

        try {
            setProcessing(true);
            const token = localStorage.getItem('token');
            await axios.put(`${config.API_URL}/sales/${invoiceId}/payment`, {
                amount: parseFloat(paymentAmount),
                note: paymentNote
            }, { headers: { Authorization: `Bearer ${token}` } });

            fetchData();
            setShowModal(false);
            setPaymentAmount('');
            setPaymentNote('');
        } catch (err) {
            setError('Payment failed');
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const statusClass = (s) => s === 'paid' ? 'paid' : s === 'partial' ? 'partial' : 'unpaid';
    const statusText = (s) => s === 'paid' ? 'PAID' : s === 'partial' ? 'PARTIAL' : 'UNPAID';

    if (loading) return <div className="inv-page"><div className="inv-loading">Loading...</div></div>;
    if (error && !invoice) return <div className="inv-page"><div className="inv-error">{error}</div></div>;

    return (
        <div className="inv-page">
            <div className="inv-actions">
                <Button onClick={() => navigate('/customers')}>Back</Button>
                <Button onClick={handlePrint}>Print</Button>
                {invoice?.remainingAmount > 0 && <Button onClick={() => setShowModal(true)}>Pay</Button>}
            </div>

            {error && <div className="inv-alert">{error}</div>}

            <div className="inv-card" ref={printRef}>
                <div className="inv-header">
                    <h1>Invoice</h1>
                    {company && (
                        <div className="inv-company">
                            <strong>{company.name}</strong>
                            <span>{company.address}</span>
                            <span>Phone: {company.phone}</span>
                            <span>Email: {company.email}</span>
                        </div>
                    )}
                </div>

                {invoice && (
                    <>
                        <div className="inv-details">
                            <div className="inv-box">
                                <h3>Invoice Details</h3>
                                <p><label>Invoice #:</label>{invoiceId}</p>
                                <p><label>Date:</label>{formatDate(invoice.createdAt)}</p>
                                <div className={`inv-status ${statusClass(invoice.paymentStatus)}`}>
                                    {statusText(invoice.paymentStatus)}
                                </div>
                            </div>
                            <div className="inv-box">
                                <h3>Customer Details</h3>
                                {customer ? (
                                    <>
                                        <p><label>Name:</label>{customer.name}</p>
                                        <p><label>Phone:</label>{customer.phoneNumber}</p>
                                        {customer.email && <p><label>Email:</label>{customer.email}</p>}
                                        {customer.address && <p><label>Address:</label>{customer.address}</p>}
                                    </>
                                ) : <p>Walk-in Customer</p>}
                            </div>
                        </div>

                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.products?.map((item, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{item.productId?.name || 'Unknown'}</td>
                                        <td>{formatMoney(item.price)}</td>
                                        <td>{item.quantity}</td>
                                        <td>{formatMoney(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr><td colSpan="4">Total:</td><td>{formatMoney(invoice.totalAmount)}</td></tr>
                                <tr><td colSpan="4">Paid:</td><td>{formatMoney(invoice.paidAmount)}</td></tr>
                                <tr className="inv-balance"><td colSpan="4">Balance:</td><td>{formatMoney(invoice.remainingAmount)}</td></tr>
                            </tfoot>
                        </table>

                        {invoice.paymentHistory?.length > 0 && (
                            <div className="inv-history">
                                <h3>Payment History</h3>
                                <table>
                                    <thead><tr><th>Date</th><th>Amount</th><th>Note</th></tr></thead>
                                    <tbody>
                                        {invoice.paymentHistory.map((p, i) => (
                                            <tr key={i}>
                                                <td>{formatDate(p.date)}</td>
                                                <td>{formatMoney(p.amount)}</td>
                                                <td>{p.note || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="inv-footer">Thank you for your business!</div>
                    </>
                )}
            </div>

            {showModal && (
                <div className="inv-modal-bg">
                    <div className="inv-modal">
                        <h2>Make Payment</h2>
                        <form onSubmit={handlePayment}>
                            <div className="inv-field">
                                <label>Balance</label>
                                <div className="inv-balance-display">{formatMoney(invoice.remainingAmount)}</div>
                            </div>
                            <div className="inv-field">
                                <label>Amount</label>
                                <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required min="0.01" max={invoice.remainingAmount} />
                            </div>
                            <div className="inv-field">
                                <label>Note</label>
                                <textarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} rows="2" />
                            </div>
                            <div className="inv-modal-actions">
                                <Button type="submit" disabled={processing}>{processing ? 'Processing...' : 'Pay'}</Button>
                                <Button type="button" onClick={() => setShowModal(false)} secondary>Cancel</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceView;
