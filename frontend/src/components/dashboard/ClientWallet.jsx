import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ShieldCheck, Smartphone, History, Car, ChevronRight, Wallet, X, Shield, CheckCircle2, AlertCircle } from '../../utils/icons';
import { api } from '../../services/authService';

const ClientWallet = ({
  user,
  walletBalance,
  transactions,
  upiId,
  upiInput,
  setUpiInput,
  handleLinkUpi,
  getFilteredTransactions,
  searchQuery,
  updateUser,
  onBalanceUpdate
}) => {
  const [depositing, setDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [toast, setToast] = useState(null);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle', 'initiating', 'checkout', 'verifying', 'success', 'failed'

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState('wallet'); // 'wallet' or 'upi'
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Load Razorpay SDK script dynamically when the component mounts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), type === 'success' ? 3000 : 5000);
  };

  const handleAddMoney = () => {
    setDepositAmount('');
    setDepositError('');
    setShowAddMoneyModal(true);
  };

  const handleTransferClick = () => {
    setTransferAmount('');
    setTransferRecipient('');
    setTransferError('');
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e) => {
    if (e) e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError("Please enter a valid positive number.");
      return;
    }
    if (amount > walletBalance) {
      setTransferError("Insufficient wallet balance.");
      return;
    }
    if (transferType === 'wallet' && !transferRecipient.trim()) {
      setTransferError("Please enter recipient email or phone.");
      return;
    }
    if (transferType === 'upi' && !upiId) {
      setTransferError("Please link a UPI ID first on the dashboard.");
      return;
    }

    setTransferError('');
    setTransferring(true);

    try {
      const payload = {
        type: transferType,
        amount,
        recipient: transferType === 'wallet' ? transferRecipient.trim() : upiId
      };

      const response = await api.post('/payment/wallet/transfer', payload);

      if (response.data.success) {
        showToast(response.data.message || 'Transfer completed successfully!', 'success');
        setShowTransferModal(false);
        if (response.data.user) {
          updateUser(response.data.user);
        }
        if (onBalanceUpdate) {
          onBalanceUpdate(response.data.walletBalance);
        }
      }
    } catch (err) {
      console.error('Transfer failed:', err);
      setTransferError(err.response?.data?.message || 'Transfer failed. Please check details.');
    } finally {
      setTransferring(false);
    }
  };

  const handleAddMoneySubmit = async (e) => {
    if (e) e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError("Please enter a valid positive number.");
      return;
    }

    setDepositError('');
    setShowAddMoneyModal(false);
    setDepositing(true);
    setPaymentState('initiating');

    try {
      // 1. Create deposit order in backend
      const response = await api.post('/payment/wallet/deposit', { amount });
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to initiate deposit.');
      }

      const { razorpayOrder } = response.data;

      if (razorpayOrder.key === 'rzp_test_mock' && import.meta.env.MODE === 'development') {
        // Bypass Razorpay modal in mock mode and verify directly
        setPaymentState('verifying');
        try {
          const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 10)}`;
          const mockSignature = `sig_mock_${Math.random().toString(36).substring(2, 10)}`;
          const verifyResponse = await api.post('/payment/wallet/verify', {
            razorpay_payment_id: mockPaymentId,
            razorpay_order_id: razorpayOrder.id,
            razorpay_signature: mockSignature
          });

          if (verifyResponse.data.success) {
            showToast(`Successfully deposited ₹${amount.toLocaleString()} to your wallet!`, 'success');
            setPaymentState('success');
            if (verifyResponse.data.user) {
              updateUser(verifyResponse.data.user);
            }
            if (onBalanceUpdate) {
              onBalanceUpdate(verifyResponse.data.walletBalance);
            }
          }
        } catch (verifyError) {
          console.error('Wallet verification failed:', verifyError);
          showToast(verifyError.response?.data?.message || 'Deposit verification failed.', 'error');
          setPaymentState('failed');
        } finally {
          setDepositing(false);
          setTimeout(() => setPaymentState('idle'), 2000);
        }
        return;
      }

      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        showToast('Razorpay SDK is loading, please try again in a few seconds.', 'error');
        setDepositing(false);
        setPaymentState('idle');
        return;
      }

      setPaymentState('checkout');

      // 2. Open Razorpay checkout
      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'DMS Cab Services',
        description: `Wallet Deposit: ₹${amount.toLocaleString()}`,
        order_id: razorpayOrder.id,
        handler: async (paymentResponse) => {
          try {
            setDepositing(true);
            setPaymentState('verifying');
            // Verify payment
            const verifyResponse = await api.post('/payment/wallet/verify', {
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });

            if (verifyResponse.data.success) {
              showToast(`Successfully deposited ₹${amount.toLocaleString()} to your wallet!`, 'success');
              setPaymentState('success');
              // Update local state / user info
              if (verifyResponse.data.user) {
                updateUser(verifyResponse.data.user);
              }
              if (onBalanceUpdate) {
                onBalanceUpdate(verifyResponse.data.walletBalance);
              }
            }
          } catch (verifyError) {
            console.error('Wallet verification failed:', verifyError);
            showToast(verifyError.response?.data?.message || 'Deposit verification failed.', 'error');
            setPaymentState('failed');
          } finally {
            setDepositing(false);
            setTimeout(() => setPaymentState('idle'), 2000);
          }
        },
        prefill: {
          name: user.fullName || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#003893'
        },
        modal: {
          ondismiss: () => {
            setDepositing(false);
            setPaymentState('idle');
            showToast('Deposit transaction cancelled.', 'info');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Deposit initiation failed:', err);
      showToast(err.response?.data?.message || err.message || 'Deposit failed.', 'error');
      setDepositing(false);
      setPaymentState('failed');
      setTimeout(() => setPaymentState('idle'), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      {/* Left Side: Balance card, credit card, transaction history */}
      <div className="lg:col-span-8 space-y-6">
        <h2 className="text-2xl font-serif font-bold text-slate-800">Wallet Dashboard</h2>

        {/* Balance card */}
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available Balance</span>
            <div className="flex items-center space-x-2 mt-2">
              <h3 className="text-3xl font-serif text-slate-800 font-bold">₹{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <span className="bg-emerald-100 border border-emerald-200 text-emerald-600 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">Secured</span>
            </div>
          </div>

          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              id="wallet-add-money-btn"
              onClick={handleAddMoney}
              disabled={depositing}
              className="flex-1 sm:flex-initial bg-[#003893] hover:bg-[#002d72] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              {depositing ? 'Processing...' : '+ Add Money'}
            </button>
            <button onClick={handleTransferClick} className="flex-1 sm:flex-initial bg-transparent border border-slate-200 hover:bg-slate-100 text-slate-800 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">Transfer</button>
          </div>
        </div>

        {/* Credit card design */}
        <div className="bg-gradient-to-br from-[#003893] to-[#002d72] border border-[#003893]/20 rounded-2xl p-6 relative overflow-hidden h-48 flex flex-col justify-between max-w-sm shadow-md">
          <div className="flex justify-between items-start">
            <div className="text-[10px] text-white/80 uppercase tracking-widest font-mono">DMS CAB SERVICES</div>
            <div className="w-8 h-6 bg-yellow-500/20 rounded border border-yellow-500/30" />
          </div>
          <div className="text-lg font-mono text-white tracking-widest font-bold">•••• •••• •••• 8842</div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[8px] text-white/50 uppercase">Card Holder</p>
              <p className="text-xs text-white font-medium">{user.fullName || 'Pritam Mondal'}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-white/50 uppercase">Expires</p>
              <p className="text-xs text-white font-mono">12/28</p>
            </div>
          </div>
        </div>

        {/* Transaction history list */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Transaction History</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-left">
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {getFilteredTransactions().length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400">
                      {searchQuery ? `No transactions match: "${searchQuery}"` : 'No transactions recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  getFilteredTransactions().map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/50 transition-colors">
                      <td className="py-3.5 font-medium text-slate-800">{t.type}</td>
                      <td className="py-3.5 text-slate-400">{t.date}</td>
                      <td className="py-3.5 font-mono text-slate-400 truncate max-w-[150px]">{t.desc}</td>
                      <td className={`py-3.5 font-bold text-right ${t.minus ? 'text-red-500' : 'text-emerald-600'}`}>{t.amt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Side: rewards, link upi, security */}
      <div className="lg:col-span-4 space-y-6">
        {/* Linked UPI ID */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Link UPI ID</h4>
          <div className="flex space-x-2">
            <input
              id="wallet-upi-input"
              type="text"
              placeholder="alex.rivera@upi"
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              className="flex-1 bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800"
            />
            <button id="wallet-upi-link-btn" onClick={handleLinkUpi} className="bg-[#003893] hover:bg-[#002d72] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm">Link</button>
          </div>
          {upiId && (
            <p className="text-[10px] text-emerald-600 font-semibold">Active: {upiId}</p>
          )}
        </div>

        {/* Trust & Security info */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Trust & Security</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-sans">Your credit card data is encrypted using military-grade AES-256 standard protocols. DMS Cab Services never stores CVV code records on its servers.</p>
        </div>
      </div>

      {/* Add Money Modal */}
      <AnimatePresence>
        {showAddMoneyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 relative text-left"
            >
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={18} />
              </button>

              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003893] flex items-center justify-center border border-blue-100 shadow-sm">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900">Wallet Top-up</h3>
                  <p className="text-[10px] text-slate-400">Instantly deposit funds using Razorpay</p>
                </div>
              </div>

              <form onSubmit={handleAddMoneySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Enter Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                    <input
                      id="deposit-amount-input"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value);
                        if (depositError) setDepositError('');
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl py-3 pl-8 pr-4 text-slate-900 font-bold text-sm"
                      placeholder="500"
                      autoFocus
                    />
                  </div>
                  {depositError && <p className="text-red-500 text-[10px] mt-1.5 flex items-center"><AlertCircle size={12} className="mr-1" /> {depositError}</p>}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setDepositAmount(amt.toString());
                        setDepositError('');
                      }}
                      className="bg-slate-50 border border-slate-200 hover:border-[#003893] hover:bg-blue-50 text-slate-700 hover:text-[#003893] font-bold py-2 rounded-xl text-xs transition-all shadow-sm"
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#003893] hover:bg-[#002d72] text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Deposit</span>
                  <ChevronRight size={14} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Money Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 relative text-left"
            >
              <button
                onClick={() => setShowTransferModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003893] flex items-center justify-center border border-blue-100 shadow-sm">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900">Transfer Wallet Funds</h3>
                  <p className="text-[10px] text-slate-400">Withdraw to UPI or send to another DMS user</p>
                </div>
              </div>

              {/* Transfer Type Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setTransferType('wallet'); setTransferError(''); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    transferType === 'wallet' ? 'bg-white text-[#003893] shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700 font-semibold'
                  }`}
                >
                  To DMS User
                </button>
                <button
                  type="button"
                  onClick={() => { setTransferType('upi'); setTransferError(''); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    transferType === 'upi' ? 'bg-white text-[#003893] shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700 font-semibold'
                  }`}
                >
                  To Linked UPI
                </button>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                {transferType === 'wallet' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Recipient Email or Phone</label>
                    <input
                      type="text"
                      value={transferRecipient}
                      onChange={(e) => {
                        setTransferRecipient(e.target.value);
                        if (transferError) setTransferError('');
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl py-2.5 px-4 text-slate-900 text-xs"
                      placeholder="driver@dms.com or 10-digit mobile number"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Destination UPI ID</label>
                    {upiId ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-emerald-600 flex items-center justify-between">
                        <span>{upiId}</span>
                        <span className="text-[9px] uppercase bg-emerald-100 px-2 py-0.5 rounded-full">Linked</span>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-rose-600">
                        No UPI ID linked. Please link one on the dashboard first.
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => {
                        setTransferAmount(e.target.value);
                        if (transferError) setTransferError('');
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-[#003893] focus:outline-none rounded-xl py-2.5 pl-8 pr-4 text-slate-900 font-bold text-xs"
                      placeholder="200"
                      required
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Available balance: ₹{walletBalance.toLocaleString()}</p>
                  {transferError && <p className="text-red-500 text-[10px] mt-1.5 flex items-center"><AlertCircle size={12} className="mr-1" /> {transferError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={transferring || (transferType === 'upi' && !upiId)}
                  className="w-full bg-[#003893] hover:bg-[#002d72] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{transferring ? 'Processing...' : 'Confirm Transfer'}</span>
                  <ChevronRight size={14} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing/Loader Overlay */}
      <AnimatePresence>
        {depositing && paymentState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-slate-100"
            >
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-[#003893]/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-[#003893] rounded-full animate-spin"></div>
                <Shield className="text-[#003893]" size={30} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {paymentState === 'initiating' && 'Initiating Secured Deposit...'}
                  {paymentState === 'checkout' && 'Awaiting Deposit Payment...'}
                  {paymentState === 'verifying' && 'Verifying Wallet Credit...'}
                  {paymentState === 'success' && 'Deposit Approved!'}
                  {paymentState === 'failed' && 'Deposit Failed'}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto font-sans">
                  {paymentState === 'initiating' && 'Creating payment order on secured servers. Please hold.'}
                  {paymentState === 'checkout' && 'Please complete the payment in the opened Razorpay portal.'}
                  {paymentState === 'verifying' && 'Validating signature ledger and updating wallet balance. Do not refresh.'}
                  {paymentState === 'success' && 'Your wallet balance has been successfully credited.'}
                  {paymentState === 'failed' && 'An error occurred during verification. Please check your banking ledger.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl border text-sm font-sans min-w-[320px] max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : toast.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="text-rose-500 flex-shrink-0" size={18} />}
            {toast.type === 'success' && <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />}
            {toast.type === 'info' && <AlertCircle className="text-blue-500 flex-shrink-0" size={18} />}
            <div className="flex-grow">{toast.message}</div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors font-bold text-lg">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientWallet;
